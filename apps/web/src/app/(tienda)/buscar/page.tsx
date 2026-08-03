import type { Metadata } from "next";
import { getCachedCatalog } from "@/lib/medusa/catalog-cache";
import { searchCatalog } from "@/lib/search";
import { SearchView } from "./search-view";

export const metadata: Metadata = { title: "Buscar" };

// Depende de `q` en cada request → dinámica. Aun así NO golpea a Medusa por
// visita: el catálogo sale del Data Cache (`getCachedCatalog`, 300s) y la
// relevancia se calcula en memoria (~0,1 ms). Ver `lib/search/engine.ts`.
export const dynamic = "force-dynamic";

/**
 * Resultados de búsqueda. La relevancia, el ranking y la degradación viven en
 * `lib/search` (dueño único); esta página solo lee `q`, pide el catálogo
 * cacheado y entrega el resultado ya ordenado a la vista.
 */
export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const outcome = searchCatalog(await getCachedCatalog(), query);
  return <SearchView query={query} outcome={outcome} />;
}
