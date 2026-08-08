import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../../../../modules/resend";

/**
 * `POST /store/account/confirm` (API.md §17.2, D82) — **consuma la adopción**.
 *
 * Es el único punto donde un invitado pasa a `has_account = true`, y exige sesión
 * válida. Eso ES la verificación de posesión del correo: la identidad que
 * `provisionAccount` dejó ligada nace con una contraseña ALEATORIA que nadie conoce,
 * así que la única forma de tener un token aquí es haber usado el enlace que se envió
 * a esa casilla (`auth.updateProvider(token)`).
 *
 * No mueve ni una fila: el `customer_id` es el mismo de siempre, de modo que órdenes,
 * suscripciones, mascotas, direcciones y todo lo de pago (`saved_card`,
 * `flow_customer`, `customer_account_holder`) siguen donde estaban.
 *
 * IDEMPOTENTE por construcción: solo actúa si `has_account` era `false`, y al
 * marcarlo la condición deja de cumplirse para siempre. Por eso `activated: true`
 * sale **una única vez** — el frontend lo usa como señal de "primer login tras la
 * activación" para adoptar la mascota del onboarding (§17.5), sin marcas en
 * `localStorage` ni heurísticas de fecha.
 *
 * Se llama en TODOS los logins; en el caso normal es un no-op de una lectura.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerService = req.scope.resolve(Modules.CUSTOMER) as unknown as {
    retrieveCustomer: (
      id: string,
    ) => Promise<{ id: string; email: string; first_name?: string | null; has_account?: boolean } | null>;
    updateCustomers: (id: string, data: { has_account: boolean }) => Promise<unknown>;
  };

  const customer = await customerService
    .retrieveCustomer(req.auth_context.actor_id)
    .catch(() => null);

  if (!customer) {
    res.status(404).json({ activated: false });
    return;
  }

  // Cuenta normal (alta directa) o activación ya consumida → no-op.
  if (customer.has_account) {
    res.json({ activated: false });
    return;
  }

  await customerService.updateCustomers(customer.id, { has_account: true });

  // El email de bienvenida cuelga del evento `customer.created` (§11), que aquí NO
  // se emite —no se creó ningún cliente, se adoptó uno—, así que se manda explícito.
  // Nunca puede tumbar la activación: si el correo falla, la cuenta ya quedó buena.
  try {
    const notifications = req.scope.resolve(Modules.NOTIFICATION);
    await notifications.createNotifications({
      to: customer.email,
      channel: "email",
      template: EmailTemplate.Welcome,
      data: { first_name: customer.first_name },
    });
  } catch (e) {
    console.error(`[cuenta] Bienvenida no enviada a ${customer.email}:`, e);
  }

  res.json({ activated: true });
}
