import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";
import { loadSubscriptionEmailData } from "../lib/subscription-email";

/** Email "Plan cancelado" (D57·R5) — evento de dominio `subscription.cancelled` (PATCH). */
export default async function subscriptionCancelledEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const info = await loadSubscriptionEmailData(container, event.data.id);
  if (!info) return;

  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to: info.email,
    channel: "email",
    template: EmailTemplate.SubscriptionCancelled,
    data: { first_name: info.first_name, product_title: info.product_title },
  });
}

export const config: SubscriberConfig = {
  event: "subscription.cancelled",
};
