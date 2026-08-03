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

/** Tope por página de la Store API de Medusa; el catálogo completo se pagina. */
const PAGE_SIZE = 100;

export async function listProducts(params: ListProductsParams = {}): Promise<Product[]> {
  const region_id = await getRegionId();
  const base = {
    region_id,
    fields: PRODUCT_FIELDS,
    ...(params.category_id ? { category_id: params.category_id } : {}),
    ...(params.q ? { q: params.q } : {}),
  };

  // Con `limit` explícito → una sola página (búsqueda, cross-sell del carrito).
  if (params.limit !== undefined) {
    const { products } = await medusa.store.product.list({
      ...base,
      limit: params.limit,
      offset: params.offset,
    });
    return products.map(mapProduct);
  }

  // Sin `limit` → catálogo COMPLETO. La Store API topea la página (~100), así que
  // se pagina con `count` hasta traerlos todos: subir el `limit` no basta porque el
  // backend lo capa. El resultado se cachea (catalog-cache.ts), no es 1 fetch/visita.
  const all: Product[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { products, count } = await medusa.store.product.list({
      ...base,
      limit: PAGE_SIZE,
      offset,
    });
    all.push(...products.map(mapProduct));
    if (products.length === 0 || offset + products.length >= count) break;
    if (offset >= PAGE_SIZE * 100) break; // guardarraíl anti-bucle (máx 10k productos)
  }
  return all;
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
