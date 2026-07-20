/**
 * Packshots normalizados — solución definitiva al escalado de imágenes de producto.
 *
 * Los packshots que llegan del Admin de Medusa son heterogéneos: unos con fondo
 * blanco y mucho aire alrededor del producto, otros recortados a transparente a
 * mano. Renderizados tal cual, el producto se ve pequeño y el catálogo, disparejo.
 *
 * En vez de editar cada asset (no escala a productos futuros), los pasamos por el
 * endpoint `/api/packshot` (server-side, `sharp`): aplana sobre blanco, recorta el
 * borde y re-encuadra a un cuadrado con margen uniforme. Resultado: TODO producto
 * —blanco o transparente— sale con el mismo encuadre y escala (DESIGN_SYSTEM §6),
 * ocupando ~88 % del marco, sin deformar y sin trabajo manual por producto nuevo.
 *
 * Este módulo es isomórfico (cliente y servidor): el `loader` de `next/image` vive
 * aquí y las constantes las consume también el route handler. No importa `sharp`.
 */

/** Parámetros de encuadre compartidos entre el loader (cliente) y la ruta (server). */
export const PACKSHOT = {
  /** Margen a cada lado del cuadro → el producto ocupa ~(1 − 2·margen) del lado. */
  marginRatio: 0.06,
  /** Sensibilidad del recorte del borde blanco (0–255). Bajo = conservador. */
  trimThreshold: 12,
  /** Calidad WebP de salida. */
  quality: 82,
  /** Ancho por defecto si el loader no propone uno. */
  defaultWidth: 640,
  /** Cotas del ancho solicitado (evita abusos del endpoint). */
  minWidth: 64,
  maxWidth: 2048,
} as const;

/** ¿URL de imagen (absoluta o raíz-relativa) vs emoji placeholder (D23)? */
export function isImageUrl(value: string): boolean {
  return /^(https?:\/\/|\/)/.test(value);
}

export interface PackshotLoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Loader de `next/image`: reescribe la URL real de Medusa hacia `/api/packshot`,
 * que normaliza el encuadre. Al ser un loader por-instancia, `next/image` genera
 * el `srcset` responsive pidiendo varios anchos (`w`) y NO necesita `remotePatterns`.
 */
export function packshotLoader({ src, width }: PackshotLoaderArgs): string {
  const w = Math.min(Math.max(Math.round(width), PACKSHOT.minWidth), PACKSHOT.maxWidth);
  const qs = new URLSearchParams({ src, w: String(w) });
  return `/api/packshot?${qs.toString()}`;
}
