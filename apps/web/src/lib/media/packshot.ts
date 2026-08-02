/**
 * Packshots normalizados — solución definitiva al escalado de imágenes de producto.
 *
 * Los packshots que llegan del Admin de Medusa son heterogéneos: unos con fondo
 * blanco y mucho aire alrededor del producto, otros recortados a transparente a
 * mano. Renderizados tal cual, el producto se ve pequeño y el catálogo, disparejo.
 *
 * En vez de editar cada asset (no escala a productos futuros), los pasamos por el
 * endpoint `/api/packshot` (server-side, `jimp` —JS puro, sin binario nativo, para
 * que corra en la función serverless de Vercel): aplana sobre blanco, recorta el
 * borde y re-encuadra a un cuadrado con margen uniforme. Resultado: TODO producto
 * —blanco o transparente— sale con el mismo encuadre y escala (DESIGN_SYSTEM §6),
 * ocupando ~88 % del marco, sin deformar y sin trabajo manual por producto nuevo.
 *
 * Este módulo es isomórfico (cliente y servidor): el builder de `src` vive aquí y
 * las constantes las consume también el route handler. No importa `sharp`.
 */

/** Parámetros de encuadre compartidos entre el builder (cliente) y la ruta (server). */
export const PACKSHOT = {
  /** Margen a cada lado del cuadro → el producto ocupa ~(1 − 2·margen) del lado. */
  marginRatio: 0.06,
  /** Tolerancia del recorte de borde blanco (0–1). Absorbe el ruido near-white de JPEG. */
  trimTolerance: 0.025,
  /**
   * Calidad JPEG de la imagen BASE que produce `/api/packshot`. Ya no es la calidad
   * final que ve el usuario: `next/image` re-encodea esta base a AVIF/WebP. Se sube
   * a 90 (vs. 82) para no encadenar pérdida JPEG→AVIF (el peso final lo baja el
   * optimizer con formato moderno + resize, no esta calidad).
   */
  quality: 90,
  /**
   * Lado (px) de la imagen base cuadrada que se normaliza UNA vez por producto. El
   * optimizer de Next reescala hacia abajo desde aquí a cada ancho responsive, así
   * que basta con cubrir el mayor render real (PDP ~1290px @2–3x) con holgura.
   */
  baseWidth: 1440,
  /** Ancho por defecto si la ruta no recibe `w`. */
  defaultWidth: 640,
  /** Cotas del ancho solicitado (evita abusos del endpoint). */
  minWidth: 64,
  maxWidth: 2048,
} as const;

/** ¿URL de imagen (absoluta o raíz-relativa) vs emoji placeholder (D23)? */
export function isImageUrl(value: string): boolean {
  return /^(https?:\/\/|\/)/.test(value);
}

/**
 * `src` para `next/image`: apunta a `/api/packshot`, que normaliza el encuadre de
 * la imagen real de Medusa y devuelve UNA base cuadrada por producto. A diferencia
 * del loader por-ancho anterior, aquí la URL es única por producto (mismo `w` para
 * todos) → el optimizer nativo de Next se encarga del `srcset` responsive y del
 * formato moderno (AVIF/WebP), y esa base se computa/cachea una sola vez.
 *
 * Requiere `images.localPatterns` en `next.config` (Next 16 exige whitelistear los
 * locales con query string); la propia ruta se auto-protege del SSRF.
 */
export function packshotSrc(src: string): string {
  const qs = new URLSearchParams({ src, w: String(PACKSHOT.baseWidth) });
  return `/api/packshot?${qs.toString()}`;
}
