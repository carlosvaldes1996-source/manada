import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { generateResetPasswordTokenWorkflow } from "@medusajs/core-flows";
import crypto from "crypto";

/**
 * LÓGICA CENTRAL ÚNICA de invitado → cuenta (API.md §17, D82).
 *
 * Un solo camino de código para los dos disparadores, para que no puedan divergir:
 *
 *  - `trigger: "job"`   → `jobs/send-account-activations.ts` (D65): ~2 h después de
 *    una compra de invitado que nunca se registró. El invitado llega por `customerId`
 *    (el de la orden).
 *  - `trigger: "claim"` → `POST /store/account/register` (§17.3): el propio invitado
 *    pide crear cuenta con ese correo. El invitado se resuelve POR CORREO.
 *
 * ── Qué hace exactamente (y qué NO) ──────────────────────────────────────────
 *
 * ADOPTAR ≠ FUSIONAR. Nunca se crea un segundo `customer` ni se mueve una sola fila:
 * se trabaja sobre el `customer_id` que ya existe, así que las 12 tablas que lo
 * referencian (órdenes, direcciones, links de mascota/suscripción, `saved_card`,
 * `flow_customer`, `customer_account_holder`…) quedan intactas. Nada de pago se
 * reasigna ni se recalcula.
 *
 * **No marca `has_account`.** Esta función solo deja la identidad emailpass creada y
 * ligada al invitado, con una contraseña ALEATORIA que nadie conoce → el vínculo nace
 * INERTE: la única forma de entrar es el enlace que se envía por correo. La adopción
 * se consuma en `POST /store/account/confirm`, ya autenticado (§17.2) — o sea, solo
 * después de demostrar posesión del correo.
 *
 * IDEMPOTENTE y NO BLOQUEANTE: la UNIQUE de `provider_identity (entity_id, provider)`
 * hace que el segundo intento falle limpio → `already_account`; cualquier error se
 * traga y se loguea (nunca afecta la orden, el pago ni otros subscribers).
 */

export type ProvisionOutcome =
  | "provisioned" // identidad ligada + email de activación en camino
  | "already_pending" // ya se envió activación y sigue sin usarse → no se reenvía
  | "already_account" // el correo ya tiene cuenta → no-op
  | "no_guest" // no hay invitado que adoptar (solo `claim`)
  | "skipped" // faltan datos → no-op
  | "error"; // fallo controlado (jamás propaga)

export type ProvisionTrigger = "job" | "claim";

export interface ProvisionInput {
  email?: string | null;
  /** Invitado ya conocido (camino `job`: el `customer_id` de la orden). */
  customerId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  trigger: ProvisionTrigger;
}

type CustomerRow = { id: string; has_account?: boolean; email?: string };

type AuthServiceLike = {
  register: (
    provider: string,
    data: { body: { email: string; password: string } },
  ) => Promise<{
    success: boolean;
    authIdentity?: { id: string; app_metadata?: Record<string, unknown> | null };
    error?: string;
  }>;
  updateAuthIdentities: (data: { id: string; app_metadata: Record<string, unknown> }) => Promise<unknown>;
};

type CustomerServiceLike = {
  retrieveCustomer: (id: string) => Promise<CustomerRow | null>;
  listCustomers: (filters: Record<string, unknown>) => Promise<CustomerRow[]>;
  updateCustomers: (id: string, data: Record<string, unknown>) => Promise<unknown>;
};

/**
 * Resuelve las dos filas posibles de un correo SIN depender de un orden implícito.
 *
 * Medusa permite exactamente dos: `UNIQUE (email, has_account) WHERE deleted_at IS NULL`.
 * `findOrCreateCustomerStep` toma `[customer]` del listado y por eso es ambiguo cuando
 * coexisten (API.md §17.6); aquí se distingue SIEMPRE por `has_account` explícito.
 */
export async function resolveCustomersByEmail(
  customerService: CustomerServiceLike,
  email: string,
): Promise<{ registered?: CustomerRow; guest?: CustomerRow }> {
  const rows = await customerService.listCustomers({ email });
  return {
    registered: rows.find((c) => c.has_account),
    guest: rows.find((c) => !c.has_account),
  };
}

