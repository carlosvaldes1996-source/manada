"use client";

import { useRouter } from "next/navigation";
import { Section } from "@/components/ui/section";
import { Stack } from "@/components/ui/stack";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductGrid } from "@/components/commerce";
import { pluralize } from "@/lib/format";
import type { Product } from "@/types";

/**
 * Resultados de búsqueda reales (Fase 5 · Etapa B). El campo permite refinar la
 * búsqueda (navega a `/buscar?q=…`); la grilla usa el catálogo real de Medusa.
 */
export function SearchView({ query, products }: { query: string; products: Product[] }) {
  const router = useRouter();

  function submit(q: string) {
    const t = q.trim();
    router.push(t ? `/buscar?q=${encodeURIComponent(t)}` : "/buscar");
  }

  return (
    <Section spacing="md">
      <Stack gap={6}>
        <Stack gap={3} className="max-w-xl">
          <h1 className="heading-1 text-text-primary">Buscar</h1>
          <SearchBar
            variant="field"
            defaultValue={query}
            onSubmit={submit}
            placeholder="Busca alimento, marca o categoría…"
          />
        </Stack>

        {!query ? (
          <EmptyState
            icon="🔍"
            title="¿Qué buscas para tu compañero?"
            description="Escribe el nombre de un producto, una marca o una categoría."
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon="🔍"
            title={`Sin resultados para “${query}”`}
            description="Prueba con otra palabra o recorre la tienda por categorías."
          />
        ) : (
          <Stack gap={4}>
            <p className="body-m text-text-secondary">
              {products.length} {pluralize(products.length, "resultado")} para{" "}
              <strong className="text-text-primary">“{query}”</strong>
            </p>
            <ProductGrid products={products} />
          </Stack>
        )}
      </Stack>
    </Section>
  );
}
