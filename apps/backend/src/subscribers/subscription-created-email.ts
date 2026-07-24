import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";
import { loadSubscriptionEmailData } from "../lib/subscription-email";

/**
 * Email "Plan activo" (D57·R5) — evento de dominio `subscription.created`
 * (emitido por `subscription-created.ts` al crear la fila). Foco: cómo funciona
 * el Plan Manada; NO repite la compra (esa es `order-placed`).
 */
export default async function subscriptionCreatedEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const info = await loadSubscriptionEmailData(container, event.data.id);
  if (!info) return;

  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to: info.email,
    channel: "email",
    template: EmailTemplate.SubscriptionCreated,
    data: {
      first_name: info.first_name,
      pet_name: info.pet_name,
      product_title: info.product_title,
      frequency_weeks: info.frequency_weeks,
      next_delivery_date: info.next_delivery_date,
      agreed_unit_price: info.agreed_unit_price,
    },
  });
}

export const config: SubscriberConfig = {
  event: "subscription.created",
};
