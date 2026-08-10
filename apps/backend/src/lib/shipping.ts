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

/**
 * COBERTURA — DÓNDE despachamos hoy. Misma disciplina que el costo: la regla se
 * define acá y el front la CONSUME vía `/store/shipping-policy`; ninguna pantalla
 * decide por su cuenta a quién se le puede vender.
 *
 * Por qué existe: la operación de despacho es manual y solo cubre Santiago, pero
 * nada lo impedía — una compra real llegó desde Valparaíso y quedó imposible de
 * cumplir. La cobertura pasa a ser una regla de negocio con candado, no un
 * supuesto: se valida en el servidor al CREAR EL PAGO (única puerta por la que
 * pasan las dos formas de comprar, compra única y suscripción), de modo que
 * saltarse la UI no alcanza para comprar fuera de zona.
 *
 * Nombre canónico = el que usa el selector del checkout (`apps/web/src/lib/
 * chile-regions.ts`), para que lo que se guarda y lo que se valida sean lo mismo.
 */
export const COVERAGE_REGIONS = ["Metropolitana de Santiago"];

/** Cómo se le nombra la zona al comprador (más corto y más reconocible que el canónico). */
export const COVERAGE_LABEL = "Región Metropolitana";

/**
 * Formas en que una misma región llega escrita. El selector del checkout manda el
 * nombre canónico, pero una dirección guardada antes (campo libre en la cuenta) o
 * un carrito viejo pueden traer "Región Metropolitana", "RM" o "Santiago": todas
 * son la misma zona y ninguna debería costar una venta que SÍ podemos cumplir.
 */
const COVERAGE_ALIASES = new Set(["metropolitana santiago", "metropolitana", "rm", "santiago"]);

/** Marcas de acento sueltas que deja `normalize("NFD")` (se borran ANTES de la
 *  limpieza de puntuación: si no, "región" quedaría partida en "regio n"). */
const DIACRITICS = /[\u0300-\u036f]/g;

/** Sin tildes, sin puntuación y sin las palabras de relleno ("región de …"), en minúscula. */
function normalizeRegion(value: string): string {
  return value
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(region|regiones|de|del|la|el)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ¿Despachamos a esta región? Sin región NO hay cobertura verificable: se responde
 * `false` a propósito (el checkout la exige, así que el comprador solo tiene que
 * completarla) en vez de dejar pasar una dirección que no podríamos entregar.
 */
export function isCoveredProvince(province?: string | null): boolean {
  if (!province) return false;
  return COVERAGE_ALIASES.has(normalizeRegion(province));
}

/**
 * COMUNAS que recorre el reparto. **Vacío = sin restricción por comuna**, que es
 * como está hoy: la cobertura se valida solo a nivel de región.
 *
 * Por qué vacío y no la lista del Gran Santiago (D84.1): el corte "urbano / rural"
 * dentro de la RM **no se puede adivinar sin datos**. Una lista de las 32 comunas
 * de la provincia de Santiago + Puente Alto y San Bernardo deja fuera Colina
 * (Chicureo), Buin, Talagante, Peñaflor, Padre Hurtado y Paine — sectores donde el
 * reparto entra sin problema y donde vive el cliente objetivo. Se bloquearían más
 * ventas cumplibles que pedidos imposibles.
 *
 * Y los dos errores no cuestan lo mismo: un pedido rural que hay que anular **se ve
 * y se resuelve con una llamada + devolución** (así lo dice `/despacho`); una venta
 * bloqueada de más **no se ve nunca**. Con volumen bajo, esa es la cara.
 *
 * Cómo se enciende cuando haya datos: agregar acá los nombres canónicos de
 * `chile-regions.ts`. Nada más — el candado de las rutas de pago, el aviso del
 * checkout y la página `/despacho` ya leen de esta lista.
 *
 * Por qué NUNCA una detección automática de "rural": no existe señal confiable en
 * una dirección chilena. Adivinarla por el texto (parcela, kilómetro, sin número)
 * falla hacia el lado caro — hay parcelas en Chicureo y calles sin número en
 * Santiago centro.
 */
export const COVERAGE_COMUNAS: string[] = [];

/** Cómo se le nombra la zona de reparto al comprador. */
export const COVERAGE_AREA_LABEL = "Gran Santiago";

/**
 * El set se construye normalizando la MISMA lista canónica, no a mano: así una
 * comuna nueva no puede quedar bien escrita arriba y mal escrita acá.
 */
const COVERAGE_COMUNA_SET = new Set(COVERAGE_COMUNAS.map(normalizeRegion));

/**
 * ¿Recorre el reparto esta comuna?
 *
 * **Sin lista, no restringe** — y ese orden importa: si el `return true` estuviera
 * después del chequeo, una lista vacía haría que el set no contenga NADA y se
 * bloquearía la tienda entera.
 */
export function isCoveredComuna(city?: string | null): boolean {
  if (COVERAGE_COMUNA_SET.size === 0) return true;
  if (!city) return false;
  return COVERAGE_COMUNA_SET.has(normalizeRegion(city));
}

/** Mensaje del rechazo por región — mismo texto en las dos rutas de pago. */
export const OUT_OF_COVERAGE_MESSAGE =
  `Por ahora solo despachamos en la ${COVERAGE_LABEL}. ` +
  `Cambia la dirección de entrega a una comuna de la RM para completar tu compra.`;

/**
 * Rechazo por comuna. Nombra la comuna que el comprador eligió: "no llegamos a
 * Melipilla" se entiende y se puede accionar; "fuera de cobertura" no.
 */
export function outOfComunaMessage(city?: string | null): string {
  const nombre = city?.trim();
  return (
    `Por ahora no llegamos a ${nombre || "esa comuna"}. ` +
    `Despachamos en el ${COVERAGE_AREA_LABEL}: elige una comuna de esa zona para completar tu compra.`
  );
}

/**
 * Veredicto único de cobertura para una dirección: `null` = se puede despachar.
 * Las dos rutas de pago llaman SOLO a esto, así que no pueden divergir.
 */
export function coverageError(address?: {
  province?: string | null;
  city?: string | null;
} | null): string | null {
  if (!isCoveredProvince(address?.province)) return OUT_OF_COVERAGE_MESSAGE;
  if (!isCoveredComuna(address?.city)) return outOfComunaMessage(address?.city);
  return null;
}
