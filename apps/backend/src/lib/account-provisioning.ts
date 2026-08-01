import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { generateResetPasswordTokenWorkflow } from "@medusajs/core-flows";
import crypto from "crypto";

/**
 * Auto-provisión de cuenta a partir de una compra de INVITADO (obj 4).
 *
 * Convierte el correo del checkout en una CUENTA reclamable, para que la compra
 * quede clara y consistente en "Mi cuenta" sin pasos ambiguos. Usa la mecánica
 * nativa de Medusa 2.16 (identidades "claimable": una identidad emailpass sin actor
 * asignado se puede reclamar):
 *
 *  1) `auth.register("emailpass", …)` con una contraseña ALEATORIA (que el cliente
 *     nunca usa) → crea/reclama la identidad emailpass del correo.
 *  2) `auth.updateAuthIdentities` enlaza la identidad al `customer_id` de la orden
 *     (`app_metadata.customer_id`) + `customer.has_account = true`.
 *  3) `generateResetPasswordTokenWorkflow` emite `auth.password_reset` con
 *     `metadata.activation` → el subscriber envía el email "Define tu contraseña".
 *
 * IDEMPOTENTE y NO BLOQUEANTE: si el correo ya tiene cuenta (compra logueada, o una
 * compra previa ya la creó) → no-op; cualquier error se traga y se loguea (nunca
 * afecta la orden, el pago ni otros subscribers). La contraseña real la fija el
 * cliente por el enlace del correo (no conocemos ni exponemos la aleatoria).
 */

export type ProvisionOutcome =
  | "provisioned" // cuenta creada + email de activación en camino
  | "already_account" // el correo ya tiene cuenta → no-op
  | "skipped" // faltan datos (sin correo/customer) → no-op
  | "error"; // fallo controlado (jamás propaga)

type AuthServiceLike = {
  register: (
    provider: string,
    data: { body: { email: string; password: string } },
  ) => Promise<{ success: boolean; authIdentity?: { id: string; app_metadata?: Record<string, unknown> | null }; error?: string }>;
  updateAuthIdentities: (data: { id: string; app_metadata: Record<string, unknown> }) => Promise<unknown>;
};

type CustomerServiceLike = {
  retrieveCustomer: (id: string) => Promise<{ id: string; has_account?: boolean } | null>;
  updateCustomers: (id: string, data: { has_account: boolean }) => Promise<unknown>;
};

export async function provisionAccountForOrder(
  container: MedusaContainer,
  args: { email?: string | null; customerId?: string | null; firstName?: string | null },
): Promise<ProvisionOutcome> {
  const email = args.email?.trim().toLowerCase();
  const customerId = args.customerId ?? undefined;
  if (!email || !customerId) return "skipped";

  const authService = container.resolve(Modules.AUTH) as unknown as AuthServiceLike;
  const customerService = container.resolve(Modules.CUSTOMER) as unknown as CustomerServiceLike;
  const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE) as {
    projectConfig: { http: { jwtSecret: string; jwtOptions?: Record<string, unknown> } };
  };

  try {
    // Ya tiene cuenta (compra logueada / provisión previa) → no-op.
    const customer = await customerService.retrieveCustomer(customerId).catch(() => null);
    if (customer?.has_account) return "already_account";

    // (1) Crear/reclamar la identidad emailpass con una contraseña aleatoria no usable.
    const randomPassword = crypto.randomBytes(24).toString("base64url");
    const reg = await authService.register("emailpass", { body: { email, password: randomPassword } });
    if (!reg.success || !reg.authIdentity) {
      // "Identity with email already exists" = ya reclamada por un actor → es cuenta.
      return "already_account";
    }

    // (2) Enlazar la identidad al customer de la orden + marcar has_account.
    const appMetadata = { ...(reg.authIdentity.app_metadata ?? {}) };
    if (!appMetadata.customer_id) {
      appMetadata.customer_id = customerId;
      await authService.updateAuthIdentities({ id: reg.authIdentity.id, app_metadata: appMetadata });
    }
    await customerService.updateCustomers(customerId, { has_account: true });

    // (3) Token de contraseña (workflow oficial) → email "Define tu contraseña".
    await generateResetPasswordTokenWorkflow(container).run({
      input: {
        entityId: email,
        actorType: "customer",
        provider: "emailpass",
        secret: config.projectConfig.http.jwtSecret,
        jwtOptions: config.projectConfig.http.jwtOptions,
        // Marca para que el subscriber use el correo de ACTIVACIÓN (no el de reset).
        metadata: { activation: true, first_name: args.firstName ?? undefined },
      },
      throwOnError: false,
    });

    return "provisioned";
  } catch (e) {
    console.error(`[cuenta] No se pudo provisionar la cuenta para ${email}:`, e);
    return "error";
  }
}
