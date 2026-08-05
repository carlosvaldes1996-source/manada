import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { projectCartFunnelSafely } from "../lib/cart-funnel-projection";

/**
 * Disparador del proyector del funnel (D75) para TODO el ciclo de vida del carrito.
 *
 * Este archivo es deliberadamente delgado: la lógica vive en
 * `src/lib/cart-funnel-projection.ts`. Aquí solo se traduce "pasó algo en este
 * carrito" a "recalcula su proyección". Esa separación es lo que permite que el
 * backfill del histórico y un futuro job de reparación usen exactamente el mismo
 * código, sin una segunda implementación que se desincronice.
 *
 * Por qué subscribers y no hooks de workflow: se verificó que `addToCartWorkflow`,
 * `updateLineItemInCartWorkflow` y `deleteLineItemsWorkflow` **no exponen ningún
 * hook posterior** — justo los tres movimientos que más importan. Los eventos, en
 * cambio, cubren el ciclo completo. Y un hook corre DENTRO de la transacción: si
 * lanzara, revertiría el add-to-cart del cliente. Aquí eso es imposible.
 *
 * Seguridad del camino crítico, por construcción:
 *  · Medusa emite estos eventos SOLO si el workflow terminó con éxito (los agrupa
 *    por `eventGroupId` y los libera al final) → nunca se proyecta estado revertido.
 *  · El subscriber es asíncrono, fuera del ciclo de respuesta al comprador.
 *  · `projectCartFunnelSafely` no relanza: un fallo de tracking se loguea y muere ahí.
 *
 * `observedAt` es `new Date()` porque esto SÍ es tiempo real. El backfill omite ese
 * parámetro a propósito, para no marcar los carritos históricos con la fecha de hoy.
 */
export default async function cartFunnelTrackerHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const cartId = event.data?.id;
  if (!cartId) return;

  await projectCartFunnelSafely(container, cartId, { observedAt: new Date() });
}

export const config: SubscriberConfig = {
  // Cobertura completa del ciclo de vida (verificada en @medusajs/core-flows):
  //  · cart.created              → createCartWorkflow
  //  · cart.updated              → agregar / cambiar cantidad / QUITAR línea /
  //                                fijar email+dirección / elegir despacho
  //  · cart.customer_transferred → invitado que inicia sesión con carrito vivo
  //  · cart.customer_updated     → cambio de cliente en el carrito
  // La CONVERSIÓN no está aquí: complete-cart no emite `cart.updated`, solo
  // `order.placed` — la cubre `cart-funnel-converted.ts`.
  event: ["cart.created", "cart.updated", "cart.customer_transferred", "cart.customer_updated"],
};
