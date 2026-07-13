import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PAYMENT_METHOD_MODULE } from "../../../modules/payment-method";
import PaymentMethodModuleService from "../../../modules/payment-method/service";

/**
 * `/store/payment-methods` (API.md §10) — tarjetas guardadas del cliente.
 *
 * La autenticación (`authenticate("customer", …)`) se aplica en
 * `src/api/middlewares.ts`; aquí solo se impone la PROPIEDAD: todo se filtra
 * con el `customer_id` del token — un cliente jamás ve tarjetas ajenas.
 *
 * Sin POST a propósito: las tarjetas nacen SERVER-SIDE en la integración de
 * pago (Mercado Pago, fast-follow) — nunca desde un formulario propio (PCI).
 */

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cards = req.scope.resolve<PaymentMethodModuleService>(PAYMENT_METHOD_MODULE);
  const list = await cards.listSavedCards(
    { customer_id: req.auth_context.actor_id },
    { order: { created_at: "DESC" } },
  );
  res.json({ payment_methods: list });
}
