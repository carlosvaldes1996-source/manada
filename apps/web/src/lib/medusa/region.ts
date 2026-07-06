import { medusa } from "./client";

/**
 * Resolución de la región de precios. El MVP es single-region (Chile / CLP,
 * seed en apps/backend), así que basta con encontrar la región CLP una vez.
 *
 * Medusa calcula los precios (`calculated_price`) según la región que se pasa en
 * cada consulta de catálogo; por eso toda lectura de productos necesita el
 * `region_id`. Se cachea en memoria del proceso (aceptable para el MVP: la
 * región no cambia; un reinicio la revalida).
 */

let cachedRegionId: string | null = null;

export async function getRegionId(): Promise<string> {
  if (cachedRegionId) return cachedRegionId;

  const { regions } = await medusa.store.region.list({
    fields: "id,currency_code",
  });

  const region = regions.find((r) => r.currency_code === "clp") ?? regions[0];
  if (!region) {
    throw new Error(
      "[medusa] El backend no tiene regiones configuradas. Corre el seed (apps/backend/DEV.md).",
    );
  }

  cachedRegionId = region.id;
  return region.id;
}
