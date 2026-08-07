import { formatCLP } from "./format";
import type { ShippingPolicy } from "./medusa";

/**
 * Cómo le contamos el despacho al comprador — DUEÑO ÚNICO del texto.
 *
 * La regla tiene dos ramas y estaba contada distinta en cada pantalla (landing,
 * PDP, carrito, checkout, /despacho, /términos), lo que la volvía difícil de
 * entender: se leía como una condición vaga en vez de como dos casos claros.
 * Acá se arma una sola vez y las pantallas la consumen.
 *
 * La regla NO se decide acá: los montos y el `subscriptionFreeShipping` vienen
 * de `GET /store/shipping-policy` (backend, fuente única). Este módulo solo pone
 * las palabras.
 *
 * Las dos ramas, siempre en este orden (primero el beneficio, después el piso):
 *   1. Con suscripción → gratis siempre, sin monto mínimo.
 *   2. Compra única    → gratis sobre el umbral; bajo eso, el costo base.
 */

/** Rama 1 · "Despacho gratis con suscripción". Vacío si la política no la ofrece. */
export function subscriptionShippingLabel(policy: ShippingPolicy): string {
  return policy.subscriptionFreeShipping ? "Despacho gratis con suscripción" : "";
}

/**
 * Rama 2 · "gratis sobre $30.000 · $3.990 bajo ese monto". En minúscula porque
 * siempre va detrás de un prefijo ("Envío…", "En compra única:…").
 */
export function oneTimeShippingLabel(policy: ShippingPolicy): string {
  return `gratis sobre ${formatCLP(policy.freeShippingThreshold)} · ${formatCLP(
    policy.baseShippingAmount,
  )} bajo ese monto`;
}

/**
 * Por QUÉ este pedido paga (o no) despacho — para el momento de decidir, donde
 * un monto sin explicación es exactamente lo que genera desconfianza.
 * Nombra la rama que está mandando, en vez de repetir la regla completa.
 */
export function shippingReasonLabel(
  policy: ShippingPolicy,
  { free, bySubscription }: { free: boolean; bySubscription: boolean },
): string {
  if (free && bySubscription) {
    return "Despacho gratis: tu suscripción lo incluye, sin monto mínimo.";
  }
  if (free) {
    return `Despacho gratis: tu pedido supera ${formatCLP(policy.freeShippingThreshold)}.`;
  }
  return policy.subscriptionFreeShipping
    ? `El despacho es gratis con suscripción, o en compras sobre ${formatCLP(policy.freeShippingThreshold)}.`
    : `El despacho es gratis en compras sobre ${formatCLP(policy.freeShippingThreshold)}.`;
}

/**
 * Las dos ramas en una frase corrida, para textos largos (/despacho, /términos,
 * "nosotros"). Degrada sola a una sola rama si el backend no ofrece la primera.
 */
export function shippingRuleSentence(policy: ShippingPolicy): string {
  const oneTime =
    `en una compra única es gratis sobre ${formatCLP(policy.freeShippingThreshold)} ` +
    `y cuesta ${formatCLP(policy.baseShippingAmount)} bajo ese monto`;
  return policy.subscriptionFreeShipping
    ? `Con suscripción el despacho es siempre gratis, sin monto mínimo; ${oneTime}.`
    : `El despacho ${oneTime}.`;
}
