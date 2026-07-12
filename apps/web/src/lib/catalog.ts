import type { LifeStage, Product, ProductCategory, Species } from "@/types";

/**
 * Taxonomía de catálogo y lógica de PLP — **puras** (operan sobre la lista de
 * productos que se les pasa; no dependen de datos demo). Las pantallas de catálogo
 * (Home, PLP, PDP) hidratan sus productos desde el backend (`lib/medusa`) y usan
 * estas funciones para clasificar/filtrar según el slug de la URL.
 *
 * Escalable por diseño: las facetas de marca se derivan de los productos reales,
 * así que agregar marcas/productos desde el Admin de Medusa NO requiere tocar código.
 */

export interface CategoryMeta {
  id: ProductCategory | "todo";
  slug: string;
  label: string;
  /** Emoji placeholder hasta tener el set de íconos custom (DESIGN_SYSTEM §5). */
  emoji: string;
  description: string;
}

/**
 * Departamentos del catálogo (eje de navegación principal). Deben coincidir con las
 * categorías del backend (seed / Admin de Medusa) por `slug`/nombre.
 */
export const CATEGORIES: CategoryMeta[] = [
  { id: "alimento", slug: "alimento", label: "Alimento", emoji: "🍖", description: "Seco, húmedo y dietas especiales" },
  { id: "accesorios", slug: "accesorios", label: "Accesorios", emoji: "🦴", description: "Camas, juguetes, paseo" },
  { id: "farmacia", slug: "farmacia", label: "Farmacia", emoji: "💊", description: "Antiparasitarios y salud" },
  { id: "higiene", slug: "higiene", label: "Higiene", emoji: "🧼", description: "Baño, arena, cuidado" },
  { id: "snacks", slug: "snacks", label: "Snacks", emoji: "🍪", description: "Premios y golosinas" },
];

/** Etapas de vida válidas como slug de PLP. */
const STAGE_SLUGS = new Set<string>(["cachorro", "adulto", "senior"]);
/** Mapea slugs de especie de la URL al valor del dominio. */
const SPECIES_BY_SLUG: Record<string, Species> = { perro: "perro", gato: "gato", otros: "otro", otro: "otro" };

/** Etiqueta legible para el encabezado/breadcrumb de la PLP a partir del slug. */
export function categoryLabel(slug: string): string {
  if (slug === "todo") return "Todo el catálogo";
  if (slug === "ofertas") return "Ofertas";
  if (slug === "marcas") return "Marcas";
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (cat) return cat.label;
  if (SPECIES_BY_SLUG[slug]) return slug === "otros" ? "Otros" : slug[0].toUpperCase() + slug.slice(1);
  if (STAGE_SLUGS.has(slug)) return slug[0].toUpperCase() + slug.slice(1);
  return slug[0].toUpperCase() + slug.slice(1);
}

/**
 * Productos base de una PLP según el slug de la URL (categoría, especie, etapa,
 * ofertas o todo), sobre la lista real que se pasa. No aplica personalización ni
 * filtros de catálogo: eso lo resuelve la pantalla (AUDIT U043).
 */
export function filterProductsForSlug(products: Product[], slug: string): Product[] {
  if (slug === "todo" || slug === "marcas") return products;
  if (slug === "ofertas") return products.filter((p) => p.price.compareAt);
  if (CATEGORIES.some((c) => c.slug === slug)) return products.filter((p) => p.category === slug);
  const species = SPECIES_BY_SLUG[slug];
  if (species) return products.filter((p) => p.species.includes(species));
  if (STAGE_SLUGS.has(slug)) return products.filter((p) => p.stage?.includes(slug as LifeStage));
  return products;
}

/** Opción de un grupo de filtros de la PLP. */
export interface FilterGroup {
  id: string;
  label: string;
  options: { value: string; label: string; count?: number }[];
}

/**
 * Facetas de la PLP derivadas de los productos reales. Especie y etapa son enums
 * fijos del dominio; la marca se deriva de los productos (así una marca nueva
 * agregada en el Admin aparece sola, sin tocar código). Los conteos y el ocultar
 * facetas con 0 resultados los resuelve la PLP sobre su lista visible.
 */
export function buildFilterGroups(products: Product[]): FilterGroup[] {
  const brands = new Map<string, string>(); // slug → nombre
  for (const p of products) brands.set(p.brand.slug, p.brand.name);
  return [
    {
      id: "especie",
      label: "Mascota",
      options: [
        // MVP: solo perro/gato (el catálogo no tiene "otros"; la faceta vacía
        // solo agregaba ruido). El valor "otro" del dominio sigue vigente.
        { value: "perro", label: "Perro" },
        { value: "gato", label: "Gato" },
      ],
    },
    {
      id: "etapa",
      label: "Etapa de vida",
      options: [
        { value: "cachorro", label: "Cachorro" },
        { value: "adulto", label: "Adulto" },
        { value: "senior", label: "Senior" },
      ],
    },
    {
      id: "marca",
      label: "Marca",
      options: [...brands.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "es"))
        .map(([slug, name]) => ({ value: slug, label: name })),
    },
  ];
}
