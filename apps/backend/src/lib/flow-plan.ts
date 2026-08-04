import type { MedusaContainer } from "@medusajs/framework/types";
import { FLOW_SUBSCRIPTION_MODULE } from "../modules/flow-subscription";
import type FlowSubscriptionModuleService from "../modules/flow-subscription/service";
import {
  createFlowPlan,
  getFlowPlan,
  getFlowConfig,
  FlowApiError,
  FLOW_INTERVAL,
  FLOW_PLAN_STATUS,
  type FlowPlan,
} from "./flow";

/**
 * ORQUESTADOR de planes de Flow (D71) — la costura entre la tarifa de Manada y el
 * `Plan` de Flow.
 *
 * ── La idea central ───────────────────────────────────────────────────────────
 * Un Plan de Flow es solo (monto, moneda, intervalo, cuenta). No conoce productos.
 * Por eso NO se crea "un plan por variante" sino **un plan por punto de precio ×
 * cadencia**, compartido entre todos los clientes y productos que coincidan. Con
 * ~172 variantes × 4 frecuencias, modelarlo por variante exigiría cientos de planes;
 * modelarlo por economía los reduce a los precios realmente suscritos y los reutiliza.
 *
 * ── La idempotencia sale gratis ───────────────────────────────────────────────
 * A diferencia del `customerId` (hash que genera Flow), el `planId` lo elige el
 * comercio. Al derivarlo determinísticamente del propio contenido económico, el
 * mismo precio+cadencia produce SIEMPRE el mismo `planId`: no hay forma de crear un
 * duplicado, ni siquiera en una carrera.
 */

type LocalFlowPlan = {
  id: string;
  plan_id: string;
  amount: number;
  currency_code: string;
  interval: number;
  interval_count: number;
  status: number;
  last_synced_at: Date | null;
};

function service(container: MedusaContainer): FlowSubscriptionModuleService {
  return container.resolve<FlowSubscriptionModuleService>(FLOW_SUBSCRIPTION_MODULE);
}

/** Códigos cortos por intervalo, para que el `planId` sea legible en el panel de Flow. */
const INTERVAL_CODE: Record<number, string> = {
  [FLOW_INTERVAL.DAILY]: "D",
  [FLOW_INTERVAL.WEEKLY]: "W",
  [FLOW_INTERVAL.MONTHLY]: "M",
  [FLOW_INTERVAL.YEARLY]: "Y",
};

export interface PlanSpec {
  /** Monto por período (entero, en la unidad de la moneda: CLP sin decimales). */
  amount: number;
  /** `interval` de Flow (1 diario · 2 semanal · 3 mensual · 4 anual). */
  interval: number;
  /** Multiplicador del intervalo. */
  intervalCount: number;
  currencyCode?: string;
}

/**
 * La cadencia de Manada se expresa en SEMANAS (`subscription.frequency_weeks`:
 * 2, 4, 6, 8…). Flow la expresa como `interval` + `interval_count`, y tiene intervalo
 * semanal — así que el mapeo es DIRECTO, sin pérdida ni redondeo:
 * `frequency_weeks = N` → `interval = 2 (semanal)`, `interval_count = N`.
 *
 * Se usa el intervalo semanal incluso para múltiplos de 4 (en vez de mensual) porque
 * "cada 4 semanas" y "cada 1 mes" NO son lo mismo: 13 cobros al año contra 12. La
 * cadencia de Manada la fija el consumo del saco, que se mide en semanas (D64).
 */
export function planSpecFromWeeks(amount: number, frequencyWeeks: number, currencyCode = "clp"): PlanSpec {
  return {
    amount,
    interval: FLOW_INTERVAL.WEEKLY,
    intervalCount: frequencyWeeks,
    currencyCode,
  };
}

/** Valida una especificación antes de gastar una llamada a Flow. */
export function assertValidPlanSpec(spec: PlanSpec): void {
  if (!Number.isInteger(spec.amount) || spec.amount <= 0) {
    throw new Error(`[flow] Monto de plan inválido: ${spec.amount} (debe ser entero > 0).`);
  }
  if (!INTERVAL_CODE[spec.interval]) {
    throw new Error(
      `[flow] Intervalo inválido: ${spec.interval} (1 diario · 2 semanal · 3 mensual · 4 anual).`,
    );
  }
  if (!Number.isInteger(spec.intervalCount) || spec.intervalCount < 1) {
    throw new Error(
      `[flow] interval_count inválido: ${spec.intervalCount} (debe ser entero ≥ 1).`,
    );
  }
}

/**
 * Deriva el `planId` determinista. Formato: `MANADA-CLP-29990-W4`
 * (= $29.990 CLP cada 4 semanas). Sin espacios, como exige el spec, y legible en el
 * panel de Flow sin tener que cruzarlo con nuestra base.
 */
export function flowPlanIdFor(spec: PlanSpec): string {
  assertValidPlanSpec(spec);
  const currency = (spec.currencyCode ?? "clp").toUpperCase();
  return `MANADA-${currency}-${spec.amount}-${INTERVAL_CODE[spec.interval]}${spec.intervalCount}`;
}

/** Nombre legible del plan, el que se ve en el panel de Flow. */
function planNameFor(spec: PlanSpec): string {
  const currency = (spec.currencyCode ?? "clp").toUpperCase();
  const cadence =
    spec.interval === FLOW_INTERVAL.WEEKLY
      ? spec.intervalCount === 1
        ? "semanal"
        : `cada ${spec.intervalCount} semanas`
      : `intervalo ${spec.interval} x${spec.intervalCount}`;
  return `Manada ${spec.amount} ${currency} ${cadence}`;
}

