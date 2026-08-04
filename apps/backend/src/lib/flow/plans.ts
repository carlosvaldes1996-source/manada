import { flowGet, flowPost, FlowApiError, type FlowConfig, type FlowParams } from "./http";

/**
 * Bindings del servicio `plans` de Flow (D71, Etapa 2) — capa ALTA.
 * Fuente: `ai-context/assets/flow-openapi-3.0.1.yaml`, tag `plans`.
 *
 * Un **Plan** de Flow es, literalmente, una TARIFA RECURRENTE: monto + moneda +
 * cadencia. NO tiene producto, SKU, cantidad ni catálogo — el spec del schema `Plan`
 * solo declara `planId · name · currency · amount · interval · interval_count · …`.
 * Todo lo que sea "qué se despacha" es del dominio de Manada, no de Flow.
 *
 * Dos propiedades del spec mandan sobre el diseño:
 *
 *  1. **`planId` lo elige el COMERCIO** ("Un texto identificador del Plan, sin
 *     espacios, ejemplo: PlanMensual"), a diferencia de `customerId`, que Flow
 *     genera. Eso permite derivarlo determinísticamente y hace la creación
 *     idempotente por construcción.
 *  2. **Un plan con suscriptores es INMUTABLE salvo el trial**: `plans/edit` dice
 *     "Si el plan tiene clientes suscritos sólo se puede modificar el campo
 *     `trial_period_days`". Un cambio de precio NO se edita: se crea otro plan y se
 *     mueve la suscripción con `subscription/changePlan`.
 */

/** `interval` del spec: frecuencia de cobro del plan. */
export const FLOW_INTERVAL = {
  DAILY: 1,
  WEEKLY: 2,
  MONTHLY: 3,
  YEARLY: 4,
} as const;

export type FlowInterval = (typeof FLOW_INTERVAL)[keyof typeof FLOW_INTERVAL];

/** `status` del schema `Plan`: 1 activo · 0 eliminado. */
export const FLOW_PLAN_STATUS = {
  DELETED: 0,
  ACTIVE: 1,
} as const;

export interface FlowPlan {
  planId: string;
  name?: string;
  currency?: string;
  amount?: number;
  interval?: number;
  intervalCount?: number;
  created?: string;
  trialPeriodDays?: number;
  daysUntilDue?: number;
  periodsNumber?: number;
  urlCallback?: string;
  chargesRetriesNumber?: number;
  currencyConvertOption?: number;
  /** 1 activo · 0 eliminado. */
  status?: number;
  /** 1 público · 0 privado. */
  public?: number;
  raw: Record<string, unknown>;
}

type RawPlan = Record<string, unknown> & {
  planId?: string;
  name?: string;
  currency?: string;
  amount?: number | string;
  interval?: number;
  interval_count?: number;
  created?: string;
  trial_period_days?: number;
  days_until_due?: number;
  periods_number?: number;
  urlCallback?: string;
  charges_retries_number?: number;
  currency_convert_option?: number;
  status?: number | string;
  public?: number;
};

const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

function toFlowPlan(data: RawPlan, endpoint: string): FlowPlan {
  if (!data.planId) {
    throw new FlowApiError({ endpoint, httpStatus: 200, message: "Respuesta sin `planId`." });
  }
  return {
    planId: String(data.planId),
    name: data.name,
    currency: data.currency,
    amount: num(data.amount),
    interval: num(data.interval),
    intervalCount: num(data.interval_count),
    created: data.created,
    trialPeriodDays: num(data.trial_period_days),
    daysUntilDue: num(data.days_until_due),
    periodsNumber: num(data.periods_number),
    urlCallback: data.urlCallback,
    chargesRetriesNumber: num(data.charges_retries_number),
    currencyConvertOption: num(data.currency_convert_option),
    status: num(data.status),
    public: num(data.public),
    raw: data,
  };
}

export interface CreatePlanInput {
  /** Elegido por nosotros. Sin espacios (requisito del spec). */
  planId: string;
  name: string;
  amount: number;
  interval: FlowInterval;
  currency?: string;
  /** Multiplicador de la frecuencia: `interval=2` + `interval_count=4` = cada 4 semanas. */
  intervalCount?: number;
  trialPeriodDays?: number;
  /** Días tras generar el importe para considerarlo vencido (por omisión 3). */
  daysUntilDue?: number;
  /** Períodos de duración. 0 / omitido = indefinido. */
  periodsNumber?: number;
  /** URL donde Flow notifica los pagos de ESTE plan. */
  urlCallback?: string;
  /** Reintentos de cargo (por omisión Flow usa 3). */
  chargesRetriesNumber?: number;
  currencyConvertOption?: number;
}

/**
 * `POST plans/create` — crea un Plan. Requeridos por el spec: `apiKey`, `planId`,
 * `name`, `amount`, `interval`, `s`.
 *
 * Sin reintento: el `planId` es nuestro, así que un reintento ciego chocaría contra
 * un plan ya creado. La idempotencia la resuelve `lib/flow-plan.ts` consultando
 * primero (`plans/get`).
 */
