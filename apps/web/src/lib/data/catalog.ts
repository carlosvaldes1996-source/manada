import type { Brand, LifeStage, Product, ProductCategory, Species } from "@/types";

/**
 * Catálogo demo para componentes y pantallas (hasta conectar backend en Fase 4).
 * Datos coherentes con la marca y el mercado chileno; precios en CLP.
 * Media = emoji placeholder (igual que el prototipo) hasta tener packshots reales.
 */

export const BRANDS: Brand[] = [
  { id: "b_royal_canin", name: "Royal Canin", slug: "royal-canin" },
  { id: "b_pro_plan", name: "Pro Plan", slug: "pro-plan" },
  { id: "b_hills", name: "Hill's", slug: "hills" },
  { id: "b_acana", name: "Acana", slug: "acana" },
  { id: "b_nexgard", name: "NexGard", slug: "nexgard" },
];

export interface CategoryMeta {
  id: ProductCategory | "todo";
  slug: string;
  label: string;
  /** Emoji placeholder hasta tener el set de íconos custom (DESIGN_SYSTEM §5). */
  emoji: string;
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "alimento", slug: "alimento", label: "Alimento", emoji: "🍖", description: "Seco, húmedo y dietas especiales" },
  { id: "accesorios", slug: "accesorios", label: "Accesorios", emoji: "🦴", description: "Camas, juguetes, paseo" },
  { id: "farmacia", slug: "farmacia", label: "Farmacia", emoji: "💊", description: "Antiparasitarios y salud" },
  { id: "higiene", slug: "higiene", label: "Higiene", emoji: "🧼", description: "Baño, arena, cuidado" },
  { id: "snacks", slug: "snacks", label: "Snacks", emoji: "🍪", description: "Premios y golosinas" },
];

const brand = (slug: string) => BRANDS.find((b) => b.slug === slug)!;

export const PRODUCTS: Product[] = [
  {
    id: "prod_rc_adult_3kg",
    slug: "royal-canin-adulto-razas-pequenas-3kg",
    name: "Adulto Razas Pequeñas",
    brand: brand("royal-canin"),
    category: "alimento",
    species: ["perro"],
    stage: ["adulto"],
    price: { current: 24990, compareAt: 29990 },
    format: "3 kg",
    rating: { value: 4.8, count: 212 },
    imageUrl: "🐕",
    subscribable: true,
    subscriptionDiscount: 15,
    stock: 24,
  },
  {
    id: "prod_proplan_adult_15kg",
    slug: "pro-plan-adulto-15kg",
    name: "Adulto Complete Essentials",
    brand: brand("pro-plan"),
    category: "alimento",
    species: ["perro"],
    stage: ["adulto"],
    price: { current: 54990 },
    format: "15 kg",
    rating: { value: 4.7, count: 489 },
    imageUrl: "🐕",
    subscribable: true,
    subscriptionDiscount: 12,
    stock: 8,
  },
  {
    id: "prod_hills_kidney",
    slug: "hills-prescription-diet-renal-2kg",
    name: "Prescription Diet k/d Renal",
    brand: brand("hills"),
    category: "alimento",
    species: ["gato"],
    stage: ["adulto", "senior"],
    price: { current: 32990 },
    format: "2 kg",
    rating: { value: 4.9, count: 76 },
    imageUrl: "🐈",
    subscribable: true,
    subscriptionDiscount: 10,
    stock: 3,
  },
  {
    id: "prod_acana_puppy",
    slug: "acana-puppy-recipe-2kg",
    name: "Puppy Recipe",
    brand: brand("acana"),
    category: "alimento",
    species: ["perro"],
    stage: ["cachorro"],
    price: { current: 28990, compareAt: 31990 },
    format: "2 kg",
    rating: { value: 4.6, count: 134 },
    imageUrl: "🐶",
    subscribable: true,
    subscriptionDiscount: 12,
    stock: 17,
  },
  {
    id: "prod_nexgard_m",
    slug: "nexgard-antiparasitario-perro-mediano",
    name: "Antiparasitario Masticable (4–10 kg)",
    brand: brand("nexgard"),
    category: "farmacia",
    species: ["perro"],
    price: { current: 18990 },
    format: "3 comprimidos",
    rating: { value: 4.5, count: 58 },
    imageUrl: "💊",
    subscribable: false,
    stock: 0,
  },
  {
    id: "prod_bed_cozy",
    slug: "cama-ortopedica-acolchada-m",
    name: "Cama Ortopédica Acolchada",
    brand: { id: "b_manada", name: "Manada", slug: "manada" },
    category: "accesorios",
    species: ["perro", "gato"],
    price: { current: 39990, compareAt: 49990 },
    format: "Talla M",
    rating: { value: 4.4, count: 41 },
    imageUrl: "🛏️",
    subscribable: false,
    stock: 12,
  },
];

