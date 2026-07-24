import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";
import { loadSubscriptionEmailData } from "../lib/subscription-email";

/** Email "Plan reanudado" (D57·R5) — evento de dominio `subscription.resumed` (PATCH). */
export default async function subscriptionResumedEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const info = await loadSubscriptionEmailData(container, event.data.id);
  if (!info) return;

  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to: info.email,
    channel: "email",
    template: EmailTemplate.SubscriptionResumed,
    data: {
      first_name: info.first_name,
      product_title: info.product_title,
      frequency_weeks: info.frequency_weeks,
      next_delivery_date: info.next_delivery_date,
    },
  });
}

export const config: SubscriberConfig = {
  event: "subscription.resumed",
};
