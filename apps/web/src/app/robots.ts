import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

/**
 * robots.txt (SEO técnico, D46). Deja rastrear todo el catálogo público y
 * excluye lo privado/funcional (checkout, cuenta, carrito, autenticación y el
 * styleguide `/dev`), que no aporta a la indexación y consume presupuesto de
 * rastreo. Apunta al sitemap para que Google descubra productos y categorías.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dev/",
        "/checkout",
        "/carrito",
        "/cuenta",
        "/ingresar",
        "/crear-cuenta",
        "/recuperar",
        "/bienvenida",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
