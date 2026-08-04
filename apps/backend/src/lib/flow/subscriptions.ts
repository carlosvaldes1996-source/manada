import { flowGet, flowPost, FlowApiError, type FlowConfig, type FlowParams } from "./http";

/**
 * Bindings de los servicios `subscription` y `subscription_item` de Flow (D71).
 * Fuente: `ai-context/assets/flow-openapi-3.0.1.yaml`, tags `subscription` y
 * `subscription_items`.
 *
 * Una **Subscription** de Flow es la unión de un CLIENTE y un PLAN, más su reloj:
 * `subscriptionId` (`sus_…`, lo genera Flow) + `planId` + `customerId` +
 * `period_start`/`period_end`/`next_invoice_date`. No contiene productos ni
 * cantidades: lo único económico que aporta sobre el plan son los `planAdditionalList`
 * (items adicionales) y los cupones.
 *
 * ⚠️ Lo que Flow NO modela (verificado por ausencia en el spec): no hay estado
 * "pausada" ni operación de "saltar un período". El `status` del schema solo admite
 * 0 no iniciada · 1 activa · 2 trial · 4 cancelada.
 */

/** `status` del schema `Subscription`. */
export const FLOW_SUBSCRIPTION_STATUS = {
  /** 0 Inactivo (no iniciada). */
  NOT_STARTED: 0,
  ACTIVE: 1,
  TRIALING: 2,
  CANCELLED: 4,
} as const;

/** `morose` del schema `Subscription`. */
export const FLOW_MOROSE = {
  /** 0 si todos los invoices están pagados. */
  NONE: 0,
  /** 1 si uno o más invoices están vencidos. */
  OVERDUE: 1,
  /** 2 si uno o más están pendientes de pago, pero no vencidos. */
  PENDING: 2,
} as const;

export interface FlowSubscriptionItem {
  sItemId?: number;
  itemId?: number;
  subId?: number;
  name?: string;
  currency?: string;
  amount?: number;
  raw: Record<string, unknown>;
}

export interface FlowSubscription {
  subscriptionId: string;
  planId?: string;
  planName?: string;
  customerId?: string;
  created?: string;
  subscriptionStart?: string;
  /** null si la suscripción no tiene término. */
  subscriptionEnd?: string | null;
  periodStart?: string;
  periodEnd?: string;
  nextInvoiceDate?: string;
  trialPeriodDays?: number;
  trialStart?: string;
  trialEnd?: string;
  /** 1 = se cancelará al terminar el período actual. */
  cancelAtPeriodEnd?: number;
  cancelAt?: string | null;
  periodsNumber?: number;
  daysUntilDue?: number;
  /** 0 no iniciada · 1 activa · 2 trial · 4 cancelada. */
  status?: number;
  discountBalance?: string;
  /** Plan programado para el próximo cambio, si hay uno pendiente. */
  newPlanId?: string | number | null;
  newPlanScheduledChangeDate?: string | null;
  inNewPlanNextAttemptDate?: string | null;
  /** 0 al día · 1 vencido · 2 pendiente no vencido. */
  morose?: number;
  planAdditionalList: FlowSubscriptionItem[];
  invoices: Record<string, unknown>[];
  raw: Record<string, unknown>;
}

type RawSubscription = Record<string, unknown> & {
  subscriptionId?: string;
  planId?: string;
  plan_name?: string;
  customerId?: string;
};

const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const str = (v: unknown): string | undefined =>
  v === undefined || v === null ? undefined : String(v);

function toSubscriptionItem(raw: Record<string, unknown>): FlowSubscriptionItem {
  return {
    sItemId: num(raw.s_item_id),
    itemId: num(raw.item_id),
    subId: num(raw.sub_id),
    name: str(raw.name),
    currency: str(raw.currency),
    amount: num(raw.amount),
    raw,
  };
}

