import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  completeCartWorkflow,
  capturePaymentWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
  refreshPaymentCollectionForCartWorkflow,
} from "@medusajs/core-flows";
import { FLOW_PAYMENT_MODULE } from "../modules/flow-payment";
import type FlowPaymentModuleService from "../modules/flow-payment/service";
import { PAYMENT_METHOD_MODULE } from "../modules/payment-method";
import type PaymentMethodModuleService from "../modules/payment-method/service";
import {
  getFlowConfig,
  getFlowRegisterStatus,
  chargeFlowCustomer,
  getFlowStatusByCommerceId,
  FLOW_STATUS,
} from "./flow";
import { markFlowCardRegistered } from "./flow-customer";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";
import { chargeDueSubscription } from "./subscription-charge";

/**
 * Conciliación IDEMPOTENTE de la 1ª COMPRA SUSCRITA (D59 · Modelo A de Flow) —
 * disparada por `/flow/register-return` cuando el cliente termina de ingresar su
 * tarjeta en Flow. A diferencia del pago único (D58, redirección + `payment/getStatus`),
 * aquí se TOKENIZA la tarjeta y se cobra server-to-server con `customer/charge`.
 *
 * Pasos (todos idempotentes):
 *  1) `customer/getRegisterStatus`: confirma que la tarjeta quedó registrada (si no,
 *     no se cobra ni se crea orden; el usuario reintenta).
 *  2) Persiste `saved_card` (marca/últimos 4 + `gateway_customer_id`) — upsert por
 *     (customer, gateway_customer_id): nunca guarda PAN/CVV.
 *  3) Cobra el TOTAL del carrito con `customer/charge` (primer período [+ envío bajo
 *     el umbral]) y VERIFICA con `getStatusByCommerceId` (nunca asume por la respuesta
 *     síncrona). Idempotencia: registro `flow_payment` por carrito + `commerceOrder`
 *     determinista → un doble callback no recobra.
 *  4) Si pagó: completa el carrito (crea la orden → `order.placed` → `subscription-created`
 *     crea la suscripción y le enlaza la tarjeta recién guardada). Captura best-effort.
 *
 * Reusa el módulo `flow_payment` como ledger cart-based (mismo que el pago único) y
 * el pipeline `order.placed` completo (correo de compra + stock + reancla de comida).
 */

type QueryFn = {
  graph: (config: {
    entity: string;
    fields: string[];
    filters?: Record<string, unknown>;
  }) => Promise<{ data: Record<string, unknown>[] }>;
};

export type RegistrationOutcome =
  | "paid" // tarjeta registrada + cobro OK + orden creada
  | "register_failed" // el usuario no completó/registró la tarjeta
  | "charge_failed" // tarjeta OK pero el cobro fue rechazado
  | "not_found" // carrito desconocido
  | "invalid"; // carrito sin datos suficientes (sin cuenta/total)

export interface RegistrationResult {
  outcome: RegistrationOutcome;
  orderId?: string;
  displayId?: number;
}

const INTERNAL_PAYMENT_PROVIDER = "pp_system_default";

// `ensureFlowCustomer` se mudó a `./flow-customer` (D70): el vínculo cliente↔Flow
// dejó de deducirse de `saved_card` (que solo existía DESPUÉS de tokenizar, así que
// cada checkout abandonado creaba un cliente nuevo en Flow) y ahora vive en su
// propia tabla con UNIQUE por cliente. Importa desde `lib/flow-customer`.

type CartGraph = {
  id: string;
  email?: string | null;
  customer_id?: string | null;
  currency_code?: string | null;
  completed_at?: string | null;
  total?: number | null;
  items?: { id: string }[];
  payment_collection?: { id: string } | null;
};

