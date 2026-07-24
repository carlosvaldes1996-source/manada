import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription";
import SubscriptionModuleService from "../../../../modules/subscription/service";
import { StoreUpdateSubscriptionType } from "./validators";

/**
 * `PATCH /store/subscriptions/:id` (API.md §13.2, D56·D) — gestión del plan.
 *
 * - Propiedad: la suscripción debe estar entre las del cliente (Module Link
 *   Customer↔Subscription, resuelto con `query.graph`); si no, 404 (no revela
 *   existencia — mismo patrón que `/store/pets/:id`).
 * - Un solo endpoint flexible: cambiar frecuencia, pausar/reanudar/cancelar
 *   (status) y saltar (next_delivery_date). No hay efectos secundarios: el
 *   scheduler (motor de entregas) es un bloque posterior; esto solo configura.
 */
export async function PATCH(
  req: AuthenticatedMedusaRequest<StoreUpdateSubscriptionType>,
  res: MedusaResponse,
) {
  const subs = req.scope.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;

  const { data } = await query.graph({
    entity: "customer",
    fields: ["subscriptions.id"],
    filters: { id: req.auth_context.actor_id },
  });
  const owns = ((data?.[0]?.subscriptions ?? []) as { id: string }[]).some((s) => s.id === id);
  if (!owns) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `La suscripción ${id} no existe`);
  }

  const update: Record<string, unknown> = { ...req.validatedBody };
  if (typeof update.next_delivery_date === "string") {
    update.next_delivery_date = new Date(update.next_delivery_date);
  }

  const subscription = await subs.updateSubscriptions({ id, ...update });
  res.json({ subscription });
}
