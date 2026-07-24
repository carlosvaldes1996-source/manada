import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";
import { loadSubscriptionEmailData } from "../lib/subscription-email";

/** Email "Envío saltado" (D57·R5) — evento de dominio `subscription.skipped` (PATCH). */
export default async function subscriptionSkippedEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const info = await loadSubscriptionEmailData(container, event.data.id);
  if (!info) return;

  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to: info.email,
    channel: "email",
    template: EmailTemplate.SubscriptionSkipped,
    data: {
      first_name: info.first_name,
      product_title: info.product_title,
      next_delivery_date: info.next_delivery_date,
    },
  });
}

export const config: SubscriberConfig = {
  event: "subscription.skipped",
};