export async function settleSubscriptionRegistration(
  container: MedusaContainer,
  cartId: string,
  token: string,
): Promise<RegistrationResult> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as QueryFn;
  const flowService = container.resolve<FlowPaymentModuleService>(FLOW_PAYMENT_MODULE);
  const cards = container.resolve<PaymentMethodModuleService>(PAYMENT_METHOD_MODULE);
  const config = getFlowConfig();

  // Carrito primero: si ya se completó, es un callback repetido → idempotente OK.
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "customer_id",
      "currency_code",
      "completed_at",
      "total",
      "items.id",
      "payment_collection.id",
    ],
    filters: { id: cartId },
  });
  const cart = carts?.[0] as CartGraph | undefined;
  if (!cart) return { outcome: "not_found" };

  // Idempotencia dura: si ya conciliamos este carrito como pagado, no repetir.
  const priorPaid = (await flowService.listFlowPayments({ cart_id: cartId, status: "paid" }))[0];
  if (cart.completed_at || priorPaid) {
    const orderId = priorPaid?.order_id ?? undefined;
    return { outcome: "paid", orderId, displayId: await displayIdOf(query, orderId) };
  }

  // (1) Confirmar el registro de la tarjeta.
  const reg = await getFlowRegisterStatus(token, config);
  if (!reg.registered || !reg.customerId) {
    return { outcome: "register_failed" };
  }

  // Resolver el cliente Medusa (dueño de la tarjeta y la futura suscripción).
  let customerId = cart.customer_id ?? undefined;
  if (!customerId && cart.email) {
    const { data: cs } = await query.graph({
      entity: "customer",
      fields: ["id"],
      filters: { email: cart.email },
    });
    customerId = (cs?.[0]?.id as string | undefined) ?? undefined;
  }
  if (!customerId) return { outcome: "invalid" }; // suscribir requiere cuenta

  const amount = Math.round(Number(cart.total ?? 0));
  if (!cart.items?.length || !cart.email || !Number.isFinite(amount) || amount <= 0) {
    return { outcome: "invalid" };
  }

  // (2) Upsert de la tarjeta guardada (referencia cobrable, nunca PAN/CVV).
  const existingCard = (
    await cards.listSavedCards({ customer_id: customerId, gateway_customer_id: reg.customerId })
  )[0];
  if (existingCard) {
    await cards.updateSavedCards({
      id: existingCard.id,
      brand: reg.creditCardType ?? existingCard.brand,
      last4: reg.last4CardDigits ?? existingCard.last4,
    });
  } else {
    await cards.createSavedCards({
      customer_id: customerId,
      gateway: "flow",
      gateway_customer_id: reg.customerId,
      brand: reg.creditCardType ?? "tarjeta",
      last4: reg.last4CardDigits ?? "····",
    });
  }

  // El cliente YA tiene tarjeta en Flow: refleja `pay_mode = auto` en el vínculo
  // sin gastar un `customer/get` extra.
  await markFlowCardRegistered(container, customerId);

  // (3) Cobro del total + verificación. `commerceOrder` determinista por carrito
  //     (un doble callback reusa el mismo id → Flow no recobra; además verificamos).
  const commerceOrder = `MANADA-SUBFIRST-${cartId.replace(/^cart_/, "")}`;
  const alreadyPaid = await getFlowStatusByCommerceId(commerceOrder, config);
  let paid = alreadyPaid?.status === FLOW_STATUS.PAID;
  let flowOrder = alreadyPaid?.flowOrder;
  let rawStatus = alreadyPaid?.status ?? null;

  if (!paid) {
    const charge = await chargeFlowCustomer(
      { customerId: reg.customerId, amount, subject: "Compra Plan Manada", commerceOrder },
      config,
    );
    const verify = await getFlowStatusByCommerceId(commerceOrder, config);
    paid = verify?.status === FLOW_STATUS.PAID || (charge.ok && charge.status === FLOW_STATUS.PAID);
    flowOrder = verify?.flowOrder ?? charge.flowOrder;
    rawStatus = verify?.status ?? charge.status ?? null;

    if (!paid) {
      await flowService.createFlowPayments({
        cart_id: cartId,
        commerce_order: commerceOrder,
        token,
        flow_order: flowOrder ? String(flowOrder) : null,
        amount,
        currency_code: (cart.currency_code ?? "clp").toLowerCase(),
        status: rawStatus === FLOW_STATUS.CANCELED ? "canceled" : "rejected",
        raw_status: rawStatus,
        error: charge.message ?? "Cobro rechazado por Flow.",
      });
      return { outcome: "charge_failed" };
    }
  }

  // (4) Pagado → asegurar sesión de pago interna + completar el carrito (crea la orden
  //     y dispara order.placed → suscripción + correo + stock). Idempotente y con lock.
  let paymentCollectionId = cart.payment_collection?.id;
  if (!paymentCollectionId) {
    const { result } = await createPaymentCollectionForCartWorkflow(container).run({
      input: { cart_id: cartId },
    });
    paymentCollectionId = result.id;
  } else {
    await refreshPaymentCollectionForCartWorkflow(container).run({ input: { cart_id: cartId } });
  }
  await createPaymentSessionsWorkflow(container).run({
    input: { payment_collection_id: paymentCollectionId, provider_id: INTERNAL_PAYMENT_PROVIDER },
  });

  let orderId: string;
  try {
    const { result } = await completeCartWorkflow(container).run({ input: { id: cartId } });
    orderId = result.id;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await flowService.createFlowPayments({
      cart_id: cartId,
      commerce_order: commerceOrder,
      token,
      flow_order: flowOrder ? String(flowOrder) : null,
      amount,
      currency_code: (cart.currency_code ?? "clp").toLowerCase(),
      status: "paid",
      raw_status: rawStatus,
      payment_collection_id: paymentCollectionId,
      error: `Cobrado pero la orden falló: ${message}`,
    });
    console.error(`[flow] 1ª compra suscrita: cobrada pero la orden falló (${commerceOrder}): ${message}`);
    throw e;
  }

  await capturePaymentBestEffort(container, query, paymentCollectionId);

  await flowService.createFlowPayments({
    cart_id: cartId,
    commerce_order: commerceOrder,
    token,
    flow_order: flowOrder ? String(flowOrder) : null,
    amount,
    currency_code: (cart.currency_code ?? "clp").toLowerCase(),
    status: "paid",
    raw_status: FLOW_STATUS.PAID,
    order_id: orderId,
    payment_collection_id: paymentCollectionId,
  });

  return { outcome: "paid", orderId, displayId: await displayIdOf(query, orderId) };
}

