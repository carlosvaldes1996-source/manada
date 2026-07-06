import type { HttpTypes } from "@medusajs/types";
import type {
  Brand,
  LifeStage,
  Price,
  Product,
  ProductCategory,
  Species,
} from "@/types";

/**
 * Mapeo Medusa → dominio Manada (Fase 5 · Etapa 2).
 *
 * Traduce un `StoreProduct` de la Store API al tipo `Product` que consumen los
 * ~70 componentes de la Component Library. **Se mapea, no se reescribe.**
 *
 * El **backend es la fuente de verdad de TODO el catálogo**. Este mapper NO infiere
 * especie, etapa, marca ni suscripción desde el nombre del producto: cada atributo
 * viene de la API —campos nativos de Medusa o `product.metadata` (convención de
 * Manada; ver apps/backend/src/scripts/seed.ts y ai-context/DATABASE.md)—. Agregar
 * productos nuevos se hace en el Admin de Medusa, sin tocar este código.
 *
 * Fuentes por campo:
 *   id · slug(handle) · description · precio CLP (`calculated_price`) · categoría
 *   (native) · formato (título de variante) · stock (`inventory_quantity`) ·
 *   thumbnail/images (native)                              → campos nativos de Medusa
 *   brand · species · stage · subscribable ·
 *   subscription_discount_percentage · rating · review_count → `product.metadata`
 *   subscription_price (precio de suscripción ya calculado)  → campo calculado del
 *                                                              backend (middleware)
 */

/**
 * Campos que las consultas de catálogo deben pedir. `metadata` es OBLIGATORIO: de
 * ahí salen los atributos de Manada y, además, el middleware del backend lo necesita
 * para calcular `subscription_price` (ese campo lo inyecta el backend, no se pide aquí).
 */
export const PRODUCT_FIELDS =
  "*variants,*variants.calculated_price,+variants.inventory_quantity,*categories,*images,+metadata";

/** StoreProduct + el campo calculado que inyecta el backend (no está en HttpTypes). */
type StoreProduct = HttpTypes.StoreProduct & { subscription_price?: number | null };
type StoreVariant = HttpTypes.StoreProductVariant;

/** Emoji placeholder por categoría hasta tener packshots reales (U090). */
const CATEGORY_EMOJI: Record<ProductCategory, string> = {
  alimento: "🐕",
  accesorios: "🛏️",
  farmacia: "💊",
  higiene: "🧼",
  snacks: "🍪",
};

/** Nombre de categoría de Medusa → categoría del dominio. */
const CATEGORY_BY_NAME: Record<string, ProductCategory> = {
  alimento: "alimento",
  accesorios: "accesorios",
  farmacia: "farmacia",
  higiene: "higiene",
  snacks: "snacks",
};

const VALID_SPECIES: Species[] = ["perro", "gato", "otro"];
const VALID_STAGES: LifeStage[] = ["cachorro", "adulto", "senior"];

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* --------------------------- lectura de metadata --------------------------- */
// Los valores pueden llegar como tipo nativo (seed) o string (Admin de Medusa).

type Meta = Record<string, unknown> | null | undefined;

function metaString(meta: Meta, key: string): string | undefined {
  const raw = (meta as Record<string, unknown> | undefined)?.[key];
  if (typeof raw === "string") return raw.trim() || undefined;
  return undefined;
}

function metaBool(meta: Meta, key: string): boolean {
  const raw = (meta as Record<string, unknown> | undefined)?.[key];
  return raw === true || raw === "true";
}

function metaNumber(meta: Meta, key: string): number | undefined {
  const raw = (meta as Record<string, unknown> | undefined)?.[key];
  const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
  return Number.isFinite(n) ? n : undefined;
}

/** Lista enumerada desde metadata: acepta array o string separada por comas. */
function metaEnumList<T extends string>(meta: Meta, key: string, valid: T[]): T[] {
  const raw = (meta as Record<string, unknown> | undefined)?.[key];
  const parts = Array.isArray(raw)
    ? raw.map((v) => String(v))
    : typeof raw === "string"
      ? raw.split(",")
      : [];
  return parts.map((s) => s.trim()).filter((s): s is T => (valid as string[]).includes(s));
}

/* ------------------------------ campos nativos ----------------------------- */

function categoryFromName(name: string | undefined): ProductCategory {
  const key = name?.toLowerCase();
  return (key && CATEGORY_BY_NAME[key]) || "accesorios";
}

function toCategory(product: StoreProduct): ProductCategory {
  return categoryFromName(product.categories?.[0]?.name);
}

/** Emoji placeholder por especie/categoría cuando no hay imagen real (U090). */
function emojiFor(category: ProductCategory, species: Species[]): string {
  if (category === "alimento") {
    return species.length === 1 && species[0] === "gato" ? "🐈" : "🐕";
  }
  return CATEGORY_EMOJI[category];
}

