import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
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
  lookupFlowStatusByCommerceId,
  FLOW_STATUS,
} from "./flow";
import { markFlowCardRegistered, getFlowCustomerRecord } from "./flow-customer";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import type SubscriptionModuleService from "../modules/subscription/service";
import { chargeSubscriptionLocked } from "./subscription-charge";

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
  | "charge_failed" // tarjeta OK pero el cobro fue RECHAZADO por Flow
  | "unverified" // no se obtuvo veredicto del cobro → no se cobra ni se crea orden
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

/**
 * Punto de entrada ÚNICO de la conciliación. Corre bajo un lock por carrito, igual
 * que el cobro recurrente (`chargeSubscriptionLocked`): a esta ruta la puede
 * golpear el retorno del navegador, un refresh y un reintento de Flow a la vez, y
 * sin lock los tres entran juntos al camino de cobro.
 *
 * Verificado en sandbox (Etapa 3): dos callbacks simultáneos sobre un carrito sin
 * conciliar ejecutaban AMBOS `customer/charge`. La orden no se duplicaba —el lock
 * de `completeCartWorkflow` aguantaba— pero el perdedor lanzaba excepción y el
 * comprador veía "pendiente" tras una compra exitosa.
 */
export async function settleSubscriptionRegistration(
  container: MedusaContainer,
  cartId: string,
  token: string,
): Promise<RegistrationResult> {
  const locking = container.resolve(Modules.LOCKING);
  return locking.execute(
    `subscription-registration:${cartId}`,
    () => settleRegistrationUnlocked(container, cartId, token),
    { timeout: 60 },
  );
}

