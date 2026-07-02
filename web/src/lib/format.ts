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
