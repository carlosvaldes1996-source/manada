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
import { Select } from "@/components/ui/select";
import {
  ProductGrid,
  FiltersSidebar,
  FiltersSheet,
  PersonalizationBanner,
  type FilterSelection,
} from "@/components/commerce";
import { usePet } from "@/components/providers";
import {
  buildFilterGroups,
  categoryLabel,
  filterProductsForSlug,
  sortProducts,
  SORT_OPTIONS,
  type SortId,
} from "@/lib/catalog";
import { SITE } from "@/config/site";
import { pluralize } from "@/lib/format";
import type { Product } from "@/types";

/** Foto de cabecera (banner) por categoría. Solo los slugs con foto disponible;
 *  el resto no muestra banner (degrada sin romper). Archivos en public/fotos/. */
const BANNER_BY_SLUG: Record<string, string> = {
  todo: "cat-todo.jpg",
  alimento: "cat-alimento.jpg",
  perro: "cat-perro.jpg",
  gato: "cat-gato.jpg",
  farmacia: "cat-farmacia.jpg",
  accesorios: "cat-accesorios.jpg",
  higiene: "cat-higiene.jpg",
};

/** Foco vertical del recorte por categoría. El banner es una banda baja y
 *  bg-center corta arriba/abajo; subimos el foco donde el sujeto (cabeza) queda
 *  alto en la foto. Default "center" para los que se ven bien centrados. */
const BANNER_POS: Record<string, string> = {
  todo: "center 45%", // perro y gato completos mirando la despensa; más arriba corta al gato
  alimento: "center 78%", // el perro come agachado: bajar el foco al plato+cabeza
  perro: "center 34%", // salvar las puntas de las orejas
  farmacia: "center 28%", // que se vea la cabeza de la veterinaria
  higiene: "center 42%",
};

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
 *
 * Jerarquía del primer viewport (catálogo primero): el hero es una banda
 * compacta con el título superpuesto a la foto — la foto contextualiza, no
 * protagoniza — para que la primera fila de productos asome sin scroll en
 * resoluciones estándar, tanto en móvil como en desktop.
 */
