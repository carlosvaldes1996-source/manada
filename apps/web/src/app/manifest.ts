import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

/**
 * Web App Manifest (SEO/reputación/PWA, auditoría D48). Da a los navegadores el
 * nombre, colores y modo de la app para "Añadir a pantalla de inicio" y refuerza
 * la señal de "sitio real" (los navegadores desconfían menos de un origen con
 * manifest + iconos + theme color coherentes). Sirve el `favicon.ico` (garantizado)
 * y el ícono PNG generado en `app/icon.tsx` para instalaciones de mayor resolución.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#faf6f0", // Arena
    theme_color: "#faf6f0", // Arena (coincide con viewport.themeColor)
    lang: "es-CL",
    categories: ["shopping", "pets", "lifestyle"],
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
