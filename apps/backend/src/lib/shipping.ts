/**
 * Política de envío de Manada — FUENTE ÚNICA DE VERDAD (Fase 5 · Etapa B).
 *
 * Una sola regla, definida en el backend y consumida por el frontend vía
 * `GET /store/shipping-policy` (nunca duplicada en el front):
 *   - envío GRATIS sobre `FREE_SHIPPING_THRESHOLD`,
 *   - bajo ese monto, costo fijo `BASE_SHIPPING_AMOUNT` (Despacho Estándar).
 *
 * El "gratis sobre el umbral" se APLICA de forma nativa con una promoción
 * automática (ver `src/scripts/setup-free-shipping.ts`), de modo que la orden
 * real queda con envío $0 cuando corresponde. Estos mismos valores alimentan el
 * seed (precio de la opción) y la ruta de política. Montos en CLP (enteros).
 */
export const FREE_SHIPPING_THRESHOLD = 30000;
export const BASE_SHIPPING_AMOUNT = 3990;
export const EXPRESS_SHIPPING_AMOUNT = 5990;

/** Código de la promoción automática de envío gratis (idempotencia). */
export const FREE_SHIPPING_PROMO_CODE = "ENVIO_GRATIS_30K";