export async function createFlowPlan(
  input: CreatePlanInput,
  config: FlowConfig,
): Promise<FlowPlan> {
  const params: FlowParams = {
    apiKey: config.apiKey,
    planId: input.planId,
    name: input.name,
    amount: input.amount,
    interval: input.interval,
    currency: input.currency ?? "CLP",
  };
  if (input.intervalCount !== undefined) params.interval_count = input.intervalCount;
  if (input.trialPeriodDays !== undefined) params.trial_period_days = input.trialPeriodDays;
  if (input.daysUntilDue !== undefined) params.days_until_due = input.daysUntilDue;
  if (input.periodsNumber !== undefined) params.periods_number = input.periodsNumber;
  if (input.urlCallback !== undefined) params.urlCallback = input.urlCallback;
  if (input.chargesRetriesNumber !== undefined) {
    params.charges_retries_number = input.chargesRetriesNumber;
  }
  if (input.currencyConvertOption !== undefined) {
    params.currency_convert_option = input.currencyConvertOption;
  }

  const data = await flowPost<RawPlan>("plans/create", params, config);
  return toFlowPlan(data, "plans/create");
}

/** `GET plans/get` — lee un plan por su `planId`. Lectura idempotente → con reintento. */
export async function getFlowPlan(planId: string, config: FlowConfig): Promise<FlowPlan> {
  const data = await flowGet<RawPlan>("plans/get", { apiKey: config.apiKey, planId }, config, {
    retry: true,
  });
  return toFlowPlan(data, "plans/get");
}

export interface EditPlanInput {
  planId: string;
  name?: string;
  currency?: string;
  amount?: number;
  interval?: FlowInterval;
  intervalCount?: number;
  trialPeriodDays?: number;
  daysUntilDue?: number;
  periodsNumber?: number;
  urlCallback?: string;
  chargesRetriesNumber?: number;
  currencyConvertOption?: number;
}

/**
 * `POST plans/edit` — edita un plan.
 *
 * ⚠️ RESTRICCIÓN DEL SPEC, textual: "Si el plan tiene clientes suscritos sólo se
 * puede modificar el campo **trial_period_days**". Es decir: el PRECIO y la CADENCIA
 * de un plan con suscriptores no se pueden cambiar. Para cambiar el precio hay que
 * crear un plan nuevo y mover la suscripción con `subscription/changePlan`.
 */
export async function editFlowPlan(input: EditPlanInput, config: FlowConfig): Promise<FlowPlan> {
  const params: FlowParams = { apiKey: config.apiKey, planId: input.planId };
  if (input.name !== undefined) params.name = input.name;
  if (input.currency !== undefined) params.currency = input.currency;
  if (input.amount !== undefined) params.amount = input.amount;
  if (input.interval !== undefined) params.interval = input.interval;
  if (input.intervalCount !== undefined) params.interval_count = input.intervalCount;
  if (input.trialPeriodDays !== undefined) params.trial_period_days = input.trialPeriodDays;
  if (input.daysUntilDue !== undefined) params.days_until_due = input.daysUntilDue;
  if (input.periodsNumber !== undefined) params.periods_number = input.periodsNumber;
  if (input.urlCallback !== undefined) params.urlCallback = input.urlCallback;
  if (input.chargesRetriesNumber !== undefined) {
    params.charges_retries_number = input.chargesRetriesNumber;
  }
  if (input.currencyConvertOption !== undefined) {
    params.currency_convert_option = input.currencyConvertOption;
  }

  const data = await flowPost<RawPlan>("plans/edit", params, config, { retry: true });
  return toFlowPlan(data, "plans/edit");
}

/**
 * `POST plans/delete` — elimina un plan.
 *
 * Según el spec: eliminar un plan significa que **ya no se podrán suscribir nuevos
 * clientes**, pero "las suscripciones activas continuarán su ciclo de vida mientras
 * estas no sean canceladas". No es destructivo para quien ya está dentro.
 */
export async function deleteFlowPlan(planId: string, config: FlowConfig): Promise<FlowPlan> {
  const data = await flowPost<RawPlan>("plans/delete", { apiKey: config.apiKey, planId }, config);
  return toFlowPlan(data, "plans/delete");
}

export interface ListPlansInput {
  start?: number;
  /** Por omisión 10, máximo 100. */
  limit?: number;
  /** Filtra por NOMBRE del plan. */
  filter?: string;
  /** 1 activo · 0 eliminado. */
  status?: number;
}

export interface FlowPlanPage {
  total: number;
  hasMore: boolean;
  data: FlowPlan[];
}

/** `GET plans/list` — lista paginada de planes. Filtro de texto = nombre del plan. */
export async function listFlowPlans(
  input: ListPlansInput,
  config: FlowConfig,
): Promise<FlowPlanPage> {
  const params: FlowParams = { apiKey: config.apiKey };
  if (input.start !== undefined) params.start = input.start;
  if (input.limit !== undefined) params.limit = input.limit;
  if (input.filter !== undefined) params.filter = input.filter;
  if (input.status !== undefined) params.status = input.status;

  const data = await flowGet<{ total?: number; hasMore?: boolean | number; data?: RawPlan[] }>(
    "plans/list",
    params,
    config,
    { retry: true },
  );

  return {
    total: Number(data.total ?? 0),
    hasMore: Boolean(data.hasMore),
    data: (Array.isArray(data.data) ? data.data : []).map((p) => toFlowPlan(p, "plans/list")),
  };
}
