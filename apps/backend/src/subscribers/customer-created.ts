import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";

/**
 * Email de bienvenida (D45) — evento nativo `customer.created`.
 *
 * `customer.created` se emite tanto al REGISTRAR una cuenta como al crear un
 * cliente invitado en el checkout. Solo queremos dar la bienvenida a cuentas
 * reales, así que filtramos por `has_account` (el registro lo deja en `true`;
 * el invitado en `false`). Sin cuenta → no-op.
 */
export default async function customerCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "has_account"],
    filters: { id: event.data.id },
  });

  if (!customer?.email || !customer.has_account) return;

  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  await notificationModuleService.createNotifications({
    to: customer.email,
    channel: "email",
    template: EmailTemplate.Welcome,
    data: { first_name: customer.first_name },
  });
}

export const config: SubscriberConfig = {
  event: "customer.created",
};
