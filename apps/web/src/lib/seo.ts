import { SITE } from "@/config/site";
import { categoryLabel } from "@/lib/catalog";
import type { LifeStage, Product, ProductCategory, Species } from "@/types";

/**
 * Datos estructurados (JSON-LD) del sitio. Un único dueño de los schemas de
 * schema.org que Manada expone a buscadores/IA: Organization (marca), Product
 * (PDP) y BreadcrumbList (navegación). Todo se construye SOLO con datos reales
 * del catálogo/config; los campos ausentes se omiten (recomendación de Google).
 */

/** Un nodo JSON-LD es un árbol arbitrario de schema.org. */
export type JsonLdSchema = Record<string, unknown>;

const SCHEMA_ORG = "https://schema.org";
const CURRENCY = "CLP";

/** Convierte una ruta del sitio en URL absoluta (schema.org y OG exigen absolutas). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE.url}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Resuelve la imagen "real" de un producto a URL absoluta, o `null` si no hay una.
 * `product.imageUrl` puede ser un emoji placeholder (ej. 🐕) cuando el catálogo
 * aún no tiene foto: en ese caso NO es una imagen válida y debe omitirse (evita
 * un `og:image`/`image` que devuelva 404). Solo se acepta http(s) o ruta del sitio.
 */
export function resolveProductImage(imageUrl: string | undefined): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith("/")) return absoluteUrl(imageUrl);
  return null; // emoji u otro placeholder → sin imagen
}

/* --------------------- metadatos de texto de la ficha ---------------------- */
/**
 * `<title>` y `<meta name="description">` de la PDP. Un único dueño de estos
 * textos: los consume `generateMetadata` (HTML `<head>`, SSR) y también OpenGraph.
 * El objetivo es doble — que Google prefiera USAR estos metadatos, y que cuando
 * construya su propio snippet tenga materia prima limpia. Se componen SOLO con
 * datos reales del producto; los campos ausentes se omiten (nada de relleno).
 */

/** Sustantivo de categoría para la frase de tipo ("alimento para perros"). */
const CATEGORY_NOUN: Record<ProductCategory, string> = {
  alimento: "alimento",
  accesorios: "accesorio",
  farmacia: "producto de farmacia",
  higiene: "producto de higiene",
  snacks: "snack",
};

/** Plural natural de especie para el copy ("perros", "gatos", "mascotas"). */
const SPECIES_PLURAL: Record<Species, string> = {
  perro: "perros",
  gato: "gatos",
  otro: "mascotas",
};

/** Plural natural de etapa ("cachorros", "adultos", "senior" es invariable). */
const STAGE_PLURAL: Record<LifeStage, string> = {
  cachorro: "cachorros",
  adulto: "adultos",
  senior: "senior",
};