/** Lee el registro local de un plan (o `null`). */
export async function getFlowPlanRecord(
  container: MedusaContainer,
  planId: string,
): Promise<LocalFlowPlan | null> {
  const rows = (await service(container).listFlowPlans({ plan_id: planId })) as LocalFlowPlan[];
  return rows[0] ?? null;
}

/**
 * Resuelve el plan de Flow para una tarifa, creándolo si no existe. Única puerta de
 * entrada: nadie más debe llamar a `createFlowPlan`.
 *
 * Orden de resolución (de lo barato a lo caro):
 *  1. Registro local → devuelve sin tocar la red.
 *  2. `plans/get` → el plan ya existe en Flow pero no lo teníamos anotado (p. ej. se
 *     creó en un entorno anterior o a mano en el panel): se adopta.
 *  3. `plans/create` → no existía.
 *
 * El paso 2 es lo que hace esto seguro de reintentar: como el `planId` es
 * determinista, "ya existe" es un desenlace ESPERADO, no un error.
 */
export async function ensureFlowPlan(
  container: MedusaContainer,
  spec: PlanSpec,
  options: { urlCallback?: string } = {},
): Promise<string> {
  assertValidPlanSpec(spec);
  const config = getFlowConfig();
  const svc = service(container);
  const planId = flowPlanIdFor(spec);
  const currencyCode = (spec.currencyCode ?? "clp").toLowerCase();

  const local = await getFlowPlanRecord(container, planId);
  if (local && local.status !== FLOW_PLAN_STATUS.DELETED) return local.plan_id;

  // ¿Existe ya en Flow? (registro local perdido, o plan eliminado que hay que revisar)
  let remote: FlowPlan | null = null;
  try {
    remote = await getFlowPlan(planId, config);
  } catch (e) {
    // 400/401 = "no existe" en la práctica; cualquier otra cosa se propaga.
    if (!(e instanceof FlowApiError) || e.httpStatus === 0 || e.httpStatus >= 500) throw e;
  }

  if (remote && remote.status !== FLOW_PLAN_STATUS.DELETED) {
    await upsertLocalPlan(container, planId, spec, currencyCode, remote.status ?? 1, local?.id);
    return planId;
  }

  if (remote && remote.status === FLOW_PLAN_STATUS.DELETED) {
    // Un plan eliminado no admite nuevas suscripciones y su id no se puede reutilizar
    // con otro precio. Es un caso que exige intervención, no un reintento silencioso.
    throw new Error(
      `[flow] El plan ${planId} está ELIMINADO en Flow. Las suscripciones vivas siguen su ciclo, ` +
        `pero no se pueden crear nuevas contra él. Revísalo en el panel de Flow.`,
    );
  }

  let createdStatus: number;
  try {
    const created = await createFlowPlan(
      {
        planId,
        name: planNameFor(spec),
        amount: spec.amount,
        interval: spec.interval as 1 | 2 | 3 | 4,
        intervalCount: spec.intervalCount,
        currency: currencyCode.toUpperCase(),
        urlCallback: options.urlCallback,
      },
      config,
    );
    createdStatus = created.status ?? 1;
  } catch (e) {
    // CARRERA: otro proceso pasó el `plans/get` a la vez y creó el plan primero, así
    // que este `create` choca contra un `planId` ya tomado. El spec no documenta qué
    // error devuelve Flow ante un id duplicado, así que no se adivina por el código:
    // se REPREGUNTA. Si el plan ya existe y está activo, es EXACTAMENTE el que
    // queríamos (el id es determinista: mismo id ⇒ mismo precio y cadencia), se
    // adopta y la carrera queda resuelta sin efectos. Si no existe, el fallo era real.
    const nowExists = await getFlowPlan(planId, config).catch(() => null);
    if (!nowExists || nowExists.status === FLOW_PLAN_STATUS.DELETED) throw e;

    console.warn(`[flow] Carrera al crear el plan ${planId}: ya existía en Flow, se adopta.`);
    createdStatus = nowExists.status ?? 1;
  }

  await upsertLocalPlan(container, planId, spec, currencyCode, createdStatus, local?.id);
  return planId;
}

async function upsertLocalPlan(
  container: MedusaContainer,
  planId: string,
  spec: PlanSpec,
  currencyCode: string,
  status: number,
  existingId?: string,
): Promise<void> {
  const svc = service(container);
  const payload = {
    plan_id: planId,
    amount: spec.amount,
    currency_code: currencyCode,
    interval: spec.interval,
    interval_count: spec.intervalCount,
    status,
    last_synced_at: new Date(),
  };

  if (existingId) {
    await svc.updateFlowPlans({ id: existingId, ...payload });
    return;
  }
  try {
    await svc.createFlowPlans(payload);
  } catch {
    // Carrera: otra petición anotó el mismo `plan_id`. Como el id es determinista,
    // ambas se refieren al MISMO plan de Flow — no hay nada que reconciliar.
    const winner = await getFlowPlanRecord(container, planId);
    if (!winner) throw new Error(`[flow] No se pudo registrar el plan ${planId}.`);
  }
}

/** Re-lee el plan desde Flow y refresca el espejo local. */
export async function syncFlowPlan(
  container: MedusaContainer,
  planId: string,
): Promise<FlowPlan | null> {
  const local = await getFlowPlanRecord(container, planId);
  if (!local) return null;

  const remote = await getFlowPlan(planId, getFlowConfig());
  await service(container).updateFlowPlans({
    id: local.id,
    status: remote.status ?? local.status,
    last_synced_at: new Date(),
  });
  return remote;
}

export type { LocalFlowPlan };
