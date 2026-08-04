import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";
import { loadSubscriptionEmailData } from "../lib/subscription-email";

/**
 * Email "Dimos de baja tu plan" (D59) — evento de dominio `subscription.ended_unpaid`
 * (emitido por el motor de cobro tras agotar los reintentos; la suscripción pasa a
 * `unpaid`). Terminal del dunning, con puerta abierta a reactivar.
 */
export default async function subscriptionEndedUnpaidEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const info = await loadSubscriptionEmailData(container, event.data.id);
  if (!info) return;

  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to: info.email,
    channel: "email",
    template: EmailTemplate.SubscriptionEndedUnpaid,
    data: {
      first_name: info.first_name,
      pet_name: info.pet_name,
      product_title: info.product_title,
    },
  });
}

export const config: SubscriberConfig = {
  event: "subscription.ended_unpaid",
};
