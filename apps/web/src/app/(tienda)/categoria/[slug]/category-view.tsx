"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  ProductGrid,
  FiltersSidebar,
  FiltersSheet,
  PersonalizationBanner,
  type FilterSelection,
} from "@/components/commerce";
import { usePet } from "@/components/providers";
import {
  FILTER_GROUPS,
  productsForSlug,
  categoryLabel,
  DEMO_SHIPPING,
} from "@/lib/demo-data";
import { SITE } from "@/config/site";
import { pluralize } from "@/lib/format";
import type { Product } from "@/types";

/** Aplica la selección de filtros de catálogo (especie/etapa/marca) a una lista. */
function applyCatalogFilters(products: Product[], filters: FilterSelection): Product[] {
  return products.filter((p) =>
    Object.entries(filters).every(([groupId, values]) => {
      if (!values.length) return true;
      if (groupId === "especie") return values.some((v) => p.species.includes(v as Product["species"][number]));
      if (groupId === "etapa") return values.some((v) => p.stage?.includes(v as NonNullable<Product["stage"]>[number]));
      if (groupId === "marca") return values.includes(p.brand.slug);
      return true;
    }),
  );
}

/**
 * PLP — listado de catálogo.
 *
 * Decisiones de IA (AUDIT_UI_UX):
 * - U043: el catálogo se muestra COMPLETO por defecto; la personalización
 *   "para Toby" es un realce opt-in (Switch apagado), nunca esconde productos.
 * - U063: el filtro personal vive separado de los filtros de catálogo
 *   (banner/switch arriba) para que quede claro qué se está filtrando.
 * - U055: el conteo refleja los productos realmente cargados tras filtrar.
 * - U064: el criterio del orden "Recomendado para…" se explica con un popover.
 * - U067: descubrimiento por paginación con conteo claro.
 * - U062: breadcrumb coherente con el nav (Inicio › Comprar › categoría).
 */
