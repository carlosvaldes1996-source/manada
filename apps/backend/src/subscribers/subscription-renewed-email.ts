import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";
import { loadSubscriptionEmailData } from "../lib/subscription-email";

/**
 * Email "Renovamos tu plan" (D59) — evento de dominio `subscription.renewed`
 * (emitido por el motor de cobro al crear la orden de renovación). Reemplaza al
 * `order-placed` para esas órdenes (guard en `order-placed-email.ts`): explica el
 * cobro automático en vez de un genérico "gracias por tu compra".
 */
export default async function subscriptionRenewedEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const info = await loadSubscriptionEmailData(container, event.data.id);
  if (!info) return;

  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to: info.email,
    channel: "email",
    template: EmailTemplate.SubscriptionRenewed,
    data: {
      first_name: info.first_name,
      pet_name: info.pet_name,
      product_title: info.product_title,
      amount: info.agreed_unit_price != null ? info.agreed_unit_price * info.quantity : null,
      card_last4: info.card_last4,
      next_delivery_date: info.next_delivery_date,
    },
  });
}

export const config: SubscriberConfig = {
  event: "subscription.renewed",
};
