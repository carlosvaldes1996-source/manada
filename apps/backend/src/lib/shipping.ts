/**
 * Política de envío de Manada — FUENTE ÚNICA DE VERDAD (Fase 5 · Etapa B).
 *
 * DOS ramas de una misma regla, definidas en el backend y consumidas por el
 * frontend vía `GET /store/shipping-policy` (nunca duplicadas en el front):
 *   1. SUSCRIPCIÓN → envío GRATIS siempre, sin monto mínimo. Basta con que el
 *      carrito traiga una línea con `metadata.is_subscription` (D55).
 *   2. COMPRA SUELTA → envío GRATIS sobre `FREE_SHIPPING_THRESHOLD`; bajo ese
 *      monto, costo fijo `BASE_SHIPPING_AMOUNT` (Despacho Estándar).
 *
 * Por qué la rama 1: las RENOVACIONES ya no cobran despacho (el cargo recurrente
 * es `agreed_unit_price × quantity`, ver `subscription-charge.ts`). Cobrarlo solo
 * en la primera entrega dejaba la promesa "con suscripción el despacho es gratis"
 * a medias justo en el momento de convertir. Ahora la promesa es verdad desde el
 * primer pedido y no necesita asterisco.
 *
 * Ambas ramas se APLICAN de forma nativa con promociones automáticas (ver
 * `src/scripts/setup-free-shipping.ts`), de modo que la orden real queda con
 * envío $0 cuando corresponde — ninguna regla de negocio vive en el frontend.
 * Estos mismos valores alimentan el seed (precio de la opción) y la ruta de
 * política. Montos en CLP (enteros).
 */
export const FREE_SHIPPING_THRESHOLD = 30000;
export const BASE_SHIPPING_AMOUNT = 3990;
export const EXPRESS_SHIPPING_AMOUNT = 5990;

/** Código de la promoción automática de envío gratis por monto (idempotencia). */
export const FREE_SHIPPING_PROMO_CODE = "ENVIO_GRATIS_30K";

/** Código de la promoción automática de envío gratis por suscripción (idempotencia). */
export const SUBSCRIPTION_FREE_SHIPPING_PROMO_CODE = "ENVIO_GRATIS_SUSCRIPCION";