async function settleRegistrationUnlocked(
  container: MedusaContainer,
  cartId: string,
  token: string,
): Promise<RegistrationResult> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as QueryFn;
  const flowService = container.resolve<FlowPaymentModuleService>(FLOW_PAYMENT_MODULE);
  const cards = container.resolve<PaymentMethodModuleService>(PAYMENT_METHOD_MODULE);
  const config = getFlowConfig();

  // Carrito primero: si ya se completó, es un callback repetido → idempotente OK.
  //
  // ⚠️ Medusa calcula `total` a partir de las relaciones CARGADAS (ver
  // `cartFieldsForRefreshSteps` de core-flows). Pedir solo `items.id` deja el
  // subtotal de productos en 0 y `total` colapsa al costo de envío — se cobraba
  // $3.990 por un carrito de $29.500 mientras la orden nacía marcada como pagada
  // por el total completo. El pago único (D58) ya cargaba estos campos; esta ruta
  // no heredó la corrección. Verificado contra Flow Sandbox en la Etapa 3.
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "customer_id",
      "currency_code",
      "completed_at",
      "total",
      "items.*",
      "items.adjustments.*",
      "items.tax_lines.*",
      "shipping_methods.*",
      "shipping_methods.adjustments.*",
      "shipping_methods.tax_lines.*",
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

  // El token debe pertenecer al dueño del carrito. `/flow/register-return` es
  // pública (Flow no manda publishable key) y recibe el par `(cart, token)` sin
  // más: sin esta comprobación, un token válido de OTRO cliente conciliaría este
  // carrito, guardando la tarjeta del cliente A bajo el cliente B y cobrándosela.
  // Verificado en sandbox (Etapa 3): un token ya usado servía para conciliar y
  // cobrar un carrito distinto.
  const link = await getFlowCustomerRecord(container, customerId);
  if (!link || link.flow_customer_id !== reg.customerId) {
    console.error(
      `[flow] Token de registro ajeno al carrito ${cartId}: el token pertenece a ` +
        `${reg.customerId} y el cliente del carrito tiene ${link?.flow_customer_id ?? "(sin vínculo)"}. ` +
        `No se cobra.`,
    );
    return { outcome: "invalid" };
  }

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
  // Solo se pregunta por un cobro previo si CONSTA que hubo uno: el spec no documenta
  // qué devuelve Flow ante un `commerceId` desconocido, así que preguntar "a ciegas"
  // en el primer intento obligaría a interpretar un error como "no existe" — que es
  // justamente la ambigüedad que causa doble cobro. Sin intentos previos no hay nada
  // que verificar.
  const priorAttempts = await flowService.listFlowPayments({ cart_id: cartId });
  let paid = false;
  let flowOrder: number | undefined;
  let rawStatus: number | null = null;
  let chargedAmount: number | undefined;

  if (priorAttempts.length > 0) {
    const previous = await lookupFlowStatusByCommerceId(commerceOrder, config);
    if (previous.outcome === "unavailable") {
      // Hubo un intento y no sabemos cómo terminó. Cobrar aquí puede duplicar: Flow
      // acepta cargos repetidos con el mismo `commerceOrder` (medido en la Etapa 3).
      console.error(
        `[flow] No se pudo verificar el intento previo del carrito ${cartId} ` +
          `(${commerceOrder}): ${previous.message}. No se cobra; el cliente reintenta.`,
      );
      return { outcome: "unverified" };
    }
    paid = previous.status.status === FLOW_STATUS.PAID;
    flowOrder = previous.status.flowOrder;
    rawStatus = previous.status.status;
    chargedAmount = previous.status.amount;
  }

  if (!paid) {
    const charge = await chargeFlowCustomer(
      { customerId: reg.customerId, amount, subject: "Compra Plan Manada", commerceOrder },
      config,
    );
    const lookup = await lookupFlowStatusByCommerceId(commerceOrder, config);
    const verify = lookup.outcome === "found" ? lookup.status : undefined;
    paid = verify?.status === FLOW_STATUS.PAID || (charge.ok && charge.status === FLOW_STATUS.PAID);
    flowOrder = verify?.flowOrder ?? charge.flowOrder;
    rawStatus = verify?.status ?? charge.status ?? null;
    chargedAmount = verify?.amount ?? chargedAmount;

    // Ni pagado ni rechazado: no obtuvimos veredicto. Registrarlo como "cobro
    // rechazado" mandaría al comprador a reintentar un pago que quizá YA se hizo.
    if (!paid && charge.failureKind !== "rejected" && verify === undefined) {
      await flowService.createFlowPayments({
        cart_id: cartId,
        commerce_order: commerceOrder,
        token,
        flow_order: flowOrder ? String(flowOrder) : null,
        amount,
        currency_code: (cart.currency_code ?? "clp").toLowerCase(),
        status: "pending",
        raw_status: rawStatus,
        error: charge.message ?? "Sin veredicto de Flow; pendiente de conciliar.",
      });
      console.error(
        `[flow] Cobro de la 1ª compra suscrita SIN VEREDICTO (${commerceOrder}): ` +
          `${charge.message ?? "verificación no disponible"}. Queda pendiente de conciliar.`,
      );
      return { outcome: "unverified" };
    }

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

  // Conciliación de monto: la orden va a nacer marcada como pagada por el total del
  // carrito, así que si Flow cobró OTRA cifra hay que dejarlo gritando en los logs.
  // Es exactamente el defecto que se escapó hasta la Etapa 3 (se cobraba solo el
  // envío y nadie se enteraba). No bloquea —el cliente ya pagó y merece su orden—,
  // pero deja rastro accionable. Mismo criterio que `flow-settle.ts` (pago único).
  if (chargedAmount != null && Math.round(Number(chargedAmount)) !== amount) {
    console.error(
      `[flow] ¡ATENCIÓN! Descuadre de monto en ${commerceOrder}: Flow cobró ` +
        `${chargedAmount} y el carrito suma ${amount}. La orden se creará por ${amount}. ` +
        `Revisar manualmente.`,
    );
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

  // Mismo control de pertenencia que en el alta: sin él, un token de otro cliente
  // engancharía SU tarjeta a esta suscripción — y el cobro recurrente le cargaría
  // a un tercero mes a mes. Aquí el daño es peor que en el alta, porque persiste.
  const link = await getFlowCustomerRecord(container, customerId);
  if (!link || link.flow_customer_id !== reg.customerId) {
    console.error(
      `[flow] Token de registro ajeno a la suscripción ${subscriptionId}: el token pertenece ` +
        `a ${reg.customerId} y el cliente tiene ${link?.flow_customer_id ?? "(sin vínculo)"}. ` +
        `No se engancha la tarjeta.`,
    );
    return { outcome: "register_failed" };
  }

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
  // OBLIGATORIAMENTE por la variante con lock: `chargeDueSubscription` a secas
  // corría fuera del candado y podía solaparse con el barrido del scheduler o con
  // el botón del Admin sobre la misma suscripción. Con Flow sin deduplicar
  // `customer/charge` por `commerceOrder` (medido en la Etapa 3), eso era doble
  // cobro directo. `chargeSubscriptionLocked` es el único punto de entrada válido.
  let charged = false;
  try {
    const result = await chargeSubscriptionLocked(container, subscriptionId);
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