/** Une una lista en español natural: "a", "a y b", "a, b y c". */
function joinEs(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

/** Audiencia del producto: "perros adultos" · "gatos" · "perros y gatos" · "". */
function audiencePhrase(product: Product): string {
  const species = joinEs(product.species.map((s) => SPECIES_PLURAL[s]));
  const stage = product.stage?.length ? joinEs(product.stage.map((s) => STAGE_PLURAL[s])) : "";
  return [species, stage].filter(Boolean).join(" ");
}

/** Nombre completo para metadatos: "Marca Producto" (sin duplicar si la marca es Manada). */
function fullName(product: Product): string {
  const brand = product.brand.name;
  return brand && brand !== SITE.name ? `${brand} ${product.name}` : product.name;
}

/**
 * Primera frase del beneficio real del catálogo, recortada en frontera de palabra.
 * Devuelve `null` si no hay descripción. Se usa como "beneficio principal" del copy.
 */
function catalogBenefit(product: Product, max = 120): string | null {
  const text = product.description?.trim();
  if (!text) return null;
  const first = text.split(/(?<=[.!?])\s/)[0].trim();
  const clipped =
    first.length > max ? `${first.slice(0, max).replace(/\s+\S*$/, "")}…` : first;
  return /[.!?…]$/.test(clipped) ? clipped : `${clipped}.`;
}

/**
 * `<title>` de la PDP: "Producto · Marca" (la plantilla del layout añade "· Manada",
 * dando "Producto · Marca · Manada"). El nombre del producto va primero —lo más
 * específico y buscado— y se conserva la marca por su valor de búsqueda. Si la marca
 * es el fallback "Manada", se omite para no duplicarla con la plantilla.
 */
export function productMetaTitle(product: Product): string {
  const brand = product.brand.name;
  return brand && brand !== SITE.name ? `${product.name} · ${brand}` : product.name;
}

/**
 * `<meta name="description">` única por producto (~≤160 caracteres, lo que Google
 * suele mostrar). Combina, cuando existen: marca + nombre + tipo de alimento + etapa
 * + especie (frase de tipo), el diferenciador de Manada (solo alimento: la ración y
 * la duración del saco solo aplican a comida) y el despacho a domicilio en Chile.
 * Prioriza el gancho de mayor CTR y sólo suma el beneficio del catálogo si cabe
 * (evita keyword stuffing: una frase natural, no una lista de palabras clave).
 */
export function productMetaDescription(product: Product): string {
  const audience = audiencePhrase(product);
  const noun = CATEGORY_NOUN[product.category];
  const typePhrase = audience ? `${noun} para ${audience}` : noun;
  const lead = `${fullName(product)}: ${typePhrase}.`;
  const benefit = catalogBenefit(product);
  const shipping = "Despacho a domicilio en Chile.";

  if (product.category === "alimento") {
    // El diferenciador de Manada manda en alimento; el beneficio del catálogo se
    // añade sólo si el conjunto sigue cabiendo en el largo recomendado.
    const hook = "Calcula su ración diaria y cuánto le dura el saco.";
    if (benefit) {
      const withBenefit = `${lead} ${hook} ${benefit} ${shipping}`;
      if (withBenefit.length <= 160) return withBenefit;
    }
    return `${lead} ${hook} ${shipping}`;
  }

  // No-alimento: el beneficio real del catálogo es el gancho (si existe y cabe).
  if (benefit) {
    const withBenefit = `${lead} ${benefit} ${shipping}`;
    if (withBenefit.length <= 160) return withBenefit;
  }
  return `${lead} Cómpralo en Manada con ${shipping.charAt(0).toLowerCase()}${shipping.slice(1)}`;
}

/** Nodo de vendedor reutilizable (la tienda Manada). */
function sellerNode(): JsonLdSchema {
  return { "@type": "Organization", name: SITE.name };
}

/**
 * Organization — nodo de marca ÚNICO para toda la app (se renderiza una sola vez,
 * en el layout). Incluye contacto real de soporte; omite `sameAs` hasta que existan
 * perfiles sociales verificados.
 */
export function organizationSchema(): JsonLdSchema {
  return {
    "@context": SCHEMA_ORG,
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl("/opengraph-image"),
    description: SITE.description,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: `hola@${SITE.domain}`,
      areaServed: "CL",
      availableLanguage: "Spanish",
    },
  };
}

/**
 * Product (PDP) — sigue las recomendaciones de Google para e-commerce. Con más de
 * un formato usa `AggregateOffer` (rango de precios); con uno, `Offer` simple. Solo
 * emite campos con datos reales: `sku` sólo cuando es inequívoco (una única variante)
 * y sin `aggregateRating` (el rating del catálogo no son reseñas verificadas de usuarios).
 */
export function productSchema(product: Product): JsonLdSchema {
  const url = absoluteUrl(`/producto/${product.slug}`);
  const image = resolveProductImage(product.imageUrl);
  const variants = product.variants ?? [];
  // SKU a nivel de Product sólo si hay una única variante (identificador inequívoco);
  // con varios formatos el SKU es por-variante y se omite para no publicar uno ambiguo.
  const sku = variants.length === 1 ? variants[0].sku : undefined;
  const inStock = product.stock > 0 || variants.some((v) => v.stock > 0);
  const availability = `${SCHEMA_ORG}/${inStock ? "InStock" : "OutOfStock"}`;
  const itemCondition = `${SCHEMA_ORG}/NewCondition`;

  let offers: JsonLdSchema;
  if (variants.length > 1) {
    const prices = variants.map((v) => v.price.current);
    offers = {
      "@type": "AggregateOffer",
      priceCurrency: CURRENCY,
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: variants.length,
      availability,
      itemCondition,
      url,
      seller: sellerNode(),
    };
  } else {
    offers = {
      "@type": "Offer",
      priceCurrency: CURRENCY,
      price: product.price.current,
      availability,
      itemCondition,
      url,
      seller: sellerNode(),
    };
  }

  return {
    "@context": SCHEMA_ORG,
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(sku ? { sku } : {}),
    ...(image ? { image: [image] } : {}),
    brand: { "@type": "Brand", name: product.brand.name },
    category: categoryLabel(product.category),
    offers,
  };
}

/** Un eslabón de la miga. `path` (ruta del sitio o URL) se omite en el último item si se desea. */
export interface BreadcrumbItem {
  name: string;
  path?: string;
}

/** BreadcrumbList a partir de la navegación real del sitio (PDP y PLP). */
export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLdSchema {
  return {
    "@context": SCHEMA_ORG,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}
