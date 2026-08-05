import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { projectCartFunnelSafely } from "../lib/cart-funnel-projection";

/**
 * Cierre del funnel al convertir (D75).
 *
 * `completeCartWorkflow` fija `cart.completed_at`, crea la orden y el link nativo
 * `order_cart`, y emite `order.placed` — pero **no** emite `cart.updated`. Sin este
 * subscriber, el último movimiento de un carrito comprado sería el paso anterior y
 * la conversión no se registraría nunca.
 *
 * Convive con los demás handlers de `order.placed` (`food-purchased`,
 * `order-placed-email`, `subscription-created`): varios subscribers por evento es
 * el patrón ya establecido del proyecto. Este no toca nada de lo que hacen ellos.
 *
 * El `cart_id` se resuelve por el link NATIVO order↔cart (`fieldAlias`
 * `order: order_link.order` sobre Cart, y su recíproco sobre Order), no por una
 * columna propia: el vínculo que pedía el brief ya lo da Medusa.
 */
export default async function cartFunnelConvertedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event.data?.id;
  if (!orderId) return;

  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  let cartId: string | undefined;
  try {
    const { data } = await query.graph({
      entity: "order",
      fields: ["id", "cart.id"],
      filters: { id: orderId },
    });
    cartId = (data?.[0] as { cart?: { id?: string } | null } | undefined)?.cart?.id;
  } catch (e) {
    console.warn(`[funnel] No se pudo resolver el carrito de la orden ${orderId}:`, e);
    return;
  }

  // Órdenes sin carrito de origen (p. ej. creadas desde el Admin) no tienen funnel
  // que cerrar. No es un error: es un camino que no pasa por el embudo del cliente.
  if (!cartId) return;

  await projectCartFunnelSafely(container, cartId, {
    observedAt: new Date(),
    orderIdHint: orderId,
  });
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
