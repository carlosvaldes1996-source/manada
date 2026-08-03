import { cache } from "react";
import type { Product } from "@/types";
import { medusa } from "./client";
import { getRegionId } from "./region";
import { mapProduct, PRODUCT_FIELDS } from "./map-product";

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
  /** Búsqueda de texto libre (Store API `q`) — nombre, descripción, etc. */
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
 * Búsqueda real de catálogo (Fase 5 · Etapa B) — usa el `q` nativo de la Store
 * API de Medusa (busca en título, descripción, etc.). Devuelve `Product[]` ya
 * mapeado. El filtrado fino (marca/especie) lo hace la UI sobre estos resultados.
 */
export async function searchProducts(query: string, limit = 24): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];
  return listProducts({ q, limit });
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
