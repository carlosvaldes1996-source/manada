import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { isFlowConfigured } from "../lib/flow";
import { syncFlowCustomerProfile } from "../lib/flow-customer";

/**
 * Sincroniza nombre/correo con Flow cuando el cliente edita su perfil (D70) —
 * evento nativo `customer.updated` (emitido por `updateCustomersWorkflow`).
 *
 * Deliberadamente barato y silencioso:
 *  - **No-op para la inmensa mayoría.** `syncFlowCustomerProfile` sale de inmediato
 *    si el cliente no tiene vínculo con Flow, y solo lo tienen quienes llegaron a
 *    suscribirse. Un cambio de perfil de un comprador normal no toca la red.
 *  - **Nunca rompe nada.** Los fallos se loguean y se tragan: que Flow esté caído no
 *    puede hacer fallar la edición de perfil, y el próximo cambio reintenta.
 *
 * Por qué importa mantenerlo al día: el correo del cliente en Flow es el que recibe
 * los comprobantes de cobro, y su nombre es lo que aparece en el panel de Flow al
 * conciliar. Un correo viejo ahí = comprobantes que no llegan.
 */
export default async function flowCustomerSyncHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  if (!isFlowConfigured()) return;

  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name"],
    filters: { id: event.data.id },
  });

  if (!customer?.email) return;

  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();
  await syncFlowCustomerProfile(container, {
    customerId: customer.id,
    name,
    email: customer.email,
  });
}

export const config: SubscriberConfig = {
  event: "customer.updated",
};
