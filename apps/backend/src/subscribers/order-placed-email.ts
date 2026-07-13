import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";

/**
 * Email de compra realizada (D45) — evento nativo `order.placed`.
 *
 * Convive con `food-purchased.ts` (que reancla el reloj de anticipación en el
 * mismo evento): son responsabilidades distintas → subscribers distintos. Aquí
 * solo confirmamos el pedido por correo.
 */
export default async function orderPlacedEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "total",
      "shipping_total",
      "items.title",
      "items.quantity",
      "items.total",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.address_1",
      "shipping_address.city",
      "shipping_address.province",
    ],
    filters: { id: event.data.id },
  });

  if (!order?.email) return;

  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: EmailTemplate.OrderPlaced,
    data: {
      display_id: order.display_id,
      first_name: order.shipping_address?.first_name,
      total: order.total,
      shipping_total: order.shipping_total,
      items: (order.items ?? []).map((item) => ({
        title: item?.title,
        quantity: item?.quantity,
        total: item?.total,
      })),
      shipping_address: order.shipping_address,
    },
  });
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
