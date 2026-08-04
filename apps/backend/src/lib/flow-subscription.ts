import type { MedusaContainer } from "@medusajs/framework/types";
import { FLOW_SUBSCRIPTION_MODULE } from "../modules/flow-subscription";
import type FlowSubscriptionModuleService from "../modules/flow-subscription/service";
import {
  createFlowSubscription,
  getFlowSubscription,
  cancelFlowSubscription,
  changeFlowSubscriptionPlan,
  previewFlowSubscriptionPlanChange,
  cancelFlowSubscriptionPlanChange,
  getFlowConfig,
  FLOW_SUBSCRIPTION_STATUS,
  type FlowSubscription,
} from "./flow";
import { ensureFlowPlan, flowPlanIdFor, type PlanSpec } from "./flow-plan";

/**
 * ORQUESTADOR de suscripciones de Flow (D71) — la costura entre el dominio de
 * Manada y el modelo NATIVO de suscripción de Flow.
 *
 * Reparto (igual que en D70):
 *   `lib/flow/subscriptions.ts`  → habla el API. No conoce Medusa.
 *   `modules/flow-subscription`  → persiste el espejo. No conoce Flow.
 *   este archivo                 → decide, garantiza idempotencia y sincroniza.
 *
 * ⚠️ **Todavía NO está conectado** al módulo `subscription` de Manada ni al checkout
 * (decisión de alcance de esta etapa). `subscriptionId` de Manada viaja como
 * parámetro OPCIONAL para poder enlazar cuando se conecte, sin migración.
 */

type LocalFlowSubscription = {
  id: string;
  flow_subscription_id: string;
  flow_plan_id: string;
  flow_customer_id: string;
  subscription_id: string | null;
  status: number;
  morose: number;
  cancel_at_period_end: number;
  period_start: Date | null;
  period_end: Date | null;
  next_invoice_date: Date | null;
  last_synced_at: Date | null;
};

function service(container: MedusaContainer): FlowSubscriptionModuleService {
  return container.resolve<FlowSubscriptionModuleService>(FLOW_SUBSCRIPTION_MODULE);
}

/** Flow devuelve `yyyy-mm-dd hh:mm:ss` sin zona; se interpreta tal cual. */
function parseFlowDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Copia a la fila local el estado que acaba de reportar Flow. */
function mirrorPayload(remote: FlowSubscription) {
  return {
    flow_plan_id: remote.planId ?? "",
    status: remote.status ?? FLOW_SUBSCRIPTION_STATUS.NOT_STARTED,
    morose: remote.morose ?? 0,
    cancel_at_period_end: remote.cancelAtPeriodEnd ?? 0,
    period_start: parseFlowDate(remote.periodStart),
    period_end: parseFlowDate(remote.periodEnd),
    next_invoice_date: parseFlowDate(remote.nextInvoiceDate),
    last_synced_at: new Date(),
  };
}

/** Lee el espejo local por el id de Flow. */
export async function getFlowSubscriptionRecord(
  container: MedusaContainer,
  flowSubscriptionId: string,
): Promise<LocalFlowSubscription | null> {
  const rows = (await service(container).listFlowSubscriptions({
    flow_subscription_id: flowSubscriptionId,
  })) as LocalFlowSubscription[];
  return rows[0] ?? null;
}

/** Lee el espejo local por el id de la suscripción de Manada (cuando esté enlazada). */
export async function getFlowSubscriptionForManada(
  container: MedusaContainer,
  subscriptionId: string,
): Promise<LocalFlowSubscription | null> {
  const rows = (await service(container).listFlowSubscriptions({
    subscription_id: subscriptionId,
  })) as LocalFlowSubscription[];
  return rows[0] ?? null;
}

export interface StartSubscriptionArgs {
  /** `customerId` de Flow (`cus_…`) — resuélvelo con `ensureFlowCustomer` (D70). */
  flowCustomerId: string;
  /** Tarifa: monto por período + cadencia. El plan se crea/reutiliza solo. */
  plan: PlanSpec;
  /** `subscription.id` de Manada, si ya existe. Opcional mientras no se conecte. */
  subscriptionId?: string;
  /** `yyyy-mm-dd`. Si se omite, Flow arranca de inmediato. */
  subscriptionStart?: string;
  trialPeriodDays?: number;
  periodsNumber?: number;
  couponId?: number;
  planAdditionalList?: number[];
  /** URL donde Flow notificará los pagos del plan (se fija al CREAR el plan). */
  urlCallback?: string;
}

