/**
 * Configuración global del sitio Manada.
 * Datos de marca tomados de ai-context/PROJECT_MASTER.md y BRANDING.md (D8).
 */
export const SITE = {
  name: "Manada",
  domain: "tumanada.cl",
  url: "https://tumanada.cl",
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
    /** Umbral de envío gratis en CLP — alimenta la FreeShippingBar (AUDIT U042). */
    freeShippingThreshold: 30000,
    /** Productos por página en la PLP (descubrimiento por paginación, U067). */
    productsPerPage: 12,
  },
} as const;

export type Site = typeof SITE;
