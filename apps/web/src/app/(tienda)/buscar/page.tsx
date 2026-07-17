import type { Metadata } from "next";
import { searchProducts } from "@/lib/medusa";
import { SearchView } from "./search-view";

export const metadata: Metadata = {
  title: "Buscar",
  // Resultados de búsqueda internos: contenido fino/duplicado → fuera del índice
  // (se sigue rastreando enlaces). Evita canibalizar las PLP/PDP reales.
  robots: { index: false, follow: true },
};

// La búsqueda depende de `q` en cada request → dinámica.
export const dynamic = "force-dynamic";

/**
 * Búsqueda real de catálogo (Fase 5 · Etapa B). Lee `q` en el server y consulta
 * la Store API de Medusa (`searchProducts` → `q` nativo). Los resultados se
 * pasan a la vista cliente (que ofrece refinar la búsqueda).
 */
export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const products = query ? await searchProducts(query, 48) : [];
  return <SearchView query={query} products={products} />;
}
