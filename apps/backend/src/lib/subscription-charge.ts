import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createOrderWorkflow,
  createOrderPaymentCollectionWorkflow,
  markPaymentCollectionAsPaid,
} from "@medusajs/core-flows";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";
import { SUBSCRIPTION_CHARGE_MODULE } from "../modules/subscription-charge";
import type SubscriptionChargeModuleService from "../modules/subscription-charge/service";
import { PAYMENT_METHOD_MODULE } from "../modules/payment-method";
import type PaymentMethodModuleService from "../modules/payment-method/service";
import {
  getFlowConfig,
  chargeFlowCustomer,
  lookupFlowStatusByCommerceId,
  FLOW_STATUS,
} from "./flow";

/**
 * Motor de COBRO RECURRENTE de suscripciones (D59 · Modelo A de Flow) — cobra una
 * renovación y crea su orden en Medusa, de forma IDEMPOTENTE. Lo invoca el scheduler
 * (`src/jobs/charge-due-subscriptions.ts`), una vez por suscripción vencida, DENTRO
 * de un lock por suscripción (Locking Module).
 *
 * La renovación = cobrar `agreed_unit_price × quantity` con `customer/charge` → si
 * paga, crear una orden real desde el SNAPSHOT y emitir `order.placed` para reusar
 * TODO el pipeline existente (correo y reanclado del reloj de comida). El pago se
 * registra y el stock se reserva explícitamente: `createOrderWorkflow` NO hace ninguna
 * de las dos cosas. Las líneas van SIN `is_subscription` (líneas
 * "planas") para que `subscription-created.ts` haga no-op y NO duplique la suscripción.
 *
 * Idempotencia en capas (nunca doble cobro ni doble orden):
 *  1) LEDGER por período (`subscription_charge`, una fila por `subscription_id`+`period_key`):
 *     si el período ya está `paid`, no se vuelve a cobrar. `paid` sin `order_id` =
 *     cobrado pero la orden falló → el siguiente barrido crea SOLO la orden (auto-sanación).
 *  2) Referencia `commerceOrder` ESTABLE por período + verificación con
 *     `lookupFlowStatusByCommerceId` ANTES de crear la orden (nunca se confía en la
 *     respuesta síncrona de `customer/charge`). Estable y no por intento porque Flow
 *     NO deduplica cargos repetidos (medido): la referencia estable es lo que permite
 *     preguntar "¿este período ya se cobró?" y que la respuesta cubra todos los intentos.
 *  3) Recuperación ante crash: si el ledger quedó `pending` con un `commerce_order`,
 *     se consulta a Flow por si el cobro sí ocurrió antes de caerse (evita recobrar).
 *  4) `createOrderWorkflow` compensa (rollback) si falla → nunca deja una orden a medias.
 */

/** Reintentos de dunning antes de dar de baja (unpaid). */
export const MAX_CHARGE_ATTEMPTS = 3;
/** Días de espera entre reintentos de un cobro fallido. */
export const RETRY_DELAY_DAYS = 3;

export type ChargeOutcome =
  | "renewed" // cobrado + orden creada
  | "recovered" // cobro previo (crash) confirmado → orden creada sin recobrar
  | "order_resumed" // ya estaba pagado; se creó la orden pendiente
  | "already_done" // período ya cerrado (cobrado + orden) → no-op
  | "failed" // cobro rechazado/fallido → dunning
  | "paid_order_pending" // cobrado, pero la orden falló → se reintenta la orden luego
  | "deferred" // no se pudo cobrar NI saber si se cobró → se reintenta sin dunning
  | "skipped"; // estado cambió / sin datos → no-op

export interface ChargeResult {
  outcome: ChargeOutcome;
  orderId?: string;
  message?: string;
}

/** Los links `isList` devuelven el lado "uno" como objeto o arreglo; normaliza. */
function one<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}

/** Clave de período estable: la fecha de entrega pactada (YYYY-MM-DD, UTC). */
function periodKeyOf(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 10);
}