export function CategoryView({ slug, products }: { slug: string; products: Product[] }) {
  const { activePet } = usePet();
  const [filters, setFilters] = useState<FilterSelection>({});
  const [personalized, setPersonalized] = useState(false);
  const [sort, setSort] = useState<SortId>("relevancia");
  const [page, setPage] = useState(1);

  const label = categoryLabel(slug);
  const perPage = SITE.commerce.productsPerPage;

  // Facetas con conteos REALES sobre el catálogo de esta categoría (U055/consistencia):
  // el número de cada filtro coincide con lo que mostraría; se ocultan los que dan 0.
  const facetGroups = useMemo(() => {
    const base = filterProductsForSlug(products, slug);
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
    return buildFilterGroups(products)
      .map((g) => ({
        ...g,
        options: g.options
          .map((o) => ({ ...o, count: countFor(g.id, o.value) }))
          .filter((o) => o.count > 0),
      }))
      .filter((g) => g.options.length > 0);
  }, [slug, products]);

  const filtered = useMemo(() => {
    let list = filterProductsForSlug(products, slug);
    if (personalized && activePet) {
      list = list.filter(
        (p) => p.species.includes(activePet.species) && (!activePet.stage || p.stage?.includes(activePet.stage)),
      );
    }
    return sortProducts(applyCatalogFilters(list, filters), sort);
  }, [products, slug, personalized, activePet, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  function changeFilters(next: FilterSelection) {
    setFilters(next);
    setPage(1);
  }

  function changeSort(next: SortId) {
    setSort(next);
    setPage(1);
  }

  const breadcrumb =
    slug === "todo"
      ? [{ label: "Inicio", href: "/" }, { label: "Comprar" }]
      : [{ label: "Inicio", href: "/" }, { label: "Comprar", href: "/categoria/todo" }, { label }];

  // El primer criterio ("relevancia") refleja el orden en que llega la lista;
  // con personalización activa se lee como el orden recomendado (U064).
  const sortOptions = SORT_OPTIONS.map((o) =>
    o.value === "relevancia" && personalized && activePet
      ? { ...o, label: `Recomendado para ${activePet.name}` }
      : o,
  );

  return (
    // pt reducido: el breadcrumb no necesita los 72px de una sección editorial.
    <Section spacing="md" className="pt-4 lg:pt-6">
      <Stack gap={4}>
        <Stack gap={2}>
          <Breadcrumb items={breadcrumb} className="py-1" />

          {/* Hero compacto: banda de altura fija — la foto contextualiza sin empujar
              el catálogo fuera del primer viewport. Las fotos son 16:9; en móvil la
              banda (~2.7:1) las recorta poco y la foto va full-bleed con el título
              sobre scrim cálido (idioma de la promesa de la landing). En desktop una
              banda full-width sería ~6:1 y "hace zoom" (recorta >70% de la foto), así
              que la foto se acota a la mitad derecha (~3:1) y el título vive en un
              panel brand-soft que se funde con ella. Slugs sin foto: título solo
              (degrada sin romper). */}
          {BANNER_BY_SLUG[slug] ? (
            <div className="relative h-36 w-full overflow-hidden rounded-[var(--radius-xl)] border border-terracota-100 bg-brand-soft sm:h-40 lg:h-52">
              <div
                aria-hidden
                className="absolute inset-0 bg-cover lg:left-[42%]"
                style={{
                  backgroundImage: `url('/fotos/${BANNER_BY_SLUG[slug]}')`,
                  backgroundPosition: BANNER_POS[slug] ?? "center",
                }}
              />
              {/* Scrim inferior para legibilidad del título — solo móvil/tablet */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[rgba(28,18,13,0.62)] via-[rgba(28,18,13,0.12)] to-transparent lg:hidden"
              />
              {/* Fundido panel→foto — solo desktop */}
              <div
                aria-hidden
                className="absolute inset-y-0 left-[42%] hidden w-32 bg-gradient-to-r from-[var(--bg-brand-soft)] to-transparent lg:block"
              />
              <h1 className="heading-1 absolute inset-x-5 bottom-3.5 text-white lg:inset-x-8 lg:top-1/2 lg:bottom-auto lg:w-1/3 lg:-translate-y-1/2 lg:text-text-primary">
                {label}
              </h1>
            </div>
          ) : (
            <h1 className="heading-1 text-text-primary">{label}</h1>
          )}
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
            <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-border-default bg-surface px-4 py-2.5">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  ¿Mostrar primero lo ideal para {activePet.name}?
                </p>
                <p className="text-[13px] text-text-secondary">
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
          <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-border-default bg-surface px-4 py-2.5">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                ¿Quieres ver primero lo ideal para tu mascota?
              </p>
              <p className="text-[13px] text-text-secondary">
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
          <Row gap={2} className="items-center gap-2">
            {/* Orden como control real (select) en ≥sm; en móvil vive dentro del
                sheet de filtros (patrón estándar de e-commerce, sin duplicar UI). */}
            <label htmlFor="plp-sort" className="hidden text-sm text-text-secondary sm:inline">
              Orden:
            </label>
            <Select
              id="plp-sort"
              options={sortOptions}
              value={sort}
              onValueChange={(v) => changeSort(v as SortId)}
              className="hidden h-9 w-auto gap-1.5 px-3 text-sm font-semibold sm:flex"
            />
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
            <FiltersSheet
              groups={facetGroups}
              value={filters}
              onChange={changeFilters}
              resultCount={filtered.length}
              sort={sort}
              sortOptions={sortOptions}
              onSortChange={changeSort}
            />
          </Row>
        </Row>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <FiltersSidebar groups={facetGroups} value={filters} onChange={changeFilters} />
          <Stack gap={6}>
            <ProductGrid
              products={visible}
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
