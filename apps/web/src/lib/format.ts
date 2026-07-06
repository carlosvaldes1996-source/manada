import type { Product } from "@/types";

/**
 * Formateadores para el mercado chileno (CLP, fechas).
 * Los precios se muestran con separador de miles y sin decimales (regla CLP).
 */

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

/** 24990 → "$24.990" */
export function formatCLP(amount: number): string {
  return CLP.format(amount);
}

const DATE_SHORT = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** Date → "lunes, 30 de junio" (para despacho honesto) */
export function formatDateLong(date: Date): string {
  return DATE_SHORT.format(date);
}

/** Pluralización simple en español: pluralize(5, "día") → "5 días" */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

const DATE_MED = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" });

/**
 * Fecha de despacho en lenguaje natural y cálido:
 * hoy / mañana / "vie 4 jul". Para el bloque de despacho honesto.
 */
export function formatDeliveryDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diffDays <= 0) return "hoy";
  if (diffDays === 1) return "mañana";
  const weekday = new Intl.DateTimeFormat("es-CL", { weekday: "short" }).format(target);
  return `${weekday} ${DATE_MED.format(target)}`;
}

/** Costo de despacho: 0 → "Gratis", si no el monto en CLP. */
export function formatShippingCost(cost: number): string {
  return cost === 0 ? "Gratis" : formatCLP(cost);
}

/** % de descuento entre precio anterior y actual (entero). */
export function discountPercent(current: number, compareAt?: number): number {
  if (!compareAt || compareAt <= current) return 0;
  return Math.round(((compareAt - current) / compareAt) * 100);
}

/**
 * Política de redondeo CLP para precios calculados (U066): hacia abajo al
 * múltiplo de $10. Un precio derivado de un % ($54.990 − 15% = $46.741,5)
 * se muestra $46.740: nunca se cobra de más por redondear y el monto se ve
 * intencional, no como el residuo de un cálculo.
 */
export function roundCLP(amount: number): number {
  return Math.floor(amount / 10) * 10;
}

/**
 * Precio de suscripción: base − descuento %, con la política de redondeo CLP.
 *
 * ⚠️ NO es el camino principal: el precio de suscripción lo calcula el **backend**
 * (Medusa, campo `subscription_price`) y llega ya resuelto en `Product.subscriptionPrice`.
 * Esta función queda solo como **fallback de compatibilidad** para datos que aún no
 * traen el valor del backend (p. ej. el catálogo demo). El backend usa exactamente
 * esta misma fórmula/redondeo, así que ambos coinciden.
 */
export function subscriptionPrice(base: number, discountPct?: number): number {
  if (!discountPct) return base;
  return roundCLP(base * (1 - discountPct / 100));
}

/**
 * Precio unitario de suscripción a mostrar. Prefiere SIEMPRE el valor calculado por
 * el backend (`product.subscriptionPrice`); si falta (datos demo/legacy), lo deriva
 * como compatibilidad. El frontend nunca aplica reglas de negocio: solo consume.
 */
export function effectiveSubscriptionPrice(
  product: Pick<Product, "price" | "subscriptionDiscount" | "subscriptionPrice">,
): number {
  return (
    product.subscriptionPrice ??
    subscriptionPrice(product.price.current, product.subscriptionDiscount)
  );
}