function addWeeks(date: Date | string, weeks: number): Date {
  return new Date(new Date(date).getTime() + weeks * 7 * 24 * 3600 * 1000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 3600 * 1000);
}

type ShippingSnapshot = {
  first_name?: string | null;
  last_name?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  country_code?: string | null;
} | null;

type SubscriptionShape = {
  id: string;
  variant_id: string;
  product_id: string;
  quantity: number;
  frequency_weeks: number;
  next_delivery_date: string | Date;
  status: string;
  agreed_unit_price: number;
  currency_code: string;
  shipping_address: ShippingSnapshot;
  payment_method_id: string | null;
  failed_charge_count: number;
};

/** Una suscripción seleccionada por el barrido, con el motivo por el que entró. */
export interface DueSubscription {
  id: string;
  /** `renewal` = `active` con la entrega vencida · `retry` = reintento de dunning. */
  reason: "renewal" | "retry";
}

export interface SweepResult {
  /** Renovaciones normales seleccionadas (`active` vencidas). */
  due: number;
  /** Reintentos de dunning seleccionados (`past_due`). */
  retries: number;
  tally: Partial<Record<ChargeOutcome | "error", number>>;
  results: { id: string; outcome: ChargeOutcome | "error"; orderId?: string; message?: string }[];
}

/**
 * Suscripciones cuyo momento de cobro YA llegó. Fuente única del criterio "vencida",
 * compartida por el barrido automático (scheduler) y el disparo manual del Admin —
 * así el botón de "Cobrar ahora" no puede seleccionar con otra regla que el cron.
 *
 *  - `active` con `next_delivery_date <= ahora` → renovación normal.
 *  - `past_due` con `next_charge_attempt_at <= ahora` → reintento de dunning.
 */
export async function listDueSubscriptions(
  container: MedusaContainer,
  now: Date = new Date(),
): Promise<DueSubscription[]> {
  const subs = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);

  const due = await subs.listSubscriptions(
    { status: "active", next_delivery_date: { $lte: now } },
    { take: 500, order: { next_delivery_date: "ASC" } },
  );
  const retries = await subs.listSubscriptions(
    { status: "past_due", next_charge_attempt_at: { $lte: now } },
    { take: 500, order: { next_charge_attempt_at: "ASC" } },
  );

  return [
    ...due.map((s) => ({ id: s.id, reason: "renewal" as const })),
    ...retries.map((s) => ({ id: s.id, reason: "retry" as const })),
  ];
}

/**
 * Cobra UNA suscripción bajo su lock. Único punto de entrada al motor: tanto el
 * barrido como el botón del Admin pasan por aquí, de modo que dos disparos
 * solapados (cron + operador, o dos clics) nunca cobran dos veces la misma.
 * La idempotencia del ledger es la segunda red; el lock es la primera.
 */
export async function chargeSubscriptionLocked(
  container: MedusaContainer,
  subscriptionId: string,
): Promise<ChargeResult> {
  const locking = container.resolve(Modules.LOCKING);
  return locking.execute(
    `subscription-charge:${subscriptionId}`,
    () => chargeDueSubscription(container, subscriptionId),
    { timeout: 30 },
  );
}

/**
 * Barrido de todas las suscripciones vencidas. Lo usa el scheduler (cuando el cobro
 * automático está encendido) y el botón "Cobrar todas las vencidas" del Admin.
 * Un fallo en una suscripción se registra y NO detiene al resto.
 */
