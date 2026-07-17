import type { Product } from "@/types";
import { SITE } from "@/config/site";

/**
 * Datos estructurados JSON-LD (schema.org) — SEO de contenido (auditoría D48).
 *
 * Builders PUROS que devuelven objetos planos; el componente `<JsonLd>`
 * (`components/seo/json-ld.tsx`) los serializa en un `<script type="application/ld+json">`.
 * Un `@id` estable por entidad (Organization/WebSite) permite que Product y
 * Breadcrumb los referencien sin duplicar el nodo (grafo canónico).
 *
 * POLÍTICA: `aggregateRating` NO se emite. `rating`/`review_count` provienen del
 * seed/metadata y no son reseñas genuinas visibles en la página; publicarlas como
 * datos estructurados viola las políticas de Google (reseñas falsas → acción
 * manual). Se habilitará cuando existan reseñas reales renderizadas en la PDP.
 */

const ORG_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;

/** ¿URL de imagen real (absoluta o raíz-relativa) y no un emoji placeholder? */
function isRealImage(value?: string): value is string {
  return !!value && /^(https?:\/\/|\/)/.test(value);
}

/** Identidad de la marca (aparece en toda página vía el layout raíz). */
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/icon`,
    image: `${SITE.url}/opengraph-image`,
    description: SITE.description,
    email: `hola@${SITE.domain}`,
    areaServed: { "@type": "Country", name: "Chile" },
    // sameAs: [] // agregar perfiles sociales (Instagram, etc.) cuando existan
  };
}

/** El sitio + caja de búsqueda para sitelinks (SearchAction). */
export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: "es-CL",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/buscar?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Ficha de producto con oferta (precio CLP + disponibilidad real por stock). */
export function productLd(product: Product) {
  const url = `${SITE.url}/producto/${product.slug}`;
  const image = isRealImage(product.imageUrl)
    ? product.imageUrl
    : `${SITE.url}/opengraph-image`;
  const availability =
    product.stock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand.name} ${product.name}`,
    description: `${product.name}${product.format ? ` (${product.format})` : ""} de ${product.brand.name}.`,
    image,
    sku: product.id,
    brand: { "@type": "Brand", name: product.brand.name },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "CLP",
      price: product.price.current,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORG_ID },
    },
  };
}

/** Ruta de migas de pan (Home → … → actual). */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE.url}${it.path}`,
    })),
  };
}
