import { cache } from "react";
import type { Product, ProductCategory } from "@/types";
import { medusa } from "./client";
import { getRegionId } from "./region";
import { categoryFromName, mapProduct, PRODUCT_FIELDS } from "./map-product";

/**
 * Acceso al catálogo real vía la Store API de Medusa (Fase 5 · Etapa 1).
 *
 * Devuelven el tipo de dominio `Product` (ya mapeado); las pantallas (Etapa 2)
 * las consumen desde server components. Toda consulta pasa el `region_id` para
 * que Medusa calcule precios en CLP.
 */

export interface ListProductsParams {
  limit?: number;
  offset?: number;
  /** Filtra por id(s) de categoría de Medusa (para la PLP por categoría en Etapa 2). */
  category_id?: string | string[];
  /**
   * Búsqueda de texto libre (Store API `q`). **La búsqueda de la tienda ya NO
   * pasa por acá**: el `q` nativo no ve la marca (vive en `metadata`), exige
   * todos los términos y no ignora tildes, así que la relevancia se resuelve en
   * `lib/search` sobre el catálogo cacheado. Se mantiene el parámetro porque el
   * contrato de la Store API lo tiene y sirve para consultas puntuales.
   */
  q?: string;
}

/**
 * Límite por defecto = catálogo completo en UNA sola llamada.
 *
 * La Store API de Medusa v2 **no capa el tamaño de página**: `createFindParams`
 * define `limit` sin `.max()` y la ruta de productos solo fija `defaultLimit: 50`.
 * Verificado contra el backend de producción (2026-08-02, Medusa 2.16.0):
 * `limit=1000` → HTTP 200 con los 158 productos y `count: 158` en una request.
 *
 * **Decisión TEMPORAL y consciente (D68):** con ~158 productos —y hasta 300-500—
 * una request única es la solución más simple y estable. NO es la arquitectura
 * final: cuando la PLP necesite paginación real en servidor (miles de productos,
 * filtros/orden/SEO por página), este valor desaparece junto con el patrón de
 * "bajar el catálogo entero". Ver D68 para los techos conocidos.
 */
const CATALOG_LIMIT = 1000;

export async function listProducts(params: ListProductsParams = {}): Promise<Product[]> {
  const region_id = await getRegionId();
  const { products, count } = await medusa.store.product.list({
    region_id,
    fields: PRODUCT_FIELDS,
    limit: params.limit ?? CATALOG_LIMIT,
    offset: params.offset,
    ...(params.category_id ? { category_id: params.category_id } : {}),
    ...(params.q ? { q: params.q } : {}),
  });

  // El bug que originó D68 fue un truncado SILENCIOSO (el catálogo pasó de 100 y
  // nadie se enteró). Si el catálogo vuelve a superar el límite, que se vea en los
  // logs en vez de descubrirse en la tienda. No aplica cuando el llamador pidió una
  // página acotada a propósito (búsqueda, cross-sell).
  if (params.limit === undefined && params.offset === undefined && count > products.length) {
    console.error(
      `[medusa] Catálogo truncado: ${count} productos, se recibieron ${products.length} ` +
        `(limit ${CATALOG_LIMIT}). Toca implementar paginación en servidor (D68).`,
    );
  }

  return products.map(mapProduct);
}

/**
 * La PDP pide el producto dos veces por render (en `generateMetadata` y en el
 * cuerpo de la página). `React.cache` deduplica esas llamadas dentro del mismo
 * render → un solo request al backend por handle. No persiste entre requests (la
 * frescura del catálogo la gobierna el `revalidate` de la ruta), así que no
 * introduce datos obsoletos.
 */
export const getProductByHandle = cache(async (handle: string): Promise<Product | null> => {
  const region_id = await getRegionId();
  const { products } = await medusa.store.product.list({
    handle,
    region_id,
    fields: PRODUCT_FIELDS,
    limit: 1,
  });
  return products[0] ? mapProduct(products[0]) : null;
});

/* --------------------------------- sitemap -------------------------------- */

/**
 * Entrada mínima del catálogo para el sitemap: la URL de la ficha, su categoría
 * y **cuándo cambió de verdad** el producto en Medusa.
 *
 * No pasa por `mapProduct` a propósito: el sitemap no necesita precios, variantes
 * ni metadata, y `mapProduct` descarta `updated_at` (no es un dato de dominio que
 * consuma la UI). Por lo mismo esta consulta no pide `region_id` —solo hace falta
 * para calcular precios— ni expande variantes.
 */
export interface ProductSitemapEntry {
  slug: string;
  category: ProductCategory;
  /**
   * `updated_at` real de Medusa, o `null` si el backend no lo devolvió. Nunca se
   * sustituye por "ahora": un `lastmod` inventado es peor que ninguno — Google
   * deja de confiar en el sitemap completo si todas las fechas son la del request.
   */
  updatedAt: Date | null;
}

/** Campos mínimos del sitemap: handle + fecha real + categoría (para el lastmod de la PLP). */
const SITEMAP_FIELDS = "handle,updated_at,*categories";

function toDate(raw: string | Date | null | undefined): Date | null {
  if (!raw) return null;
  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Catálogo publicable en el sitemap. Mismo techo (y mismo aviso de truncado) que
 * `listProducts`: si el catálogo supera el límite, que se vea en los logs en vez
 * de descubrirse como URLs que nunca se indexaron (D68).
 */
export async function listProductsForSitemap(): Promise<ProductSitemapEntry[]> {
  const { products, count } = await medusa.store.product.list({
    fields: SITEMAP_FIELDS,
    limit: CATALOG_LIMIT,
  });

  if (count > products.length) {
    console.error(
      `[medusa] Sitemap truncado: ${count} productos, se recibieron ${products.length} ` +
        `(limit ${CATALOG_LIMIT}). Toca implementar paginación en servidor (D68).`,
    );
  }

  return products.map((product) => ({
    slug: product.handle,
    category: categoryFromName(product.categories?.[0]?.name),
    updatedAt: toDate(product.updated_at),
  }));
}
