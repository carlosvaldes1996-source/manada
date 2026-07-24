import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";
import { loadSubscriptionEmailData } from "../lib/subscription-email";

/** Email "Plan pausado" (D57·R5) — evento de dominio `subscription.paused` (PATCH). */
export default async function subscriptionPausedEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const info = await loadSubscriptionEmailData(container, event.data.id);
  if (!info) return;

  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to: info.email,
    channel: "email",
    template: EmailTemplate.SubscriptionPaused,
    data: { first_name: info.first_name, product_title: info.product_title },
  });
}

export const config: SubscriberConfig = {
  event: "subscription.paused",
};