export function CategoryView({ slug }: { slug: string }) {
  const { activePet } = usePet();
  const [filters, setFilters] = useState<FilterSelection>({});
  const [personalized, setPersonalized] = useState(false);
  const [page, setPage] = useState(1);

  const label = categoryLabel(slug);
  const perPage = SITE.commerce.productsPerPage;

  // Facetas con conteos REALES sobre el catálogo de esta categoría (U055/consistencia):
  // el número de cada filtro coincide con lo que mostraría; se ocultan los que dan 0.
  const facetGroups = useMemo(() => {
    const base = productsForSlug(slug);
    const countFor = (groupId: string, value: string) =>
      base.filter((p) =>
        groupId === "especie"
          ? p.species.includes(value as Product["species"][number])
          : groupId === "etapa"
            ? Boolean(p.stage?.includes(value as NonNullable<Product["stage"]>[number]))
            : groupId === "marca"
              ? p.brand.slug === value
              : false,
      ).length;
    return FILTER_GROUPS.map((g) => ({
      ...g,
      options: g.options
        .map((o) => ({ ...o, count: countFor(g.id, o.value) }))
        .filter((o) => o.count > 0),
    })).filter((g) => g.options.length > 0);
  }, [slug]);

  const filtered = useMemo(() => {
    let list = productsForSlug(slug);
    if (personalized && activePet) {
      list = list.filter(
        (p) => p.species.includes(activePet.species) && (!activePet.stage || p.stage?.includes(activePet.stage)),
      );
    }
    return applyCatalogFilters(list, filters);
  }, [slug, personalized, activePet, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  function changeFilters(next: FilterSelection) {
    setFilters(next);
    setPage(1);
  }

  const breadcrumb =
    slug === "todo"
      ? [{ label: "Inicio", href: "/" }, { label: "Comprar" }]
      : [{ label: "Inicio", href: "/" }, { label: "Comprar", href: "/categoria/todo" }, { label }];

  const sortLabel = personalized && activePet ? `Recomendado para ${activePet.name}` : "Relevancia";

  return (
    // pt reducido: el breadcrumb no necesita los 72px de una sección editorial.
    <Section spacing="md" className="pt-6 lg:pt-10">
      <Stack gap={6}>
        <Stack gap={3}>
          <Breadcrumb items={breadcrumb} />
          <h1 className="heading-1 text-text-primary">{label}</h1>
        </Stack>

        {/* Realce personal (opt-in), separado de los filtros de catálogo (U043/U063) */}
        {activePet &&
          (personalized ? (
            <PersonalizationBanner
              pet={activePet}
              action={
                <Button variant="ghost" size="sm" onClick={() => setPersonalized(false)}>
                  Mostrar todo
                </Button>
              }
            />
          ) : (
            <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-border-default bg-surface px-4 py-3">
              <div>
                <p className="text-[15px] font-semibold text-text-primary">
                  ¿Mostrar primero lo ideal para {activePet.name}?
                </p>
                <p className="text-sm text-text-secondary">
                  Filtramos por su especie y etapa. Puedes desactivarlo cuando quieras.
                </p>
              </div>
              <Switch
                checked={personalized}
                onCheckedChange={(v) => {
                  setPersonalized(v);
                  setPage(1);
                }}
                aria-label={`Personalizar el catálogo para ${activePet.name}`}
              />
            </div>
          ))}

        {/* Invitación contextual para el anónimo: discreta, nunca bloquea el
            catálogo. El valor del perfil se explica donde es evidente (filtrar). */}
        {!activePet && (
          <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-border-default bg-surface px-4 py-3">
            <div>
              <p className="text-[15px] font-semibold text-text-primary">
                ¿Quieres ver primero lo ideal para tu mascota?
              </p>
              <p className="text-sm text-text-secondary">
                Crea su perfil gratis en 2 minutos y filtramos por su especie, etapa y salud.
              </p>
            </div>
            <Button variant="secondary" size="sm" className="shrink-0" asChild>
              <Link href="/comenzar">Crear su perfil</Link>
            </Button>
          </div>
        )}

        {/* Barra de resultados: conteo real (U055) + orden con criterio (U064) + filtros móvil */}
        <Row align="center" justify="between" className="gap-3">
          <span className="text-sm text-text-secondary">
            {pluralize(filtered.length, "producto")}
          </span>
          <Row gap={2} className="gap-2">
            <span className="hidden text-sm text-text-secondary sm:inline">Orden:</span>
            <span className="text-sm font-semibold text-text-primary">{sortLabel}</span>
            {personalized && activePet && (
              <Popover>
                <PopoverTrigger
                  aria-label="¿Por qué este orden?"
                  className="inline-flex items-center text-text-secondary hover:text-text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]"
                >
                  <HelpCircle className="size-4" aria-hidden />
                </PopoverTrigger>
                <PopoverContent>
                  Ordenamos según el perfil de {activePet.name}: su especie ({activePet.species}), su
                  etapa ({activePet.stage}) y su peso. Es una sugerencia para ahorrarte tiempo, no un
                  filtro oculto.
                </PopoverContent>
              </Popover>
            )}
            <FiltersSheet groups={facetGroups} value={filters} onChange={changeFilters} resultCount={filtered.length} />
          </Row>
        </Row>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <FiltersSidebar groups={facetGroups} value={filters} onChange={changeFilters} />
          <Stack gap={6}>
            <ProductGrid
              products={visible}
              shipping={DEMO_SHIPPING}
              emptyState={
                <EmptyState
                  icon={<span className="text-5xl">🔍</span>}
                  title="No encontramos productos con esos filtros"
                  description="Prueba quitar algún filtro para ver más opciones."
                  action={
                    <Button variant="secondary" onClick={() => changeFilters({})}>
                      Limpiar filtros
                    </Button>
                  }
                />
              }
            />
            {totalPages > 1 && (
              <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} className="justify-center" />
            )}
          </Stack>
        </div>
      </Stack>
    </Section>
  );
}
