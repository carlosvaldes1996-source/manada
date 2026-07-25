import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";

/**
 * Email de compra realizada (D45) — evento nativo `order.placed`.
 *
 * Convive con `food-purchased.ts` (que reancla el reloj de anticipación en el
 * mismo evento): son responsabilidades distintas → subscribers distintos. Aquí
 * solo confirmamos el pedido por correo.
 *
 * Renovaciones (D59): las órdenes generadas por el cobro recurrente llevan
 * `metadata.is_renewal` y tienen su propio correo ("Renovamos tu Plan Manada",
 * subscriber `subscription-renewed-email.ts`) → aquí se OMITEN para no duplicar.
 */
/** BigNumber (o número/string) → número plano finito. Los totales de la orden
 *  llegan como BigNumber desde query.graph; la plantilla (formatCLP) espera `number`. */
function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default async function orderPlacedEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    // Los totales de la orden se DERIVAN de `summary` + el detalle de las líneas
    // (`items.*` + detail/tax_lines/adjustments) + `shipping_methods.*`. Pedir solo
    // `total`/`items.total` sin esas relaciones devuelve 0 (verificado). Espejo del
    // set oficial `defaultStoreRetrieveOrderFields` de Medusa.
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "summary.*",
      "total",
      "shipping_total",
      "metadata",
      "items.*",
      "items.tax_lines.*",
      "items.adjustments.*",
      "items.detail.*",
      "shipping_methods.*",
      "shipping_methods.tax_lines.*",
      "shipping_methods.adjustments.*",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.address_1",
      "shipping_address.city",
      "shipping_address.province",
    ],
    filters: { id: event.data.id },
  });

  if (!order?.email) return;
  // Renovación: el correo lo manda el subscriber de `subscription.renewed`.
  if ((order.metadata as Record<string, unknown> | null)?.is_renewal) return;

  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: EmailTemplate.OrderPlaced,
    data: {
      display_id: order.display_id,
      first_name: order.shipping_address?.first_name,
      // BigNumber → number para que formatCLP no los descarte a $0.
      total: toNum(order.total),
      shipping_total: toNum(order.shipping_total),
      items: (order.items ?? []).map((item) => ({
        title: item?.title,
        quantity: item?.quantity,
        total: toNum(item?.total),
      })),
      shipping_address: order.shipping_address,
    },
  });
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
