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

/**
 * Cómo se nombra la zona de cobertura cuando NO hay política a mano (footer, que
 * es sincrónico y se pinta en todas las pantallas). Es solo el NOMBRE: quién puede
 * comprar lo decide el backend, nunca este string.
 */
export const COVERAGE_LABEL = "Región Metropolitana";

/** Nombre de la zona, priorizando siempre lo que declara el backend. */
export function coverageLabel(policy?: ShippingPolicy | null): string {
  return policy?.coverage?.label ?? COVERAGE_LABEL;
}

/**
 * ¿Llegamos a esta región? Compara contra la lista del backend, que usa los mismos
 * nombres canónicos que el selector del checkout (`chile-regions.ts`).
 *
 * Sin política cargada o sin cobertura declarada devuelve `true`: el front no
 * inventa un bloqueo: prefiere dejar seguir y que el servidor —que sí es la fuente
 * de verdad— rechace. Un falso "no llegamos" cuesta una venta buena; un falso "sí"
 * lo ataja el candado del backend.
 */
export function isCoveredRegion(policy: ShippingPolicy | null, region: string): boolean {
  const regions = policy?.coverage?.regions;
  if (!regions?.length) return true;
  return regions.includes(region);
}

/**
 * ¿Recorre el reparto esta comuna? Misma degradación que la región: sin lista de
 * comunas, el front no restringe (backend anterior ⇒ manda el servidor).
 */
export function isCoveredComuna(policy: ShippingPolicy | null, comuna: string): boolean {
  const comunas = policy?.coverage?.comunas;
  if (!comunas?.length) return true;
  return comunas.includes(comuna);
}

/** Zona de reparto ("Gran Santiago"), con la región como respaldo. */
export function coverageAreaLabel(policy?: ShippingPolicy | null): string {
  return policy?.coverage?.areaLabel ?? coverageLabel(policy);
}

/** Aviso corto de cobertura, para vitrina (footer, ficha de producto). */
export function coverageNote(policy?: ShippingPolicy | null): string {
  return policy?.coverage?.comunas?.length
    ? `Despachamos solo en el ${coverageAreaLabel(policy)}`
    : `Despachamos solo en la ${coverageLabel(policy)}`;
}

/**
 * El "no llegamos a tu comuna". Nombra la comuna elegida: se entiende y se puede
 * accionar, a diferencia de un "fuera de cobertura".
 */
export function outOfComunaMessage(policy: ShippingPolicy | null, comuna: string): string {
  return (
    `Por ahora no llegamos a ${comuna || "esa comuna"}. ` +
    `Despachamos en el ${coverageAreaLabel(policy)}: elige una comuna de esa zona para completar tu compra.`
  );
}

/**
 * El "no llegamos todavía" del checkout — donde el comprador ya escribió sus datos
 * y merece saber exactamente qué pasa y qué puede hacer, no un error genérico.
 */
export function outOfCoverageMessage(policy: ShippingPolicy | null): string {
  return (
    `Por ahora despachamos solo en la ${coverageLabel(policy)}. ` +
    `Elige una dirección de esa zona para completar tu compra.`
  );
}

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
