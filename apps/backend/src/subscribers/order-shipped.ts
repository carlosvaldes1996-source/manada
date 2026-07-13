import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";

/**
 * Email de pedido enviado (D45) — evento nativo `shipment.created`.
 *
 * El payload trae el `id` del FULFILLMENT (no de la orden) y `no_notification`.
 * Resolvemos la orden a través del link nativo order↔fulfillment y tomamos el
 * tracking del fulfillment despachado. `no_notification` (marcado en el Admin)
 * respeta la decisión del operador de no avisar.
 */
export default async function orderShippedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (event.data.no_notification) return;

  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Resolvemos la orden DESDE el fulfillment (filtro por su `id` nativo) y
  // traemos la orden por el link nativo fulfillment↔order.
  const {
    data: [fulfillment],
  } = await query.graph({
    entity: "fulfillment",
    fields: [
      "id",
      "labels.tracking_number",
      "labels.tracking_url",
      "order.id",
      "order.display_id",
      "order.email",
      "order.shipping_address.first_name",
      "order.shipping_address.address_1",
      "order.shipping_address.city",
      "order.shipping_address.province",
    ],
    filters: { id: event.data.id },
  });

  type ShipmentLabel = { tracking_number?: string | null; tracking_url?: string | null };
  type OrderAddress = {
    first_name?: string | null;
    address_1?: string | null;
    city?: string | null;
    province?: string | null;
  };
  type ShippedOrder = { display_id?: number | string; email?: string; shipping_address?: OrderAddress };

  // El campo `order` llega por link → el grafo no lo tipa; lo estrechamos.
  const order = (fulfillment as { order?: ShippedOrder } | undefined)?.order;
  const label = (fulfillment as { labels?: ShipmentLabel[] } | undefined)?.labels?.[0];

  if (!order?.email) return;

  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: EmailTemplate.OrderShipped,
    data: {
      display_id: order.display_id,
      first_name: order.shipping_address?.first_name,
      tracking_number: label?.tracking_number,
      tracking_url: label?.tracking_url,
      shipping_address: order.shipping_address,
    },
  });
}

export const config: SubscriberConfig = {
  event: "shipment.created",
};