export interface StartSubscriptionResult {
  flowSubscriptionId: string;
  flowPlanId: string;
  /** `true` si se reutilizó una suscripción ya existente en vez de crear otra. */
  reused: boolean;
  remote: FlowSubscription;
}

/**
 * Suscribe un cliente en Flow: asegura el plan y crea la suscripción.
 *
 * **Idempotencia.** Flow no ofrece "crear si no existe" para suscripciones y su
 * `subscriptionId` lo genera él, así que —igual que con los clientes (D70)— la
 * garantía es LOCAL: si ya hay una fila para esta suscripción de Manada, se devuelve
 * esa y **no se llama a Flow**. Sin esa guarda, un doble submit dejaría al cliente
 * con dos suscripciones cobrando en paralelo.
 *
 * Cuando no se pasa `subscriptionId` (uso de laboratorio, esta etapa) no hay clave
 * de negocio con la cual deduplicar: cada llamada crea una suscripción nueva. Es
 * correcto para probar la integración, y por eso conectar el checkout —donde SÍ hay
 * clave— es la etapa siguiente.
 */
export async function startFlowSubscription(
  container: MedusaContainer,
  args: StartSubscriptionArgs,
): Promise<StartSubscriptionResult> {
  const config = getFlowConfig();
  const svc = service(container);

  // Guarda de idempotencia: ¿esta suscripción de Manada ya vive en Flow?
  if (args.subscriptionId) {
    const existing = await getFlowSubscriptionForManada(container, args.subscriptionId);
    if (existing) {
      const remote = await getFlowSubscription(existing.flow_subscription_id, config);
      await svc.updateFlowSubscriptions({ id: existing.id, ...mirrorPayload(remote) });
      return {
        flowSubscriptionId: existing.flow_subscription_id,
        flowPlanId: remote.planId ?? existing.flow_plan_id,
        reused: true,
        remote,
      };
    }
  }

  const planId = await ensureFlowPlan(container, args.plan, { urlCallback: args.urlCallback });

  const remote = await createFlowSubscription(
    {
      planId,
      customerId: args.flowCustomerId,
      subscriptionStart: args.subscriptionStart,
      trialPeriodDays: args.trialPeriodDays,
      periodsNumber: args.periodsNumber,
      couponId: args.couponId,
      planAdditionalList: args.planAdditionalList,
    },
    config,
  );

  try {
    await svc.createFlowSubscriptions({
      flow_subscription_id: remote.subscriptionId,
      flow_customer_id: args.flowCustomerId,
      subscription_id: args.subscriptionId ?? null,
      ...mirrorPayload(remote),
    });
  } catch (e) {
    // Carrera sobre `subscription_id`: otra petición ya enlazó esta suscripción de
    // Manada. La que acabamos de crear en Flow queda HUÉRFANA y cobraría de más, así
    // que se cancela de inmediato antes de devolver la ganadora.
    const winner = args.subscriptionId
      ? await getFlowSubscriptionForManada(container, args.subscriptionId)
      : null;
    if (!winner) throw e;

    console.warn(
      `[flow] Carrera al suscribir ${args.subscriptionId}: se conserva ${winner.flow_subscription_id} ` +
        `y se CANCELA la duplicada ${remote.subscriptionId}.`,
    );
    try {
      await cancelFlowSubscription(
        { subscriptionId: remote.subscriptionId, atPeriodEnd: false },
        config,
      );
    } catch (cancelError) {
      console.error(
        `[flow] ¡ATENCIÓN! No se pudo cancelar la suscripción duplicada ${remote.subscriptionId}. ` +
          `Cancélala a mano en el panel de Flow o cobrará dos veces:`,
        cancelError,
      );
    }
    const winnerRemote = await getFlowSubscription(winner.flow_subscription_id, config);
    return {
      flowSubscriptionId: winner.flow_subscription_id,
      flowPlanId: winnerRemote.planId ?? winner.flow_plan_id,
      reused: true,
      remote: winnerRemote,
    };
  }

  return {
    flowSubscriptionId: remote.subscriptionId,
    flowPlanId: planId,
    reused: false,
    remote,
  };
}

