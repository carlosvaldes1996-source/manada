import { Module } from "@medusajs/framework/utils";
import CartFunnelModuleService from "./service";

/**
 * Módulo `cart-funnel` (D75) — proyección del funnel de compra sobre el carrito.
 * Séptimo módulo custom de Manada (patrón idéntico a `pet` D34, `subscription` D55
 * y `flow-payment` D58): extiende Medusa sin tocar el core.
 *
 * Responde lo que antes de la Order era invisible: cuántos agregaron al carrito,
 * qué productos se abandonan, quién llegó al checkout y no pagó, cuánto duró un
 * carrito antes de morir, y qué invitado estuvo a punto de comprar qué.
 *
 * NO participa del checkout. Se alimenta de subscribers, siempre después de que
 * el workflow correspondiente confirmó con éxito.
 */
export const CART_FUNNEL_MODULE = "cart_funnel";

export default Module(CART_FUNNEL_MODULE, {
  service: CartFunnelModuleService,
});