export async function provisionAccount(
  container: MedusaContainer,
  input: ProvisionInput,
): Promise<ProvisionOutcome> {
  const email = input.email?.trim().toLowerCase();
  if (!email) return "skipped";

  const authService = container.resolve(Modules.AUTH) as unknown as AuthServiceLike;
  const customerService = container.resolve(Modules.CUSTOMER) as unknown as CustomerServiceLike;
  const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE) as {
    projectConfig: { http: { jwtSecret: string; jwtOptions?: Record<string, unknown> } };
  };

  try {
    // (1) Localizar al invitado y descartar que el correo ya tenga cuenta.
    //     Se mira SIEMPRE por correo, incluso en el camino `job`: si ya existe una
    //     fila registrada, marcar al invitado reventaría la UNIQUE (email, has_account).
    const { registered, guest: guestByEmail } = await resolveCustomersByEmail(customerService, email);
    if (registered) return "already_account";

    let guest = guestByEmail;
    if (input.customerId) {
      const byId = await customerService.retrieveCustomer(input.customerId).catch(() => null);
      if (byId?.has_account) return "already_account";
      guest = byId ?? guest;
    }
    if (!guest) return input.trigger === "claim" ? "no_guest" : "skipped";

    // (2) Crear/reclamar la identidad emailpass con una contraseña ALEATORIA no usable.
    //
    //     Comportamiento REAL del provider emailpass (verificado en su `register`):
    //       · no existe             → la crea (única vez que se paga el scrypt);
    //       · existe SIN `app_metadata` (aún "claimable") → le PISA la contraseña y
    //         devuelve éxito;
    //       · existe CON `app_metadata` → `success: false` y sale antes de hashear.
    //
    //     Como en (1) ya descartamos que haya cuenta con ese correo, un `success:false`
    //     solo puede significar "identidad ligada a ESTE invitado por una pasada
    //     anterior" → hay una activación pendiente de clic.
    const randomPassword = crypto.randomBytes(24).toString("base64url");
    const reg = await authService.register("emailpass", { body: { email, password: randomPassword } });

    if (!reg.success || !reg.authIdentity) {
      // El job no reenvía: si no lo hiciéramos así, cada barrido (15 min) mandaría
      // otro correo durante toda la ventana de recuperación.
      if (input.trigger === "job") return "already_pending";
      // El cliente SÍ lo pidió, y el token anterior vence a los 15 min: se emite uno
      // fresco más abajo. La identidad ya está ligada, no hay nada que crear.
    } else {
      // (3) Ligar la identidad al invitado. NO se toca `has_account`: el vínculo queda
      //     inerte hasta que el cliente use el enlace del correo (§17.2).
      const appMetadata = { ...(reg.authIdentity.app_metadata ?? {}) };
      if (!appMetadata.customer_id) {
        appMetadata.customer_id = guest.id;
        await authService.updateAuthIdentities({ id: reg.authIdentity.id, app_metadata: appMetadata });
      }
    }

    // (4) Nombre del formulario de registro, si el invitado no traía (nace sin nombre).
    const profile: Record<string, unknown> = {};
    if (input.firstName?.trim()) profile.first_name = input.firstName.trim();
    if (input.lastName?.trim()) profile.last_name = input.lastName.trim();
    if (Object.keys(profile).length > 0) {
      await customerService.updateCustomers(guest.id, profile).catch(() => undefined);
    }

    // (5) Token de contraseña (workflow oficial) → email "Define tu contraseña".
    await generateResetPasswordTokenWorkflow(container).run({
      input: {
        entityId: email,
        actorType: "customer",
        provider: "emailpass",
        secret: config.projectConfig.http.jwtSecret,
        jwtOptions: config.projectConfig.http.jwtOptions,
        // Marca para que el subscriber use el correo de ACTIVACIÓN (no el de reset).
        metadata: { activation: true, first_name: input.firstName ?? undefined },
      },
      throwOnError: false,
    });

    return "provisioned";
  } catch (e) {
    console.error(`[cuenta] No se pudo provisionar la cuenta para ${email}:`, e);
    return "error";
  }
}

/**
 * Compat: firma original de D65 (el job la usaba con el customer de la orden).
 * @deprecated usar `provisionAccount({ …, trigger: "job" })`.
 */
export function provisionAccountForOrder(
  container: MedusaContainer,
  args: { email?: string | null; customerId?: string | null; firstName?: string | null },
): Promise<ProvisionOutcome> {
  return provisionAccount(container, { ...args, trigger: "job" });
}
