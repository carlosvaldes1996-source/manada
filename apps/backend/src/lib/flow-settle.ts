import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { completeCartWorkflow, capturePaymentWorkflow } from "@medusajs/core-flows";
import { FLOW_PAYMENT_MODULE } from "../modules/flow-payment";
import type FlowPaymentModuleService from "../modules/flow-payment/service";
import { getFlowConfig, getFlowStatus, FLOW_STATUS } from "./flow";

/**
 * Conciliación IDEMPOTENTE de un pago Flow (D58) — usada por AMBOS callbacks
 * (`urlConfirmation` server-to-server y `urlReturn` del navegador). Nunca asume
 * éxito por el retorno del usuario: SIEMPRE verifica con `payment/getStatus`.
 *
 * Solo cuando Flow confirma el pago (status == 2) se completa el carrito → se
 * crea la orden → se emite `order.placed` → se disparan correos + suscripción +
 * anticipación (subscribers existentes, sin tocar). La idempotencia se sostiene en
 * dos capas:
 *  1) El registro `flow_payment` como mutex: si ya está `paid`, no-op inmediato.
 *  2) `completeCartWorkflow` es idempotente y toma un lock sobre el `cart_id`:
 *     si la orden ya existe la devuelve sin re-emitir `order.placed`.
 * Así, aunque Flow reintente el callback o `urlReturn`/`urlConfirmation` lleguen a
 * la vez, la orden y sus efectos ocurren EXACTAMENTE una vez.
 */

/** Forma mínima de la función `query.graph` (evita acoplar al tipo completo). */
type QueryFn = {
  graph: (config: {
    entity: string;
    fields: string[];
    filters?: Record<string, unknown>;
  }) => Promise<{ data: Record<string, unknown>[] }>;
};

export type SettleOutcome = "paid" | "rejected" | "canceled" | "pending" | "not_found";

export interface SettleResult {
  outcome: SettleOutcome;
  orderId?: string;
  displayId?: number;
}

export async function settleFlowPayment(
  container: MedusaContainer,
  token: string,
): Promise<SettleResult> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as QueryFn;
  const flowService = container.resolve<FlowPaymentModuleService>(FLOW_PAYMENT_MODULE);

  const records = await flowService.listFlowPayments({ token });
  const record = records[0];
  if (!record) {
    console.warn(`[flow] Callback con token desconocido (${token.slice(0, 8)}…). Ignorado.`);
    return { outcome: "not_found" };
  }

  // (1) Mutex por registro: ya conciliado como pagado → no-op idempotente.
  if (record.status === "paid") {
    return {
      outcome: "paid",
      orderId: record.order_id ?? undefined,
      displayId: await displayIdOf(query, record.order_id),
    };
  }

  const config = getFlowConfig();
  const status = await getFlowStatus(token, config);

  // Estado no pagado → persistimos el crudo y no provisionamos nada.
  if (status.status !== FLOW_STATUS.PAID) {
    const outcome: SettleOutcome =
      status.status === FLOW_STATUS.REJECTED
        ? "rejected"
        : status.status === FLOW_STATUS.CANCELED
          ? "canceled"
          : "pending";
    await flowService.updateFlowPayments({
      id: record.id,
      status: outcome === "pending" ? "pending" : outcome,
      raw_status: status.status,
      flow_order: status.flowOrder ? String(status.flowOrder) : record.flow_order,
    });
    return { outcome };
  }

  // Aviso de conciliación si el monto no coincide (no bloquea: nuestro total es la
  // fuente de verdad y es lo que se le pidió cobrar a Flow).
  if (status.amount != null && Number(status.amount) !== record.amount) {
    console.warn(
      `[flow] Monto de Flow (${status.amount}) ≠ registrado (${record.amount}) para ${record.commerce_order}.`,
    );
  }

  // (2) Pagado: completar el carrito (idempotente + con lock) → crea la orden y
  // dispara order.placed una sola vez. Si falla la provisión, dejamos el error y
  // relanzamos: el webhook responderá != 200 y Flow reintentará.
  let orderId: string;
  try {
    const { result } = await completeCartWorkflow(container).run({
      input: { id: record.cart_id },
    });
    orderId = result.id;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await flowService.updateFlowPayments({ id: record.id, error: message, raw_status: status.status });
    console.error(`[flow] Pago confirmado pero no se pudo crear la orden (${record.commerce_order}): ${message}`);
    throw e;
  }

  // Captura del pago (best-effort): refleja "Pagado" en el Admin, ya que Flow sí
  // cobró. Un fallo aquí no revierte la orden (queda autorizada, capturable a mano).
  await capturePaymentBestEffort(container, query, record.payment_collection_id ?? undefined);

  await flowService.updateFlowPayments({
    id: record.id,
    status: "paid",
    raw_status: status.status,
    order_id: orderId,
    flow_order: status.flowOrder ? String(status.flowOrder) : record.flow_order,
    error: null,
  });

  return { outcome: "paid", orderId, displayId: await displayIdOf(query, orderId) };
}

/** display_id legible de una orden (para el redirect a la confirmación). */
async function displayIdOf(
  query: QueryFn,
  orderId?: string | null,
): Promise<number | undefined> {
  if (!orderId) return undefined;
  try {
    const { data } = await query.graph({
      entity: "order",
      fields: ["display_id"],
      filters: { id: orderId },
    });
    return (data?.[0]?.display_id as number | undefined) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Captura los pagos autorizados de la payment collection (no lanza). */
async function capturePaymentBestEffort(
  container: MedusaContainer,
  query: QueryFn,
  paymentCollectionId?: string,
): Promise<void> {
  if (!paymentCollectionId) return;
  try {
    const { data } = await query.graph({
      entity: "payment_collection",
      fields: ["id", "payments.id", "payments.captured_at"],
      filters: { id: paymentCollectionId },
    });
    const payments = (data?.[0]?.payments ?? []) as { id: string; captured_at?: string | null }[];
    for (const p of payments) {
      if (p.captured_at) continue;
      await capturePaymentWorkflow(container).run({ input: { payment_id: p.id } });
    }
  } catch (e) {
    console.warn(`[flow] No se pudo capturar el pago (queda autorizado, capturable en el Admin):`, e);
  }
}
