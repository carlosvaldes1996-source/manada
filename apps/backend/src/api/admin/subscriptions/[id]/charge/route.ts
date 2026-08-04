import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription";
import type SubscriptionModuleService from "../../../../../modules/subscription/service";
import { PAYMENT_METHOD_MODULE } from "../../../../../modules/payment-method";
import type PaymentMethodModuleService from "../../../../../modules/payment-method/service";
import { isFlowConfigured } from "../../../../../lib/flow";
import { chargeSubscriptionLocked, listDueSubscriptions } from "../../../../../lib/subscription-charge";

/**
 * `POST /admin/subscriptions/:id/charge` — dispara A MANO el cobro de UNA suscripción
 * (D59 · MVP). Es el reemplazo consciente del barrido automático mientras el volumen
 * es bajo: el operador elige explícitamente a quién cobrar (ver
 * `src/jobs/charge-due-subscriptions.ts` para el porqué).
 *
 * Cobra por el MISMO camino que el scheduler (`chargeSubscriptionLocked` → lock por
 * suscripción → `chargeDueSubscription` → ledger idempotente). No hay una segunda
 * ruta de cobro: un clic de más, un cron solapado o un doble submit no pueden cobrar
 * dos veces el mismo período.
 *
 * GUARDAS antes de tocar Flow (el caso esquina que queremos evitar es cobrarle a
 * quien no corresponde):
 *  1. La suscripción existe.
 *  2. Su estado admite cobro (`active` o `past_due`) — nunca `paused`/`cancelled`/`unpaid`.
 *  3. Tiene tarjeta tokenizada (`payment_method_id`) — descarta suscripciones legadas
 *     de D55/D56, que si no caerían en dunning y dispararían correos de fallo.
 *  4. Está VENCIDA según el mismo criterio del scheduler. Cobrar antes de tiempo es
 *     cobrar de más: se exige `force: true` explícito para saltarlo (con `force` se
 *     cobra el período pactado vigente, nunca uno adicional — lo impide el ledger).
 *
 * El resultado se devuelve tal cual lo reporta el motor (`outcome`), sin traducirlo a
 * un booleano: "cobrado", "ya estaba cobrado" y "rechazado" son desenlaces distintos
 * y el operador necesita distinguirlos.
 */

type SubShape = {
  id: string;
  status: string;
  payment_method_id: string | null;
  next_delivery_date: string | Date;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const subscriptionId = req.params.id;
  const subs = req.scope.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const cards = req.scope.resolve<PaymentMethodModuleService>(PAYMENT_METHOD_MODULE);
  const force = (req.body as { force?: unknown } | undefined)?.force === true;

  if (!isFlowConfigured()) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Flow no está configurado (FLOW_API_KEY / FLOW_SECRET_KEY). No se puede cobrar.",
    );
  }

  const sub = (await subs
    .retrieveSubscription(subscriptionId)
    .catch(() => null)) as unknown as SubShape | null;
  if (!sub) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "La suscripción no existe.");
  }

  if (sub.status !== "active" && sub.status !== "past_due") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `No se cobra una suscripción en estado "${sub.status}". Solo se cobran las activas o en reintento (past_due).`,
    );
  }

  if (!sub.payment_method_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Esta suscripción no tiene una tarjeta registrada (es anterior al cobro con tarjeta). " +
        "El cliente debe registrar su medio de pago antes de poder cobrarla.",
    );
  }
  const card = (await cards.listSavedCards({ id: sub.payment_method_id }))[0];
  if (!card?.gateway_customer_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "La tarjeta enlazada no tiene referencia cobrable en Flow. El cliente debe actualizar su medio de pago.",
    );
  }

  if (!force) {
    const isDue = (await listDueSubscriptions(req.scope)).some((d) => d.id === subscriptionId);
    if (!isDue) {
      const when = new Date(sub.next_delivery_date).toISOString().slice(0, 10);
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Esta suscripción aún no vence (próxima entrega: ${when}). Cobrarla ahora sería cobrar antes de tiempo.`,
      );
    }
  }

  const result = await chargeSubscriptionLocked(req.scope, subscriptionId);

  console.log(
    `[cobro] Disparo MANUAL desde el Admin para ${subscriptionId}: outcome=${result.outcome}` +
      (result.message ? ` (${result.message})` : "") +
      (force ? " [force]" : ""),
  );

  res.json({
    subscription_id: subscriptionId,
    outcome: result.outcome,
    order_id: result.orderId ?? null,
    message: result.message ?? null,
  });
}