export type CardUpdateOutcome = "updated" | "register_failed" | "not_found";

export interface CardUpdateResult {
  outcome: CardUpdateOutcome;
  /** Resultado del reintento inmediato tras actualizar la tarjeta (si aplica). */
  charged?: boolean;
}

/**
 * Actualiza la tarjeta de una suscripción en dunning (D59) — disparado por
 * `/flow/register-return?sub=…`. Confirma el registro, refresca `saved_card`,
 * reengancha la suscripción a `active` y dispara un REINTENTO inmediato de cobro
 * (best-effort) para no hacer esperar al cliente al próximo barrido del scheduler.
 */
export async function settleSubscriptionCardUpdate(
  container: MedusaContainer,
  subscriptionId: string,
  token: string,
): Promise<CardUpdateResult> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as QueryFn;
  const subs = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const cards = container.resolve<PaymentMethodModuleService>(PAYMENT_METHOD_MODULE);
  const config = getFlowConfig();

  // Dueño de la suscripción (para asociar la tarjeta al cliente correcto).
  const { data: subRows } = await query.graph({
    entity: "subscription",
    fields: ["id", "status", "customer.id"],
    filters: { id: subscriptionId },
  });
  const sub = subRows?.[0] as { id: string; status: string; customer?: unknown } | undefined;
  if (!sub) return { outcome: "not_found" };
  const customer = Array.isArray(sub.customer) ? sub.customer[0] : sub.customer;
  const customerId = (customer as { id?: string } | undefined)?.id;
  if (!customerId) return { outcome: "not_found" };

  const reg = await getFlowRegisterStatus(token, config);
  if (!reg.registered || !reg.customerId) return { outcome: "register_failed" };

  // Upsert de la tarjeta (por gateway_customer_id: Flow mantiene UNA tarjeta por
  // cliente → registrar reemplaza; refrescamos marca/últimos 4).
  const existingCard = (
    await cards.listSavedCards({ customer_id: customerId, gateway_customer_id: reg.customerId })
  )[0];
  let cardId: string;
  if (existingCard) {
    await cards.updateSavedCards({
      id: existingCard.id,
      brand: reg.creditCardType ?? existingCard.brand,
      last4: reg.last4CardDigits ?? existingCard.last4,
    });
    cardId = existingCard.id;
  } else {
    const created = await cards.createSavedCards({
      customer_id: customerId,
      gateway: "flow",
      gateway_customer_id: reg.customerId,
      brand: reg.creditCardType ?? "tarjeta",
      last4: reg.last4CardDigits ?? "····",
    });
    cardId = created.id;
  }

  await markFlowCardRegistered(container, customerId);

  // Reengancha la suscripción con la tarjeta nueva y limpia el estado de dunning.
  await subs.updateSubscriptions({
    id: subscriptionId,
    payment_method_id: cardId,
    status: "active",
    failed_charge_count: 0,
    last_charge_error: null,
    next_charge_attempt_at: null,
  });

  // Reintento inmediato (best-effort): si la suscripción estaba vencida, cobra ya.
  let charged = false;
  try {
    const result = await chargeDueSubscription(container, subscriptionId);
    charged = result.outcome === "renewed" || result.outcome === "recovered" || result.outcome === "order_resumed";
  } catch (e) {
    console.warn(`[flow] Reintento inmediato tras actualizar tarjeta falló para ${subscriptionId}:`, e);
  }

  return { outcome: "updated", charged };
}

async function displayIdOf(query: QueryFn, orderId?: string | null): Promise<number | undefined> {
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
