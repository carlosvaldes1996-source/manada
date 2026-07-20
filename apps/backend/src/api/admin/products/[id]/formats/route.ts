import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { addProductFormat } from "./add-format";
import { AdminCreateFormatType } from "./validators";

/**
 * `POST /admin/products/:id/formats` — extensión de Manada para el Backoffice.
 *
 * En Medusa v2 una variante es una **combinación de valores de opción**; agregar
 * un formato "a mano" obliga a: (1) crear/definir la opción, (2) sumarle el valor,
 * (3) crear la variante con ese valor y su precio — y si el producto quedó con la
 * "Default variant" sin opciones, además hay que limpiarla. Ese baile es la razón
 * por la que crear formatos desde el Admin nativo es poco intuitivo (ver el widget
 * `product-add-format` que consume esta ruta).
 *
 * La lógica vive en `./add-format` (reutilizable y testeable). Las rutas `/admin/*`
 * quedan autenticadas por Medusa automáticamente; la validación del body (zod) se
 * aplica en `src/api/middlewares.ts`.
 */
export async function POST(
  req: MedusaRequest<AdminCreateFormatType>,
  res: MedusaResponse,
) {
  const productId = req.params.id;
  const formats = await addProductFormat(req.scope, productId, req.validatedBody);
  res.status(201).json({ product_id: productId, formats });
}
