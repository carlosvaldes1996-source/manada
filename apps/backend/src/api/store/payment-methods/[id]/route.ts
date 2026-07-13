import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { PAYMENT_METHOD_MODULE } from "../../../../modules/payment-method";
import PaymentMethodModuleService from "../../../../modules/payment-method/service";

/**
 * `DELETE /store/payment-methods/:id` (API.md §10.2) — eliminar UNA tarjeta propia.
 *
 * - Propiedad: la tarjeta debe pertenecer al `customer_id` del token; si no,
 *   404 (no se revela existencia — mismo patrón que `/store/pets/:id`).
 * - Soft delete: la fila queda auditable (`deleted_at`) y desaparece de todos
 *   los listados. Cuando Mercado Pago entre, este endpoint además revocará la
 *   card en MP (`DELETE /v1/customers/{gateway_customer_id}/cards/{gateway_card_id}`)
 *   vía el servicio, sin cambio de contrato.
 */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cards = req.scope.resolve<PaymentMethodModuleService>(PAYMENT_METHOD_MODULE);
  const { id } = req.params;

  const [existing] = await cards.listSavedCards({
    id,
    customer_id: req.auth_context.actor_id,
  });
  if (!existing) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `El medio de pago ${id} no existe`);
  }

  await cards.softDeleteSavedCards(id);
  res.json({ id, object: "saved_card", deleted: true });
}
