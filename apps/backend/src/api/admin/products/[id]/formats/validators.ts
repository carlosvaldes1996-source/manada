import { z } from "@medusajs/deps/zod";

/**
 * Validación de borde para `POST /admin/products/:id/formats` (extensión de
 * Manada; ver route.ts + el widget `product-add-format`). Reutiliza la instancia
 * de zod que Medusa centraliza en `@medusajs/deps` (misma que `validateAndTransformBody`).
 *
 * `price_clp` es un entero CLP (el peso chileno no usa decimales). Se acepta como
 * string y se coacciona, porque el input numérico del Admin llega como texto.
 */
export const AdminCreateFormat = z.object({
  /** Etiqueta del formato = título de la variante y valor de la opción "Formato" (ej. "14 kg"). */
  format: z.string().trim().min(1).max(60),
  /** Precio de venta en CLP (entero > 0). */
  price_clp: z.coerce.number().int().positive().max(100_000_000),
  /** SKU opcional; si se omite, la variante queda sin SKU (editable después). */
  sku: z.string().trim().min(1).max(120).optional(),
  /** ¿Gestiona stock? Por defecto true (coherente con el catálogo del seed). */
  manage_inventory: z.boolean().optional(),
});
export type AdminCreateFormatType = z.infer<typeof AdminCreateFormat>;
