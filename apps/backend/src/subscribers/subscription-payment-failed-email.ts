import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";
import { loadSubscriptionEmailData } from "../lib/subscription-email";

/**
 * Email "No pudimos cobrar" (D59) — evento de dominio `subscription.payment_failed`
 * (emitido por el motor de cobro cuando falla una renovación y la suscripción pasa a
 * `past_due`). Pide actualizar la tarjeta; el reintento lo hace el scheduler.
 */
export default async function subscriptionPaymentFailedEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const info = await loadSubscriptionEmailData(container, event.data.id);
  if (!info) return;

  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to: info.email,
    channel: "email",
    template: EmailTemplate.SubscriptionPaymentFailed,
    data: {
      first_name: info.first_name,
      pet_name: info.pet_name,
      product_title: info.product_title,
      card_last4: info.card_last4,
    },
  });
}

export const config: SubscriberConfig = {
  event: "subscription.payment_failed",
};
