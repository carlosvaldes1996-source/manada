import { SITE } from "@/config/site";
import { categoryLabel } from "@/lib/catalog";
import type { Product } from "@/types";

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
 * emite campos con datos reales: sin `sku` (Medusa no lo expone en el mapeo) y sin
 * `aggregateRating` (el rating del catálogo no son reseñas verificadas de usuarios).
 */
export function productSchema(product: Product): JsonLdSchema {
  const url = absoluteUrl(`/producto/${product.slug}`);
  const image = resolveProductImage(product.imageUrl);
  const variants = product.variants ?? [];
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
