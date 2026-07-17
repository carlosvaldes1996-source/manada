/**
 * Configuración global del sitio Manada.
 * Datos de marca tomados de ai-context/PROJECT_MASTER.md y BRANDING.md (D8).
 */
export const SITE = {
  name: "Manada",
  domain: "tumanada.cl",
  // Host canónico = www (el ápex `tumanada.cl` redirige 308 → www en Vercel, D30).
  // `url` alimenta metadataBase, canonicals, OG, sitemap y robots: TODO debe
  // apuntar al destino final para no encadenar redirecciones (SEO, auditoría D48).
  url: "https://www.tumanada.cl",
  tagline: "Cuidamos a quien más quieres",
  description:
    "El e-commerce de mascotas que te conoce como nadie y se anticipa a lo que tu compañero necesita. Alimento, accesorios y farmacia con suscripción inteligente.",
  // Mensajes clave de marca (PROJECT_MASTER §8)
  messages: {
    knowledge: "Conocemos a tu mascota como nadie",
    anticipation: "Nos anticipamos para que nunca le falte nada",
  },
  // Reglas de comercio (palancas de AOV y descubrimiento)
  commerce: {
    /**
     * Productos por página en la PLP (descubrimiento por paginación, U067).
     * NOTA: el umbral de envío gratis NO vive aquí — es del backend (fuente única),
     * expuesto en `GET /store/shipping-policy` y consumido vía `getShippingPolicy()`.
     */
    productsPerPage: 12,
  },
} as const;

export type Site = typeof SITE;
