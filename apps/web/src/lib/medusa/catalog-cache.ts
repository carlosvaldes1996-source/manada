import "server-only";
import { unstable_cache } from "next/cache";
import type { Product } from "@/types";
import { listProducts, getProductByHandle } from "./products";
import { getShippingPolicy, type ShippingPolicy } from "./shipping";

/**
 * Lecturas de catálogo CACHEADAS para las páginas ISR (Home, PLP, PDP).
 *
 * Por qué existe: el SDK de Medusa hace `fetch` sin opción de caché, y en Next 16
 * un fetch sin cachear fuerza render dinámico → anula el `revalidate` de la ruta
 * (verificado: la ruta se servía `no-store` en cada request). `unstable_cache`
 * guarda el RESULTADO de la lectura en el Data Cache (revalidación 300s), con
 * independencia de cómo fetchea el SDK: así la ruta vuelve a ser estática/ISR y se
 * elimina el round-trip a Railway por visita.
 *
 * `server-only`: estas envolturas NUNCA deben correr en cliente (`unstable_cache`
 * es solo de servidor). El carrito/checkout siguen usando `listProducts` /
 * `getShippingPolicy` SIN caché — datos en vivo donde importa (precio/stock reales).
 *
 * `tags`: dejan la puerta abierta a invalidación on-demand desde el Admin
 * (`revalidateTag('catalog')`) el día que se quiera refresco inmediato; hoy basta
 * la ventana de 300s. Mantener el valor alineado con el `revalidate` de las rutas.
 */
const REVALIDATE = 300;

/** Catálogo completo (Home y PLP piden el catálogo entero; comparten entrada). */
export const getCachedCatalog = unstable_cache(
  (): Promise<Product[]> => listProducts(),
  ["catalog", "all"],
  { revalidate: REVALIDATE, tags: ["catalog"] },
);

/** Ficha de un producto por handle (PDP). El handle entra en la llave de caché. */
export const getCachedProductByHandle = unstable_cache(
  (handle: string): Promise<Product | null> => getProductByHandle(handle),
  ["catalog", "product"],
  { revalidate: REVALIDATE, tags: ["catalog"] },
);

/** Política de envío (PDP): umbral de envío gratis + costo base, desde el backend. */
export const getCachedShippingPolicy = unstable_cache(
  (): Promise<ShippingPolicy> => getShippingPolicy(),
  ["shipping-policy"],
  { revalidate: REVALIDATE, tags: ["shipping-policy"] },
);