function toFlowSubscription(data: RawSubscription, endpoint: string): FlowSubscription {
  if (!data.subscriptionId) {
    throw new FlowApiError({
      endpoint,
      httpStatus: 200,
      message: "Respuesta sin `subscriptionId`.",
    });
  }
  const additionals = Array.isArray(data.planAdditionalList)
    ? (data.planAdditionalList as Record<string, unknown>[])
    : [];
  return {
    subscriptionId: String(data.subscriptionId),
    planId: str(data.planId),
    planName: str(data.plan_name),
    customerId: str(data.customerId),
    created: str(data.created),
    subscriptionStart: str(data.subscription_start),
    subscriptionEnd: data.subscription_end === null ? null : str(data.subscription_end),
    periodStart: str(data.period_start),
    periodEnd: str(data.period_end),
    nextInvoiceDate: str(data.next_invoice_date),
    trialPeriodDays: num(data.trial_period_days),
    trialStart: str(data.trial_start),
    trialEnd: str(data.trial_end),
    cancelAtPeriodEnd: num(data.cancel_at_period_end),
    cancelAt: data.cancel_at === null ? null : str(data.cancel_at),
    periodsNumber: num(data.periods_number),
    daysUntilDue: num(data.days_until_due),
    status: num(data.status),
    discountBalance: str(data.discount_balance),
    newPlanId: (data.newPlanId as string | number | null) ?? null,
    newPlanScheduledChangeDate:
      data.new_plan_scheduled_change_date === null
        ? null
        : str(data.new_plan_scheduled_change_date),
    inNewPlanNextAttemptDate:
      data.in_new_plan_next_attempt_date === null
        ? null
        : str(data.in_new_plan_next_attempt_date),
    morose: num(data.morose),
    planAdditionalList: additionals.map(toSubscriptionItem),
    invoices: Array.isArray(data.invoices) ? (data.invoices as Record<string, unknown>[]) : [],
    raw: data,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ciclo de vida de la suscripción.
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateSubscriptionInput {
  planId: string;
  customerId: string;
  /** `yyyy-mm-dd`. Si se omite, Flow arranca de inmediato. */
  subscriptionStart?: string;
  couponId?: number;
  /** Si se omite, Flow usa el del plan. */
  trialPeriodDays?: number;
  /** Si se omite, Flow usa el del plan. */
  periodsNumber?: number;
  /** Ids de items adicionales (`subscription_item`) a asociar al crear. */
  planAdditionalList?: number[];
}

/**
 * `POST subscription/create` — suscribe un cliente a un plan. Requeridos por el
 * spec: `apiKey`, `planId`, `customerId`, `s`.
 *
 * Sin reintento: crear dos veces produciría DOS suscripciones (y dos cobros
 * recurrentes) para el mismo cliente. La idempotencia la resuelve
 * `lib/flow-subscription.ts` con su registro local.
 */
export async function createFlowSubscription(
  input: CreateSubscriptionInput,
  config: FlowConfig,
): Promise<FlowSubscription> {
  const params: FlowParams = {
    apiKey: config.apiKey,
    planId: input.planId,
    customerId: input.customerId,
  };
  if (input.subscriptionStart !== undefined) params.subscription_start = input.subscriptionStart;
  if (input.couponId !== undefined) params.couponId = input.couponId;
  if (input.trialPeriodDays !== undefined) params.trial_period_days = input.trialPeriodDays;
  if (input.periodsNumber !== undefined) params.periods_number = input.periodsNumber;
  if (input.planAdditionalList?.length) {
    // El spec lo declara `type: array` sobre form-urlencoded; se envía como lista
    // repetida en notación PHP, que es lo que consume el backend de Flow.
    input.planAdditionalList.forEach((id, i) => {
      params[`planAdditionalList[${i}]`] = id;
    });
  }

  const data = await flowPost<RawSubscription>("subscription/create", params, config);
  return toFlowSubscription(data, "subscription/create");
}

/** `GET subscription/get` — lee una suscripción por `subscriptionId`. Con reintento. */
export async function getFlowSubscription(
  subscriptionId: string,
  config: FlowConfig,
): Promise<FlowSubscription> {
  const data = await flowGet<RawSubscription>(
    "subscription/get",
    { apiKey: config.apiKey, subscriptionId },
    config,
    { retry: true },
  );
  return toFlowSubscription(data, "subscription/get");
}

export interface ListSubscriptionsInput {
  /** REQUERIDO por el spec: no existe un listado global de suscripciones. */
  planId: string;
  start?: number;
  limit?: number;
  /** Filtro por nombre del cliente. */
  filter?: string;
  status?: number;
}

export interface FlowSubscriptionPage {
  total: number;
  hasMore: boolean;
  data: Record<string, unknown>[];
}

/**
 * `GET subscription/list` — suscripciones de UN plan.
 *
 * ⚠️ `planId` es obligatorio: no hay forma de listar todas las suscripciones del
 * comercio de una vez. Para ir por cliente existe `customer/getSubscriptions`.
 * Devuelve el `List` genérico del spec (`{total, hasMore, data}`), sin tipar el
 * item — el spec no declara su forma.
 */
export async function listFlowSubscriptions(
  input: ListSubscriptionsInput,
  config: FlowConfig,
): Promise<FlowSubscriptionPage> {
  const params: FlowParams = { apiKey: config.apiKey, planId: input.planId };
  if (input.start !== undefined) params.start = input.start;
  if (input.limit !== undefined) params.limit = input.limit;
  if (input.filter !== undefined) params.filter = input.filter;
  if (input.status !== undefined) params.status = input.status;

  const data = await flowGet<{
    total?: number;
    hasMore?: boolean | number;
    data?: Record<string, unknown>[];
  }>("subscription/list", params, config, { retry: true });

  return {
    total: Number(data.total ?? 0),
    hasMore: Boolean(data.hasMore),
    data: Array.isArray(data.data) ? data.data : [],
  };
}

/**
 * `GET customer/getSubscriptions` — suscripciones de UN cliente (paginado).
 * `filter` filtra por el identificador de la suscripción.
 *
 * Es la vía de RESCATE si se perdiera el vínculo local: a diferencia de los
 * clientes (que no se pueden buscar por `externalId`), las suscripciones sí se
 * pueden reencontrar a partir del `customerId`.
 */
export async function getFlowCustomerSubscriptions(
  input: { customerId: string; start?: number; limit?: number; filter?: string },
  config: FlowConfig,
): Promise<FlowSubscriptionPage> {
  const params: FlowParams = { apiKey: config.apiKey, customerId: input.customerId };
  if (input.start !== undefined) params.start = input.start;
  if (input.limit !== undefined) params.limit = input.limit;
  if (input.filter !== undefined) params.filter = input.filter;

  const data = await flowGet<{
    total?: number;
    hasMore?: boolean | number;
    data?: Record<string, unknown>[];
  }>("customer/getSubscriptions", params, config, { retry: true });

  return {
    total: Number(data.total ?? 0),
    hasMore: Boolean(data.hasMore),
    data: Array.isArray(data.data) ? data.data : [],
  };
}

/**
 * `POST subscription/cancel` — cancela una suscripción.
 *
 * `at_period_end`: **0** cancela de inmediato · **1** al terminar el período vigente
 * (textual del spec). Se expone como booleano `atPeriodEnd` y se serializa a 0/1.
 */
export async function cancelFlowSubscription(
  input: { subscriptionId: string; atPeriodEnd: boolean },
  config: FlowConfig,
): Promise<FlowSubscription> {
  const data = await flowPost<RawSubscription>(
    "subscription/cancel",
    {
      apiKey: config.apiKey,
      subscriptionId: input.subscriptionId,
      at_period_end: input.atPeriodEnd ? 1 : 0,
    },
    config,
  );
  return toFlowSubscription(data, "subscription/cancel");
}

/**
 * `POST subscription/changeTrial` — cambia los días de trial.
 *
 * Restricción del spec: "Sólo se puede modificar los días de Trial a una suscripción
 * que aún no se ha iniciado o que todavía está vigente el Trial".
 */
export async function changeFlowSubscriptionTrial(
  input: { subscriptionId: string; trialPeriodDays: number },
  config: FlowConfig,
): Promise<FlowSubscription> {
  const data = await flowPost<RawSubscription>(
    "subscription/changeTrial",
    {
      apiKey: config.apiKey,
      subscriptionId: input.subscriptionId,
      trial_period_days: input.trialPeriodDays,
    },
    config,
  );
  return toFlowSubscription(data, "subscription/changeTrial");
}

// ─────────────────────────────────────────────────────────────────────────────
// Cambio de plan — la vía OFICIAL para cambiar precio o cadencia.
// ─────────────────────────────────────────────────────────────────────────────

export interface ChangePlanInput {
  subscriptionId: string;
  newPlanId: string;
  /**
   * `yyyy-mm-dd` opcional. Según el spec debe caer DENTRO del ciclo de facturación
   * actual de la suscripción, y puede ser a futuro (cambio programado).
   */
  startDateOfNewPlan?: string;
}

export interface FlowChangePlanResult {
  startDateOfNewPlan?: string;
  newAmount?: number;
  newCurrency?: string;
  newPlanId?: string;
  /** Prorrateo: negativo = descuento a favor · positivo = cargo al cambiar. */
  balance?: number;
  oldAmount?: number;
  oldCurrency?: string;
  oldPlanId?: string;
  raw: Record<string, unknown>;
}

/**
 * `POST subscription/changePlan` — mueve la suscripción a otro plan.
 *
 * Es la ÚNICA forma de cambiar precio o cadencia de una suscripción viva, porque un
 * plan con suscriptores es inmutable (`plans/edit`). Flow calcula el prorrateo y lo
 * devuelve en `balance`.
 */
export async function changeFlowSubscriptionPlan(
  input: ChangePlanInput,
  config: FlowConfig,
): Promise<FlowChangePlanResult> {
  const params: FlowParams = {
    apiKey: config.apiKey,
    subscriptionId: input.subscriptionId,
    newPlanId: input.newPlanId,
  };
  if (input.startDateOfNewPlan !== undefined) params.startDateOfNewPlan = input.startDateOfNewPlan;

  const data = await flowPost<Record<string, unknown>>("subscription/changePlan", params, config);
  return {
    startDateOfNewPlan: str(data.start_date_of_new_plan),
    newAmount: num(data.new_amount),
    newCurrency: str(data.new_currency),
    newPlanId: str(data.new_plan_id),
    balance: num(data.balance),
    oldAmount: num(data.old_amount),
    oldCurrency: str(data.old_currency),
    oldPlanId: str(data.old_plan_id),
    raw: data,
  };
}

/**
 * `POST subscription/changePlanPreview` — previsualiza el cambio SIN aplicarlo.
 * Devuelve el prorrateo y la próxima fecha de facturación, para poder mostrarle al
 * cliente qué le van a cobrar antes de confirmar.
 */
export async function previewFlowSubscriptionPlanChange(
  input: ChangePlanInput,
  config: FlowConfig,
): Promise<Record<string, unknown>> {
  const params: FlowParams = {
    apiKey: config.apiKey,
    subscriptionId: input.subscriptionId,
    newPlanId: input.newPlanId,
  };
  if (input.startDateOfNewPlan !== undefined) params.startDateOfNewPlan = input.startDateOfNewPlan;

  // Lectura sin efectos → se puede reintentar.
  return flowPost<Record<string, unknown>>("subscription/changePlanPreview", params, config, {
    retry: true,
  });
}

/** `POST subscription/changePlanCancel` — anula un cambio de plan PROGRAMADO. */
export async function cancelFlowSubscriptionPlanChange(
  subscriptionId: string,
  config: FlowConfig,
): Promise<Record<string, unknown>> {
  return flowPost<Record<string, unknown>>(
    "subscription/changePlanCancel",
    { apiKey: config.apiKey, subscriptionId },
    config,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Items adicionales y cupones.
// ─────────────────────────────────────────────────────────────────────────────

export interface FlowItemChangeResult {
  subId?: string;
  itemId?: number;
  success: boolean;
  raw: Record<string, unknown>;
}

function toItemChange(data: Record<string, unknown>): FlowItemChangeResult {
  return {
    subId: str(data.sub_id),
    itemId: num(data.item_id),
    success: data.success === true,
    raw: data,
  };
}

/**
 * `POST subscription/addItem` — agrega un item adicional (recargo o descuento fijo)
 * a la suscripción. `itemId` es el id de un `subscription_item` ya creado.
 */
export async function addFlowSubscriptionItem(
  input: { subscriptionId: string; itemId: number },
  config: FlowConfig,
): Promise<FlowItemChangeResult> {
  const data = await flowPost<Record<string, unknown>>(
    "subscription/addItem",
    { apiKey: config.apiKey, subscriptionId: input.subscriptionId, itemId: input.itemId },
    config,
  );
  return toItemChange(data);
}

/** `POST subscription/deleteItem` — quita un item adicional de la suscripción. */
export async function deleteFlowSubscriptionItem(
  input: { subscriptionId: string; itemId: number },
  config: FlowConfig,
): Promise<FlowItemChangeResult> {
  const data = await flowPost<Record<string, unknown>>(
    "subscription/deleteItem",
    { apiKey: config.apiKey, subscriptionId: input.subscriptionId, itemId: input.itemId },
    config,
  );
  return toItemChange(data);
}

/** `POST subscription/addCoupon` — aplica un cupón de descuento a la suscripción. */
export async function addFlowSubscriptionCoupon(
  input: { subscriptionId: string; couponId: number },
  config: FlowConfig,
): Promise<FlowSubscription> {
  const data = await flowPost<RawSubscription>(
    "subscription/addCoupon",
    { apiKey: config.apiKey, subscriptionId: input.subscriptionId, couponId: input.couponId },
    config,
  );
  return toFlowSubscription(data, "subscription/addCoupon");
}

/** `POST subscription/deleteCoupon` — quita el descuento de la suscripción. */
export async function deleteFlowSubscriptionCoupon(
  subscriptionId: string,
  config: FlowConfig,
): Promise<FlowSubscription> {
  const data = await flowPost<RawSubscription>(
    "subscription/deleteCoupon",
    { apiKey: config.apiKey, subscriptionId },
    config,
  );
  return toFlowSubscription(data, "subscription/deleteCoupon");
}

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de items adicionales (`subscription_item`).
// ─────────────────────────────────────────────────────────────────────────────

export interface FlowItemAdditional {
  id: number;
  name?: string;
  amount?: number;
  currency?: string;
  associatedSubscriptionsCount?: number;
  /** 1 activo · 0 inactivo. */
  status?: number;
  created?: string;
  raw: Record<string, unknown>;
}

function toItemAdditional(data: Record<string, unknown>, endpoint: string): FlowItemAdditional {
  const id = num(data.id);
  if (id === undefined) {
    throw new FlowApiError({ endpoint, httpStatus: 200, message: "Respuesta sin `id`." });
  }
  return {
    id,
    name: str(data.name),
    amount: num(data.amount),
    currency: str(data.currency),
    associatedSubscriptionsCount: num(data.associatedSubscriptionsCount),
    status: num(data.status),
    created: str(data.created),
    raw: data,
  };
}

/**
 * `POST subscription_item/create` — crea un item adicional reutilizable.
 * `amount` positivo = recargo · negativo = descuento (textual del spec).
 */
export async function createFlowItemAdditional(
  input: { name: string; amount: number; currency?: string },
  config: FlowConfig,
): Promise<FlowItemAdditional> {
  const data = await flowPost<Record<string, unknown>>(
    "subscription_item/create",
    {
      apiKey: config.apiKey,
      name: input.name,
      amount: input.amount,
      currency: input.currency ?? "CLP",
    },
    config,
  );
  return toItemAdditional(data, "subscription_item/create");
}

/** `GET subscription_item/get` — lee un item adicional (parámetro `itemId`). */
export async function getFlowItemAdditional(
  itemId: number,
  config: FlowConfig,
): Promise<FlowItemAdditional> {
  const data = await flowGet<Record<string, unknown>>(
    "subscription_item/get",
    { apiKey: config.apiKey, itemId },
    config,
    { retry: true },
  );
  return toItemAdditional(data, "subscription_item/get");
}

/**
 * Alcance de un cambio sobre un item adicional (`changeType` del spec).
 * Requerido si se envía `name` o `amount`.
 */
export const FLOW_ITEM_CHANGE_TYPE = {
  /** Solo para suscripciones futuras. */
  TO_FUTURE: "to_future",
  /** Actualiza para las suscripciones actuales y futuras. */
  ALL: "all",
} as const;

export type FlowItemChangeType =
  (typeof FLOW_ITEM_CHANGE_TYPE)[keyof typeof FLOW_ITEM_CHANGE_TYPE];

/**
 * `POST subscription_item/edit` — edita un item adicional. `changeType` es
 * REQUERIDO si se envía `name` o `amount` (textual del spec).
 */
export async function editFlowItemAdditional(
  input: { itemId: number; name?: string; amount?: number; changeType?: FlowItemChangeType },
  config: FlowConfig,
): Promise<FlowItemAdditional> {
  const params: FlowParams = { apiKey: config.apiKey, itemId: input.itemId };
  if (input.name !== undefined) params.name = input.name;
  if (input.amount !== undefined) params.amount = input.amount;
  if (input.changeType !== undefined) params.changeType = input.changeType;

  if ((input.name !== undefined || input.amount !== undefined) && input.changeType === undefined) {
    throw new Error(
      "[flow] subscription_item/edit: `changeType` es requerido si se envía `name` o `amount`.",
    );
  }

  const data = await flowPost<Record<string, unknown>>(
    "subscription_item/edit",
    params,
    config,
    { retry: true },
  );
  return toItemAdditional(data, "subscription_item/edit");
}

/** `POST subscription_item/delete` — elimina un item adicional. `changeType` requerido. */
export async function deleteFlowItemAdditional(
  input: { itemId: number; changeType: FlowItemChangeType },
  config: FlowConfig,
): Promise<FlowItemAdditional> {
  const data = await flowPost<Record<string, unknown>>(
    "subscription_item/delete",
    { apiKey: config.apiKey, itemId: input.itemId, changeType: input.changeType },
    config,
  );
  return toItemAdditional(data, "subscription_item/delete");
}

/** `GET subscription_item/list` — lista paginada de items adicionales. */
export async function listFlowItemAdditionals(
  input: { start?: number; limit?: number; filter?: string; status?: number },
  config: FlowConfig,
): Promise<{ total: number; hasMore: boolean; data: Record<string, unknown>[] }> {
  const params: FlowParams = { apiKey: config.apiKey };
  if (input.start !== undefined) params.start = input.start;
  if (input.limit !== undefined) params.limit = input.limit;
  if (input.filter !== undefined) params.filter = input.filter;
  if (input.status !== undefined) params.status = input.status;

  const data = await flowGet<{
    total?: number;
    hasMore?: boolean | number;
    data?: Record<string, unknown>[];
  }>("subscription_item/list", params, config, { retry: true });

  return {
    total: Number(data.total ?? 0),
    hasMore: Boolean(data.hasMore),
    data: Array.isArray(data.data) ? data.data : [],
  };
}