/** Re-lee la suscripción desde Flow y refresca el espejo local. */
export async function syncFlowSubscription(
  container: MedusaContainer,
  flowSubscriptionId: string,
): Promise<FlowSubscription | null> {
  const local = await getFlowSubscriptionRecord(container, flowSubscriptionId);
  if (!local) return null;

  const remote = await getFlowSubscription(flowSubscriptionId, getFlowConfig());
  await service(container).updateFlowSubscriptions({ id: local.id, ...mirrorPayload(remote) });
  return remote;
}

/**
 * Cancela la suscripción en Flow y refleja el resultado.
 *
 * `atPeriodEnd = true` la cancela al terminar el período vigente (el cliente
 * conserva lo ya pagado); `false` la corta de inmediato.
 */
export async function stopFlowSubscription(
  container: MedusaContainer,
  args: { flowSubscriptionId: string; atPeriodEnd: boolean },
): Promise<FlowSubscription> {
  const remote = await cancelFlowSubscription(
    { subscriptionId: args.flowSubscriptionId, atPeriodEnd: args.atPeriodEnd },
    getFlowConfig(),
  );
  const local = await getFlowSubscriptionRecord(container, args.flowSubscriptionId);
  if (local) {
    await service(container).updateFlowSubscriptions({ id: local.id, ...mirrorPayload(remote) });
  }
  return remote;
}

/**
 * Cambia la TARIFA de una suscripción viva (precio y/o cadencia).
 *
 * Es la única vía posible: un plan con suscriptores es inmutable salvo el trial
 * (`plans/edit`), así que "cambiar el precio" significa **crear otro plan y mover la
 * suscripción**. Se asegura el plan destino y se llama a `subscription/changePlan`;
 * Flow devuelve el prorrateo en `balance`.
 */
export async function changeFlowSubscriptionTariff(
  container: MedusaContainer,
  args: { flowSubscriptionId: string; plan: PlanSpec; startDate?: string; urlCallback?: string },
) {
  const newPlanId = await ensureFlowPlan(container, args.plan, { urlCallback: args.urlCallback });
  const result = await changeFlowSubscriptionPlan(
    {
      subscriptionId: args.flowSubscriptionId,
      newPlanId,
      startDateOfNewPlan: args.startDate,
    },
    getFlowConfig(),
  );
  // El cambio puede quedar PROGRAMADO a futuro, así que el plan vigente lo dicta Flow.
  await syncFlowSubscription(container, args.flowSubscriptionId);
  return result;
}

/**
 * Previsualiza el cambio de tarifa SIN aplicarlo — para poder mostrarle al cliente
 * el prorrateo antes de que confirme.
 *
 * ⚠️ Asegura el plan destino en Flow (crearlo es inocuo y no cobra nada), porque
 * `changePlanPreview` exige un `newPlanId` que exista.
 */
export async function previewFlowSubscriptionTariff(
  container: MedusaContainer,
  args: { flowSubscriptionId: string; plan: PlanSpec; startDate?: string },
) {
  const newPlanId = await ensureFlowPlan(container, args.plan);
  return previewFlowSubscriptionPlanChange(
    { subscriptionId: args.flowSubscriptionId, newPlanId, startDateOfNewPlan: args.startDate },
    getFlowConfig(),
  );
}

/** Anula un cambio de plan programado y refresca el espejo. */
export async function cancelScheduledTariffChange(
  container: MedusaContainer,
  flowSubscriptionId: string,
) {
  const result = await cancelFlowSubscriptionPlanChange(flowSubscriptionId, getFlowConfig());
  await syncFlowSubscription(container, flowSubscriptionId);
  return result;
}

/**
 * Enlaza una suscripción de Flow ya existente con una de Manada. Pensado para el
 * momento en que se conecte el checkout (y para reconciliar a mano si hiciera falta).
 */
export async function linkToManadaSubscription(
  container: MedusaContainer,
  args: { flowSubscriptionId: string; subscriptionId: string },
): Promise<void> {
  const local = await getFlowSubscriptionRecord(container, args.flowSubscriptionId);
  if (!local) {
    throw new Error(`[flow] No hay espejo local para ${args.flowSubscriptionId}.`);
  }
  await service(container).updateFlowSubscriptions({
    id: local.id,
    subscription_id: args.subscriptionId,
  });
}

export { flowPlanIdFor };
export type { LocalFlowSubscription };