export async function sweepDueSubscriptions(
  container: MedusaContainer,
  now: Date = new Date(),
): Promise<SweepResult> {
  const targets = await listDueSubscriptions(container, now);
  const result: SweepResult = {
    due: targets.filter((t) => t.reason === "renewal").length,
    retries: targets.filter((t) => t.reason === "retry").length,
    tally: {},
    results: [],
  };

  for (const target of targets) {
    try {
      const charged = await chargeSubscriptionLocked(container, target.id);
      result.tally[charged.outcome] = (result.tally[charged.outcome] ?? 0) + 1;
      result.results.push({ id: target.id, ...charged });
    } catch (e) {
      // Un cobro que lanza (p. ej. no se pudo tomar el lock) no frena al resto.
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[cobro] Error procesando la suscripción ${target.id}:`, e);
      result.tally.error = (result.tally.error ?? 0) + 1;
      result.results.push({ id: target.id, outcome: "error", message });
    }
  }

  return result;
}

/**
 * Cobra la renovación de UNA suscripción vencida y crea su orden. Debe ejecutarse
 * bajo un lock por `subscriptionId` (usa `chargeSubscriptionLocked`, que lo aplica).
 * Recarga el estado fresco dentro del lock para no operar sobre datos rancios.
 */
export async function chargeDueSubscription(
  container: MedusaContainer,
  subscriptionId: string,
): Promise<ChargeResult> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const subs = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const charges = container.resolve<SubscriptionChargeModuleService>(SUBSCRIPTION_CHARGE_MODULE);
  const cards = container.resolve<PaymentMethodModuleService>(PAYMENT_METHOD_MODULE);
  const eventBus = container.resolve(Modules.EVENT_BUS);
  const config = getFlowConfig(); // lanza claro si faltan las llaves de Flow

  const sub = (await subs.retrieveSubscription(subscriptionId)) as unknown as SubscriptionShape | null;
  if (!sub) return { outcome: "skipped", message: "no existe" };
  // El estado pudo cambiar entre la selección del job y el lock (p. ej. el usuario
  // pausó/canceló). Solo cobramos activas (renovación) o past_due (reintento).
  if (sub.status !== "active" && sub.status !== "past_due") {
    return { outcome: "skipped", message: `estado ${sub.status}` };
  }

  const periodKey = periodKeyOf(sub.next_delivery_date);
  const amount = Math.round((sub.agreed_unit_price ?? 0) * (sub.quantity ?? 1));

  // Dueño (email/nombre) vía el Module Link Customer↔Subscription.
  const {
    data: [subGraph],
  } = await query.graph({
    entity: "subscription",
    fields: ["id", "customer.id", "customer.email", "customer.first_name", "customer.last_name"],
    filters: { id: subscriptionId },
  });
  const customer = one(
    subGraph?.customer as
      | { id?: string; email?: string; first_name?: string | null; last_name?: string | null }
      | undefined,
  );
  if (!customer?.id || !customer.email) {
    return { outcome: "skipped", message: "suscripción sin dueño con email" };
  }

  // Ledger del período (idempotencia fuerte).
  const existing = await charges.listSubscriptionCharges({
    subscription_id: subscriptionId,
    period_key: periodKey,
  });
  const ledger = existing[0];

  // (1) Período ya cobrado.
  if (ledger?.status === "paid") {
    if (ledger.order_id) {
      await advanceOnSuccess(subs, sub, periodKey);
      return { outcome: "already_done", orderId: ledger.order_id };
    }
    // Cobrado pero sin orden → crear SOLO la orden (auto-sanación), sin recobrar.
    try {
      const orderId = await createRenewalOrder(container, sub, customer);
      await charges.updateSubscriptionCharges({ id: ledger.id, order_id: orderId, error: null });
      await advanceOnSuccess(subs, sub, periodKey);
      await eventBus.emit({ name: "subscription.renewed", data: { id: subscriptionId } });
      return { outcome: "order_resumed", orderId };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await charges.updateSubscriptionCharges({ id: ledger.id, error: `orden: ${msg}` });
      return { outcome: "paid_order_pending", message: msg };
    }
  }

  // Tarjeta tokenizada contra la que cobrar (referencia a saved_card).
  const card = sub.payment_method_id
    ? (await cards.listSavedCards({ id: sub.payment_method_id }))[0]
    : undefined;
  if (!card?.gateway_customer_id) {
    return finalizeFailure(
      subs,
      charges,
      eventBus,
      sub,
      ledger?.id,
      periodKey,
      amount,
      null,
      "La suscripción no tiene una tarjeta registrada para cobrar.",
      "failed",
    );
  }

  // (3) Recuperación ante crash: un ledger `pending` con referencia previa podría
  // haberse cobrado antes de caerse. Confirmamos con Flow para NO recobrar.
  //
  // Solo se pregunta cuando CONSTA un intento previo. Es lo que permite no tener que
  // distinguir "Flow no conoce este pago" de "Flow no me respondió" —distinción que el
  // spec no documenta y que adivinar costaría dinero—: si nunca enviamos este
  // `commerceOrder`, no hay nada que preguntar; si lo enviamos y Flow no responde, no
  // se cobra.
  if (ledger?.status === "pending" && ledger.commerce_order) {
    const lookup = await lookupFlowStatusByCommerceId(ledger.commerce_order, config);

    if (lookup.outcome === "unavailable") {
      // Hubo un intento previo y Flow no nos dice cómo terminó. Cobrar aquí es
      // exactamente el camino de doble cobro de D72, agravado porque Flow acepta
      // cargos repetidos bajo el mismo `commerceOrder` (medido en la Etapa 3).
      return deferCharge(
        subs,
        charges,
        sub,
        ledger.id,
        `No se pudo verificar el intento previo (${ledger.commerce_order}): ${lookup.message}`,
      );
    }

    const prior = lookup.status;
    if (prior.status === FLOW_STATUS.PAID) {
      await charges.updateSubscriptionCharges({
        id: ledger.id,
        status: "paid",
        raw_status: prior.status,
        flow_order: prior.flowOrder ? String(prior.flowOrder) : ledger.flow_order,
      });
      try {
        const orderId = await createRenewalOrder(container, sub, customer);
        await charges.updateSubscriptionCharges({ id: ledger.id, order_id: orderId, error: null });
        await advanceOnSuccess(subs, sub, periodKey);
        await eventBus.emit({ name: "subscription.renewed", data: { id: subscriptionId } });
        return { outcome: "recovered", orderId };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await charges.updateSubscriptionCharges({ id: ledger.id, error: `orden: ${msg}` });
        return { outcome: "paid_order_pending", message: msg };
      }
    }
  }

  // Referencia ESTABLE por período — sin sufijo por intento.
  //
  // Antes llevaba `-a${attempt}`, con el argumento de que "Flow rechaza commerceOrder
  // repetidos". Medido en la Etapa 3: **es falso para `customer/charge`** (dos cargos
  // aceptados con el mismo id y dos `flowOrder` distintos). El sufijo por tanto no
  // evitaba nada y sí rompía lo único que nos protege: poder preguntarle a Flow "¿este
  // período ya se cobró?" y obtener una respuesta que cubra TODOS los intentos. Con la
  // referencia estable, si cualquier intento del período resultó pagado, la consulta lo
  // encuentra y no se recobra. D72 razonaba sobre la premisa contraria.
  const attempt = ledger ? (ledger.attempt ?? 1) + 1 : 1;
  const commerceOrder = `MANADA-SUB-${subscriptionId.replace(/^sub_/, "")}-${periodKey.replace(/-/g, "")}`;

  let ledgerId: string;
  if (ledger) {
    await charges.updateSubscriptionCharges({
      id: ledger.id,
      status: "pending",
      commerce_order: commerceOrder,
      attempt,
      amount,
      error: null,
    });
    ledgerId = ledger.id;
  } else {
    const created = await charges.createSubscriptionCharges({
      subscription_id: subscriptionId,
      period_key: periodKey,
      commerce_order: commerceOrder,
      amount,
      currency_code: (sub.currency_code ?? "clp").toLowerCase(),
      status: "pending",
      attempt: 1,
    });
    ledgerId = created.id;
  }

  // Cobro server-to-server + VERIFICACIÓN autoritativa (nunca se asume por la
  // respuesta síncrona del charge).
  const subject = "Renovación Plan Manada";
  const charge = await chargeFlowCustomer(
    { customerId: card.gateway_customer_id, amount, subject, commerceOrder },
    config,
  );
  const lookup = await lookupFlowStatusByCommerceId(commerceOrder, config);
  const verify = lookup.outcome === "found" ? lookup.status : undefined;
  const paid =
    verify?.status === FLOW_STATUS.PAID || (charge.ok && charge.status === FLOW_STATUS.PAID);
  const rawStatus = verify?.status ?? charge.status ?? null;
  const flowOrder = verify?.flowOrder ?? charge.flowOrder;

  if (!paid) {
    // ¿Rechazo de tarjeta o imposibilidad de cobrar? Es la pregunta que decide si el
    // cliente recibe un correo de "no pudimos cobrarte" o si el problema es nuestro.
    //
    // Solo hay veredicto negativo cuando Flow lo dio: un estado 3/4 verificado, o un
    // `failureKind: "rejected"` de la respuesta síncrona. Todo lo demás —cuota agotada,
    // 401 por llaves, 5xx, timeout, o una verificación que no respondió— significa que
    // NO SABEMOS, y sobre "no sabemos" no se castiga a nadie.
    const flowSaidRejected =
      rawStatus === FLOW_STATUS.REJECTED ||
      rawStatus === FLOW_STATUS.CANCELED ||
      charge.failureKind === "rejected";

    if (!flowSaidRejected) {
      return deferCharge(
        subs,
        charges,
        sub,
        ledgerId,
        charge.message ??
          (lookup.outcome === "unavailable"
            ? `No se pudo verificar el cobro: ${lookup.message}`
            : "Flow no entregó un veredicto del cobro."),
      );
    }

    const msg = charge.message || (verify ? `Flow devolvió estado ${verify.status}` : "Cobro rechazado por Flow.");
    return finalizeFailure(
      subs,
      charges,
      eventBus,
      sub,
      ledgerId,
      periodKey,
      amount,
      rawStatus,
      msg,
      "rejected",
      flowOrder,
    );
  }

  // Pagado → marca el ledger y crea la orden. Si la orden falla, el ledger queda
  // `paid` sin `order_id` → el próximo barrido la reintenta SIN recobrar.
  await charges.updateSubscriptionCharges({
    id: ledgerId,
    status: "paid",
    raw_status: FLOW_STATUS.PAID,
    flow_order: flowOrder ? String(flowOrder) : undefined,
    error: null,
  });
  try {
    const orderId = await createRenewalOrder(container, sub, customer);
    await charges.updateSubscriptionCharges({ id: ledgerId, order_id: orderId });
    await advanceOnSuccess(subs, sub, periodKey);
    await eventBus.emit({ name: "subscription.renewed", data: { id: subscriptionId } });
    return { outcome: "renewed", orderId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await charges.updateSubscriptionCharges({ id: ledgerId, error: `orden: ${msg}` });
    console.error(
      `[cobro] ${subscriptionId}: cobrado pero la orden falló (${msg}). Se reintentará sin recobrar.`,
    );
    return { outcome: "paid_order_pending", message: msg };
  }
}

/** Avanza la suscripción tras un cobro exitoso (cadencia estable desde la fecha pactada). */
async function advanceOnSuccess(
  subs: SubscriptionModuleService,
  sub: SubscriptionShape,
  periodKey: string,
): Promise<void> {
  // Defensa contra doble avance: solo avanza si aún estamos en este período.
  if (periodKeyOf(sub.next_delivery_date) !== periodKey) return;
  await subs.updateSubscriptions({
    id: sub.id,
    status: "active",
    next_delivery_date: addWeeks(sub.next_delivery_date, sub.frequency_weeks || 4),
    last_charged_at: new Date(),
    failed_charge_count: 0,
    last_charge_error: null,
    next_charge_attempt_at: null,
  });
}

/**
 * Aplaza el cobro SIN castigar al cliente: no toca `failed_charge_count`, no pasa a
 * `past_due` y no emite `subscription.payment_failed` (o sea, no manda el correo de
 * cobro fallido). La suscripción sigue `active` y vencida, así que el próximo barrido
 * la vuelve a tomar por sí solo.
 *
 * Es la respuesta a "no sabemos si se cobró o no pudimos cobrar". El ledger se queda
 * `pending` con su `commerce_order` intacto, que es justo lo que la recuperación ante
 * crash necesita para preguntarle a Flow por ese período antes de reintentar.
 *
 * ⚠️ Un aplazamiento repetido es invisible en el listado del Admin (la suscripción se
 * ve normal). Por eso se escribe el motivo en `last_charge_error` y se loguea como
 * error: es la única señal de que algo lleva días sin poder cobrarse.
 */
async function deferCharge(
  subs: SubscriptionModuleService,
  charges: SubscriptionChargeModuleService,
  sub: SubscriptionShape,
  ledgerId: string | undefined,
  message: string,
): Promise<ChargeResult> {
  if (ledgerId) {
    await charges.updateSubscriptionCharges({ id: ledgerId, status: "pending", error: message });
  }
  await subs.updateSubscriptions({ id: sub.id, last_charge_error: message });
  console.error(
    `[cobro] ${sub.id}: cobro APLAZADO sin penalizar al cliente (no es un rechazo de ` +
      `tarjeta). Se reintentará en el próximo barrido. Motivo: ${message}`,
  );
  return { outcome: "deferred", message };
}

/** Registra un cobro fallido: ledger + dunning (past_due/unpaid) + evento de dominio. */
async function finalizeFailure(
  subs: SubscriptionModuleService,
  charges: SubscriptionChargeModuleService,
  eventBus: { emit: (e: { name: string; data: { id: string } }) => Promise<unknown> },
  sub: SubscriptionShape,
  ledgerId: string | undefined,
  periodKey: string,
  amount: number,
  rawStatus: number | null,
  message: string,
  ledgerStatus: "rejected" | "failed",
  flowOrder?: number,
): Promise<ChargeResult> {
  if (ledgerId) {
    await charges.updateSubscriptionCharges({
      id: ledgerId,
      status: ledgerStatus,
      raw_status: rawStatus,
      flow_order: flowOrder ? String(flowOrder) : undefined,
      error: message,
    });
  } else {
    // Fallo antes de crear el ledger (p. ej. sin tarjeta): dejamos rastro del período.
    await charges.createSubscriptionCharges({
      subscription_id: sub.id,
      period_key: periodKey,
      commerce_order: `MANADA-SUB-${sub.id.replace(/^sub_/, "")}-${periodKey.replace(/-/g, "")}-nocard`,
      amount,
      currency_code: (sub.currency_code ?? "clp").toLowerCase(),
      status: ledgerStatus,
      raw_status: rawStatus,
      attempt: (sub.failed_charge_count ?? 0) + 1,
      error: message,
    });
  }

  const failed = (sub.failed_charge_count ?? 0) + 1;
  if (failed >= MAX_CHARGE_ATTEMPTS) {
    await subs.updateSubscriptions({
      id: sub.id,
      status: "unpaid",
      failed_charge_count: failed,
      last_charge_error: message,
      next_charge_attempt_at: null,
    });
    await eventBus.emit({ name: "subscription.ended_unpaid", data: { id: sub.id } });
    console.warn(`[cobro] ${sub.id}: dado de baja (unpaid) tras ${failed} intentos. Último error: ${message}`);
    return { outcome: "failed", message };
  }

  await subs.updateSubscriptions({
    id: sub.id,
    status: "past_due",
    failed_charge_count: failed,
    last_charge_error: message,
    next_charge_attempt_at: addDays(new Date(), RETRY_DELAY_DAYS),
  });
  await eventBus.emit({ name: "subscription.payment_failed", data: { id: sub.id } });
  console.warn(`[cobro] ${sub.id}: cobro fallido (intento ${failed}/${MAX_CHARGE_ATTEMPTS}). ${message}`);
  return { outcome: "failed", message };
}

/**
 * Crea la orden Medusa de la renovación desde el SNAPSHOT de la suscripción y emite
 * `order.placed` para reusar el pipeline existente. Líneas PLANAS (sin `is_subscription`)
 * + `metadata.is_renewal` para que los subscribers de `order.placed` reaccionen bien:
 * `subscription-created.ts` no-op, `order-placed-email.ts` se salta (manda el correo
 * de renovación), `food-purchased.ts` reancla el reloj de comida.
 */
async function createRenewalOrder(
  container: MedusaContainer,
  sub: SubscriptionShape,
  customer: { id?: string; email?: string; first_name?: string | null; last_name?: string | null },
): Promise<string> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const eventBus = container.resolve(Modules.EVENT_BUS);

  // Título de la línea (presentación) desde el producto/variante actual.
  let title = "Tu producto Manada";
  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: ["title", "variants.id", "variants.title"],
    filters: { id: sub.product_id },
  });
  if (product?.title) title = product.title;
  const variantTitle = ((product?.variants ?? []) as { id: string; title?: string }[]).find(
    (v) => v.id === sub.variant_id,
  )?.title;

  // Región (por moneda) y sales channel por defecto — deterministas para Chile/CLP.
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
    filters: { currency_code: (sub.currency_code ?? "clp").toLowerCase() },
  });
  const regionId = (regions?.[0]?.id as string | undefined) ?? undefined;
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
  });
  const salesChannelId = (channels?.[0]?.id as string | undefined) ?? undefined;

  const addr = sub.shipping_address;
  const shippingAddress = addr
    ? {
        first_name: addr.first_name ?? undefined,
        last_name: addr.last_name ?? undefined,
        address_1: addr.address_1 ?? undefined,
        address_2: addr.address_2 ?? undefined,
        city: addr.city ?? undefined,
        province: addr.province ?? undefined,
        postal_code: addr.postal_code ?? undefined,
        phone: addr.phone ?? undefined,
        country_code: (addr.country_code ?? "cl") || "cl",
      }
    : undefined;

  const { result: order } = await createOrderWorkflow(container).run({
    input: {
      region_id: regionId,
      sales_channel_id: salesChannelId,
      currency_code: (sub.currency_code ?? "clp").toLowerCase(),
      customer_id: customer.id,
      email: customer.email,
      shipping_address: shippingAddress,
      items: [
        {
          variant_id: sub.variant_id,
          product_id: sub.product_id,
          title: variantTitle ? `${title} · ${variantTitle}` : title,
          quantity: sub.quantity ?? 1,
          unit_price: sub.agreed_unit_price,
        },
      ],
      metadata: {
        is_renewal: true,
        subscription_id: sub.id,
        period_key: periodKeyOf(sub.next_delivery_date),
      },
    },
  });

  const total = Math.round((sub.agreed_unit_price ?? 0) * (sub.quantity ?? 1));

  // El dinero YA lo cobró Flow con `customer/charge` antes de llegar aquí, pero
  // `createOrderWorkflow` no crea ninguna colección de pago: la orden nacía
  // `not_paid` con el total entero como saldo pendiente. Las renovaciones se veían
  // impagas para siempre en el Admin —contabilidad equivocada y confusión para
  // quien despacha— mientras Flow tenía el dinero. Se registra el pago aquí para
  // que la orden refleje la realidad, igual que la primera compra (que sí queda
  // capturada al pasar por `completeCartWorkflow`). Detectado en la Etapa 3.
  try {
    const { result: collections } = await createOrderPaymentCollectionWorkflow(container).run({
      input: { order_id: order.id, amount: total },
    });
    const collectionId = collections?.[0]?.id;
    if (collectionId) {
      await markPaymentCollectionAsPaid(container).run({
        input: { payment_collection_id: collectionId, order_id: order.id },
      });
    }
  } catch (e) {
    // Best-effort: la orden y el cobro son válidos aunque el registro contable
    // falle. Se avisa fuerte porque deja la orden aparentando estar impaga.
    console.error(
      `[cobro] ${sub.id}: la orden ${order.id} se creó y Flow cobró, pero no se pudo ` +
        `registrar el pago en Medusa (quedará como "no pagada"):`,
      e,
    );
  }

  // Reserva de inventario. `createOrderWorkflow` NO la hace —a diferencia de
  // `completeCartWorkflow`, que reserva lo confirmado en el carrito—: la orden
  // quedaba "Not allocated" y el stock nunca se descontaba, así que cada renovación
  // despachaba producto sin bajar existencias. Verificado en el Admin (Etapa 3).
  await reserveRenewalInventory(container, order, sub, salesChannelId);

  // Reusa el pipeline: correo de renovación (guard en order-placed-email) y
  // reanclado del reloj de comida (food-purchased).
  await eventBus.emit({ name: "order.placed", data: { id: order.id } });
  return order.id;
}

/**
 * Reserva el stock de la línea de una renovación. Best-effort a propósito: si la
 * reserva falla (variante sin gestión de inventario, sin ubicación asociada al
 * sales channel, stock insuficiente), la orden y el cobro siguen siendo válidos —
 * el operador puede asignar a mano desde el Admin. Lo que no puede pasar es que
 * falle en silencio, así que todo desenlace no feliz queda logueado.
 */
async function reserveRenewalInventory(
  container: MedusaContainer,
  order: { id: string; items?: { id: string; variant_id?: string | null }[] },
  sub: SubscriptionShape,
  salesChannelId?: string,
): Promise<void> {
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const inventory = container.resolve(Modules.INVENTORY);

    // El resultado del workflow puede no traer las líneas hidratadas; si no vienen,
    // se releen. Sin línea no hay reserva posible, y un `return` mudo aquí dejaría
    // el bug de stock vivo sin dejar rastro.
    let items = order.items ?? [];
    if (items.length === 0) {
      const {
        data: [fresh],
      } = await query.graph({
        entity: "order",
        fields: ["id", "items.id", "items.variant_id"],
        filters: { id: order.id },
      });
      items = ((fresh?.items ?? []) as { id: string; variant_id?: string | null }[]) ?? [];
    }
    const lineItem = items.find((i) => i.variant_id === sub.variant_id) ?? items[0];
    if (!lineItem) {
      console.warn(`[cobro] ${sub.id}: la orden ${order.id} no tiene líneas; no se reserva stock.`);
      return;
    }

    // La variante puede no gestionar inventario (servicios, productos sin stock).
    const {
      data: [variant],
    } = await query.graph({
      entity: "product_variant",
      fields: [
        "id",
        "manage_inventory",
        "inventory_items.inventory_item_id",
        "inventory_items.required_quantity",
      ],
      filters: { id: sub.variant_id },
    });
    if (!variant?.manage_inventory) return;

    const inventoryItems = (variant.inventory_items ?? []) as {
      inventory_item_id: string;
      required_quantity?: number | null;
    }[];
    if (inventoryItems.length === 0) return;

    // Ubicación de stock: la que sirve al sales channel de la orden.
    const {
      data: [channel],
    } = await query.graph({
      entity: "sales_channel",
      fields: ["id", "stock_locations.id"],
      filters: salesChannelId ? { id: salesChannelId } : {},
    });
    const locationId = ((channel?.stock_locations ?? []) as { id: string }[])[0]?.id;
    if (!locationId) {
      console.warn(
        `[cobro] ${sub.id}: sin ubicación de stock para el sales channel; la orden ` +
          `${order.id} queda sin reservar (asignar a mano en el Admin).`,
      );
      return;
    }

    await inventory.createReservationItems(
      inventoryItems.map((item) => ({
        line_item_id: lineItem.id,
        inventory_item_id: item.inventory_item_id,
        location_id: locationId,
        quantity: (sub.quantity ?? 1) * (item.required_quantity ?? 1),
        description: `Renovación de la suscripción ${sub.id}`,
      })),
    );
  } catch (e) {
    console.error(
      `[cobro] ${sub.id}: no se pudo reservar el inventario de la orden ${order.id} ` +
        `(queda "no asignada"; asignar a mano en el Admin):`,
      e,
    );
  }
}
