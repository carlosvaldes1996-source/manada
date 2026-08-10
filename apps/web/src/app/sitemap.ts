import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";
import { CATEGORIES } from "@/lib/catalog";
import { listProductsForSitemap, type ProductSitemapEntry } from "@/lib/medusa";

/**
 * Sitemap (SEO técnico, D46). Se genera en cada request (`force-dynamic`) para
 * reflejar el catálogo real de Medusa. Incluye home, páginas informativas,
 * categorías (PLP) y cada producto (PDP). Si el backend no responde al generar
 * (build/incidencia), degrada con gracia a las rutas estáticas — nunca rompe.
 *
 * **`lastModified` es una fecha real o no se emite.** Antes todas las rutas
 * llevaban la hora del request: para Google eso equivale a "todo cambió siempre",
 * así que ignora el `lastmod` del sitemap entero y pierde la única señal barata
 * que tenemos para pedir un recrawl cuando una ficha cambia de verdad (p. ej. al
 * subir su packshot). Ahora:
 *   · PDP        → `updated_at` del producto en Medusa.
 *   · PLP        → el `updated_at` más reciente de los productos que muestra.
 *   · Home       → el más reciente del catálogo (sus vitrinas salen del catálogo).
 *   · Estáticas  → sin `lastmod`: su contenido vive en el código y no tenemos una
 *                  fecha real que ofrecer. Omitirlo es correcto (Google usa sus
 *                  propias señales); inventarlo contamina el resto del sitemap.
 *
 * Límite conocido: `updated_at` es del registro de producto, así que cubre título,
 * descripción, imágenes y metadata. Un cambio que solo toque el precio (módulo de
 * pricing) puede no moverlo; para eso el disparador de recrawl sigue siendo el
 * propio crawl de Google, no el sitemap.
 */
export const dynamic = "force-dynamic";

/** Rutas informativas estáticas (contenido de marca/legal público). */
const STATIC_PATHS = [
  "/comenzar",
  "/nosotros",
  "/ayuda",
  "/despacho",
  "/devoluciones",
  "/privacidad",
  "/terminos",
];

/** Fecha más reciente de una lista (ignora las entradas sin fecha real). */
function latest(dates: (Date | null)[]): Date | undefined {
  let max: Date | undefined;
  for (const date of dates) {
    if (date && (!max || date > max)) max = date;
  }
  return max;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;

  let products: ProductSitemapEntry[] = [];
  try {
    products = await listProductsForSitemap();
  } catch {
    // Backend no disponible al generar: publicamos el resto igual.
  }

  const latestOverall = latest(products.map((p) => p.updatedAt));
  // Clave = categoría del dominio, que coincide con el slug de la PLP (lib/catalog).
  const latestByCategory = new Map<string, Date>();
  for (const product of products) {
    if (!product.updatedAt) continue;
    const current = latestByCategory.get(product.category);
    if (!current || product.updatedAt > current) {
      latestByCategory.set(product.category, product.updatedAt);
    }
  }

  const home: MetadataRoute.Sitemap = [
    {
      url: base,
      ...(latestOverall ? { lastModified: latestOverall } : {}),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];

  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  // PLPs indexables: catálogo completo + departamentos + ofertas. "todo" y
  // "ofertas" recorren todo el catálogo, así que su fecha es la global.
  const categoryRoutes: MetadataRoute.Sitemap = [
    { slug: "todo", lastModified: latestOverall },
    ...CATEGORIES.map((category) => ({
      slug: category.slug,
      lastModified: latestByCategory.get(category.id),
    })),
    { slug: "ofertas", lastModified: latestOverall },
  ].map(({ slug, lastModified }) => ({
    url: `${base}/categoria/${slug}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}/producto/${product.slug}`,
    ...(product.updatedAt ? { lastModified: product.updatedAt } : {}),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...home, ...staticRoutes, ...categoryRoutes, ...productRoutes];
}