/** Variante primaria: la de menor `variant_rank` (o la primera disponible). */
function primaryVariant(product: StoreProduct): StoreVariant | undefined {
  const variants = product.variants ?? [];
  return [...variants].sort(
    (a, b) => (a.variant_rank ?? 0) - (b.variant_rank ?? 0),
  )[0];
}

function toPrice(variant: StoreVariant | undefined): Price {
  const calc = variant?.calculated_price;
  const current = calc?.calculated_amount ?? 0;
  const original = calc?.original_amount ?? current;
  // compareAt SOLO si el backend reporta un precio anterior real mayor (una rebaja
  // nativa de Medusa: price list/sale). Nunca se inventa (coherente con marca honesta).
  return original > current ? { current, compareAt: original } : { current };
}

function toStock(variant: StoreVariant | undefined): number {
  if (!variant) return 0;
  if (variant.manage_inventory === false) return 999; // sin gestión de stock = disponible
  return variant.inventory_quantity ?? 0;
}

/** Imagen: thumbnail → primera imagen → emoji placeholder (por especie/categoría). */
function toImageUrl(product: StoreProduct, category: ProductCategory, species: Species[]): string {
  const image = product.thumbnail ?? product.images?.[0]?.url;
  return image ?? emojiFor(category, species);
}

/**
 * Nombre a mostrar: el título sin el prefijo de marca ("Marca — Nombre" → "Nombre").
 * La marca se conoce desde metadata; esto es solo formateo de presentación, no
 * inferencia de atributos desde el nombre.
 */
function displayName(title: string, brandName: string): string {
  const prefix = `${brandName} — `;
  return (title.startsWith(prefix) ? title.slice(prefix.length) : title).trim();
}

export function mapProduct(product: StoreProduct): Product {
  const meta = product.metadata as Meta;
  const category = toCategory(product);
  const variant = primaryVariant(product);

  const brandName = metaString(meta, "brand") ?? "Manada";
  const brandSlug = slugify(brandName);
  const brand: Brand = {
    id: `b_${brandSlug.replace(/-/g, "_")}`,
    name: brandName,
    slug: brandSlug,
  };

  const species = metaEnumList<Species>(meta, "species", VALID_SPECIES);
  const stage = metaEnumList<LifeStage>(meta, "stage", VALID_STAGES);

  const subscribable = metaBool(meta, "subscribable");
  const subscriptionDiscount = subscribable
    ? metaNumber(meta, "subscription_discount_percentage")
    : undefined;
  // Precio de suscripción: lo calcula el backend; el frontend NO recalcula.
  const subscriptionPrice =
    typeof product.subscription_price === "number" ? product.subscription_price : undefined;

  const ratingValue = metaNumber(meta, "rating");
  const reviewCount = metaNumber(meta, "review_count");

  return {
    id: product.id,
    variantId: variant?.id,
    slug: product.handle,
    name: displayName(product.title, brandName),
    brand,
    category,
    species,
    stage: stage.length ? stage : undefined,
    price: toPrice(variant),
    format: variant?.title || undefined,
    rating: ratingValue !== undefined ? { value: ratingValue, count: reviewCount ?? 0 } : undefined,
    imageUrl: toImageUrl(product, category, species),
    subscribable,
    subscriptionDiscount,
    subscriptionPrice,
    stock: toStock(variant),
  };
}

/** Línea de carrito de Medusa: campos denormalizados + `product` (expandido). */
export interface StoreCartLineLike {
  id: string;
  product_id?: string;
  variant_id?: string;
  product_handle?: string;
  product_title?: string;
  variant_title?: string;
  title: string;
  thumbnail?: string;
  unit_price: number;
  quantity: number;
  product?: { metadata?: Meta; categories?: { name?: string }[] } | null;
}

/**
 * Mapea una línea de carrito de Medusa → `Product` para la UI de carrito/checkout.
 * Usa los campos denormalizados de la línea + `metadata` del producto expandido
 * (marca). El precio es el `unit_price` de la línea (ya en CLP del carrito), no un
 * precio recalculado. Compra única: sin datos de suscripción.
 */
export function mapLineItemProduct(line: StoreCartLineLike): Product {
  const meta = line.product?.metadata as Meta;
  const brandName = metaString(meta, "brand") ?? "Manada";
  const brandSlug = slugify(brandName);
  const category = categoryFromName(line.product?.categories?.[0]?.name);
  const species = metaEnumList<Species>(meta, "species", VALID_SPECIES);
  const title = line.product_title ?? line.title;

  return {
    id: line.product_id ?? "",
    variantId: line.variant_id,
    slug: line.product_handle ?? "",
    name: displayName(title, brandName),
    brand: { id: `b_${brandSlug.replace(/-/g, "_")}`, name: brandName, slug: brandSlug },
    category,
    species,
    price: { current: line.unit_price },
    format: line.variant_title || undefined,
    imageUrl: line.thumbnail ?? emojiFor(category, species),
    subscribable: metaBool(meta, "subscribable"),
    stock: 999,
  };
}
