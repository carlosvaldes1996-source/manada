import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";
import { CATEGORIES } from "@/lib/catalog";
import { listProducts } from "@/lib/medusa";

/**
 * Sitemap (SEO técnico, D46). Se genera en cada request (`force-dynamic`) para
 * reflejar el catálogo real de Medusa. Incluye home, páginas informativas,
 * categorías (PLP) y cada producto (PDP). Si el backend no responde al generar
 * (build/incidencia), degrada con gracia a las rutas estáticas — nunca rompe.
 */
export const dynamic = "force-dynamic";

/** PLPs indexables: categorías del catálogo + vistas transversales. */
const CATEGORY_SLUGS = ["todo", ...CATEGORIES.map((c) => c.slug), "ofertas"];

/** Rutas informativas estáticas (contenido de marca/legal público). */
const STATIC_PATHS = [
  "",
  "/comenzar",
  "/nosotros",
  "/ayuda",
  "/despacho",
  "/devoluciones",
  "/privacidad",
  "/terminos",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.5,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${base}/categoria/${slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await listProducts();
    productRoutes = products.map((p) => ({
      url: `${base}/producto/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // Backend no disponible al generar: publicamos el resto igual.
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
