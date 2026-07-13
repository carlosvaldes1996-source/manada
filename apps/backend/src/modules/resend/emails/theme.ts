/**
 * Tokens de marca para los emails de Manada — FUENTE ÚNICA.
 *
 * Espejo de los design tokens del storefront (`apps/web/src/app/globals.css`).
 * Se duplican los HEX aquí (y no se importan) a propósito: los emails corren en
 * el backend y los clientes de correo NO entienden CSS variables ni clases —
 * todo estilo va inline con valores literales. Si cambia la paleta en el front,
 * se actualiza este archivo (un solo lugar para todos los emails).
 */
export const brand = {
  color: {
    // Marca
    terracota: "#c2603f", // terracota-500 · acción / marca
    terracotaDark: "#a54e31", // terracota-600 · texto de marca
    terracotaSoft: "#fbf0eb", // terracota-50 · fondos suaves
    pino: "#1d3933", // pino-700 · verde profundo (encabezados)
    miel: "#eaae47", // miel-400 · acento cálido
    // Neutros
    ink: "#2a2722", // neutral-800 · Carbón · texto principal
    body: "#403a33", // neutral-700 · texto de párrafo
    muted: "#6f665a", // neutral-500 · texto secundario (AA sobre Arena)
    border: "#e0d8cc", // neutral-200 · bordes / divisores
    surface: "#ffffff", // neutral-0 · tarjetas
    canvas: "#faf6f0", // neutral-50 · Arena · fondo de página
    canvasAlt: "#f0eae1", // neutral-100 · bloques suaves
    white: "#ffffff",
    // Estado
    success: "#3c8c5a",
    successSoft: "#e7f2ec",
  },
  font: {
    // Fraunces no carga fiable en clientes de correo → fallback serif (Georgia).
    display: "'Fraunces', 'Georgia', 'Times New Roman', serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  radius: "12px",
  maxWidth: "600px",
} as const

/** Formatea montos en CLP (Medusa v2 entrega el total en unidad mayor). */
export function formatCLP(amount: number | null | undefined): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

/** URL pública del storefront para CTAs (misma env que usa el subscriber de reset). */
export const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:3000"