export const PRODUCTS_BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));
export const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

/** Etapas de vida válidas como slug de PLP. */
const STAGE_SLUGS = new Set(["cachorro", "adulto", "senior"]);
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
 * ofertas o todo). No aplica personalización ni filtros de catálogo: eso lo
 * resuelve la pantalla, manteniendo el catálogo completo visible (AUDIT U043).
 */
export function productsForSlug(slug: string): Product[] {
  if (slug === "todo" || slug === "marcas") return PRODUCTS;
  if (slug === "ofertas") return PRODUCTS.filter((p) => p.price.compareAt);
  if (CATEGORIES.some((c) => c.slug === slug)) return PRODUCTS.filter((p) => p.category === slug);
  const species = SPECIES_BY_SLUG[slug];
  if (species) return PRODUCTS.filter((p) => p.species.includes(species));
  if (STAGE_SLUGS.has(slug)) return PRODUCTS.filter((p) => p.stage?.includes(slug as LifeStage));
  return PRODUCTS;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: Date;
  title?: string;
  body: string;
  /** Compra verificada — señal de confianza. */
  verified?: boolean;
  /** Nombre de la mascota del reseñador (calidez de marca). */
  petName?: string;
}

export const REVIEWS: Review[] = [
  {
    id: "rev_1",
    author: "Camila R.",
    rating: 5,
    date: new Date("2026-06-10"),
    title: "A mi perro le encanta",
    body: "Llegó al día siguiente a Ñuñoa. Toby comió feliz y le cayó perfecto. Repetiré con suscripción.",
    verified: true,
    petName: "Toby",
  },
  {
    id: "rev_2",
    author: "Felipe M.",
    rating: 4,
    date: new Date("2026-05-28"),
    title: "Buen precio, buen rendimiento",
    body: "Buen precio y el saco rinde lo que dicen. Le bajaría una estrella solo porque quería más formato.",
    verified: true,
  },
  {
    id: "rev_3",
    author: "Antonia P.",
    rating: 5,
    date: new Date("2026-05-15"),
    title: "Me avisaron antes de que se acabara",
    body: "Lo mejor fue el recordatorio: me avisaron justo cuando se estaba acabando. Magia.",
    verified: true,
    petName: "Luna",
  },
];

/** Opciones de filtro demo para PLP (FiltersPanel). */
export interface FilterGroup {
  id: string;
  label: string;
  options: { value: string; label: string; count?: number }[];
}

export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "especie",
    label: "Mascota",
    options: [
      { value: "perro", label: "Perro", count: 124 },
      { value: "gato", label: "Gato", count: 86 },
      { value: "otro", label: "Otros", count: 12 },
    ],
  },
  {
    id: "etapa",
    label: "Etapa de vida",
    options: [
      { value: "cachorro", label: "Cachorro", count: 38 },
      { value: "adulto", label: "Adulto", count: 142 },
      { value: "senior", label: "Senior", count: 27 },
    ],
  },
  {
    id: "marca",
    label: "Marca",
    options: BRANDS.map((b) => ({ value: b.slug, label: b.name })),
  },
];

export type { Species };
