"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Pagination } from "@/components/ui/pagination";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductGrid, SearchSuggest } from "@/components/commerce";
import { CATEGORIES } from "@/lib/catalog";
import { pluralize } from "@/lib/format";
import { SITE } from "@/config/site";
import type { SearchOutcome } from "@/lib/search";

/**
 * Resultados de búsqueda.
 *
 * Regla de la pantalla: **nunca queda muerta**. Cuando no hay coincidencia
 * exacta, el motor (`lib/search`) ya devolvió alternativas ordenadas por
 * cercanía —la marca que sí existe, la etapa que sí existe, lo más parecido y,
 * en último caso, los destacados—; acá solo se rotulan con honestidad para que
 * se entienda qué se está viendo y por qué. Un listado sin explicación se lee
 * como un error del sitio; rotulado, se lee como ayuda.
 */

/**
 * Atajos del estado inicial. Son consultas reales del catálogo (no categorías
 * disfrazadas): responden a cómo pide la gente, no a cómo está organizada la
 * tienda. Se resuelven por el mismo buscador, así que no hay nada que mantener
 * sincronizado con el árbol de categorías.
 */
const POPULAR_QUERIES = [
  "alimento para cachorro",
  "gato esterilizado",
  "salmón",
  "razas pequeñas",
  "alimento húmedo",
  "control de peso",
];

export function SearchView({ query, outcome }: { query: string; outcome: SearchOutcome }) {
  const [page, setPage] = useState(1);
  const perPage = SITE.commerce.productsPerPage;

  // Una consulta nueva siempre empieza en la página 1: quedarse en la 3 de la
  // búsqueda anterior es la forma más rápida de parecer que no hay resultados.
  // Se ajusta en el render (patrón oficial de React), no con un efecto.
  const [shownQuery, setShownQuery] = useState(query);
  if (shownQuery !== query) {
    setShownQuery(query);
    setPage(1);
  }

  const { results, groups, exact, total, correctedFrom } = outcome;
  const totalPages = Math.max(1, Math.ceil(results.length / perPage));
  const safePage = Math.min(page, totalPages);
  const visible = results.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <Section spacing="md">
      <Stack gap={8}>
        <Stack gap={3} className="max-w-xl">
          <h1 className="heading-1 text-text-primary">Buscar</h1>
          {/* Misma pieza que el header: sugiere productos mientras se escribe. */}
          <SearchSuggest
            variant="field"
            initialQuery={query}
            placeholder="Busca alimento, marca o categoría…"
          />
        </Stack>

        {!query ? (
          <Stack gap={6}>
            <Stack gap={3}>
              <p className="body-m text-text-secondary">
                Escribe el nombre de un producto, una marca o lo que necesita tu compañero. También
                entendemos “cachorro”, “salmón” o “razas pequeñas”.
              </p>
              <PopularQueries />
            </Stack>
            <Groups groups={groups} />
          </Stack>
        ) : exact ? (
          <Stack gap={8}>
            <Stack gap={4}>
              <Stack gap={1}>
                <p className="body-m text-text-secondary">
                  {pluralize(total, "resultado")} para{" "}
                  <strong className="text-text-primary">“{outcome.query}”</strong>
                </p>
                {correctedFrom && (
                  <p className="text-[13px] text-text-muted">
                    Buscaste “{correctedFrom}”. Corregimos la escritura para mostrarte productos.
                  </p>
                )}
              </Stack>
              <ProductGrid products={visible} priorityCount={safePage === 1 ? 4 : 0} />
              {totalPages > 1 && (
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  className="justify-center"
                />
              )}
            </Stack>
            <Groups groups={groups} />
          </Stack>
        ) : (
          <Stack gap={8}>
            {/* Sin coincidencia exacta: se dice qué pasó en una línea y se pasa
                de inmediato a lo que sí sirve. Nada de una pantalla dedicada al
                "no hay nada" — eso es un callejón sin salida con ilustración. */}
            <Stack gap={4}>
              <Stack gap={2}>
                <Row className="items-center gap-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft" aria-hidden>
                    <Search className="size-4 text-text-brand" />
                  </span>
                  <h2 className="heading-3 text-text-primary">
                    No encontramos productos para “{query}”
                  </h2>
                </Row>
                <p className="body-m text-text-secondary">
                  Revisa la escritura o prueba con menos palabras. Mientras tanto, esto es lo más
                  cercano que tenemos:
                </p>
              </Stack>
              <PopularQueries />
            </Stack>
            <Groups groups={groups} />
            <CategoryShortcuts />
          </Stack>
        )}
      </Stack>
    </Section>
  );
}

/** Bloques alternativos, cada uno con su propio título explicativo. */
function Groups({ groups }: { groups: SearchOutcome["groups"] }) {
  if (!groups.length) return null;
  return (
    <Stack gap={8}>
      {groups.map((group) => (
        <Stack key={group.id} gap={4}>
          <SectionHeading as="h3" title={group.title} />
          <ProductGrid products={group.products} />
        </Stack>
      ))}
    </Stack>
  );
}

/** Enlace con forma de chip: son navegaciones, no filtros con estado. */
const CHIP_LINK =
  "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-border-default bg-surface px-3.5 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]";

function PopularQueries() {
  return (
    <Row className="flex-wrap gap-2">
      {POPULAR_QUERIES.map((q) => (
        <Link key={q} href={`/buscar?q=${encodeURIComponent(q)}`} className={CHIP_LINK}>
          <Search className="size-3.5 text-text-muted" aria-hidden />
          {q}
        </Link>
      ))}
    </Row>
  );
}

function CategoryShortcuts() {
  return (
    <Stack gap={3}>
      <p className="text-sm font-semibold text-text-primary">O recorre la tienda por sección</p>
      <Row className="flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/categoria/${c.slug}`} className={CHIP_LINK}>
            <span aria-hidden>{c.emoji}</span>
            {c.label}
          </Link>
        ))}
      </Row>
    </Stack>
  );
}
