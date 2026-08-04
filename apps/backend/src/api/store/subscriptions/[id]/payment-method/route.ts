import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { registerFlowCard, getFlowConfig } from "../../../../../lib/flow";
import { ensureFlowCustomer } from "../../../../../lib/flow-customer";

/**
 * `POST /store/subscriptions/:id/payment-method` (API.md §13.3, D59) — inicia la
 * ACTUALIZACIÓN de la tarjeta de una suscripción (típicamente en dunning `past_due`).
 * Devuelve la URL de Flow para ingresar la tarjeta nueva.
 *
 * Propiedad: la suscripción debe pertenecer al cliente autenticado (Module Link
 * Customer↔Subscription); si no, 404 (no revela existencia). El resultado se concilia
 * en `/flow/register-return?sub=:id` (→ `settleSubscriptionCardUpdate`): refresca la
 * tarjeta, reengancha a `active` y reintenta el cobro.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  getFlowConfig(); // lanza claro si faltan las llaves de Flow

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name", "subscriptions.id"],
    filters: { id: req.auth_context.actor_id },
  });
  if (!customer?.email) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Necesitas una cuenta.");
  }
  const owns = ((customer.subscriptions ?? []) as { id: string }[]).some((s) => s.id === id);
  if (!owns) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `La suscripción ${id} no existe`);
  }

  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();
  const flowCustomerId = await ensureFlowCustomer(req.scope, {
    customerId: customer.id,
    name,
    email: customer.email,
  });

  const backendUrl = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "");
  const { redirectUrl } = await registerFlowCard(
    { customerId: flowCustomerId, urlReturn: `${backendUrl}/flow/register-return?sub=${id}` },
    getFlowConfig(),
  );

  res.json({ url: redirectUrl });
}
