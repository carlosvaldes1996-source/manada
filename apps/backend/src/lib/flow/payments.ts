import { flowGet, flowPost, FlowApiError, type FlowConfig, type FlowParams } from "./http";

/**
 * Bindings del servicio `payment` de Flow (D58, pago único) — capa ALTA.
 * Doc: https://developers.flow.cl/api (tag `payment`).
 *
 * Solo declara endpoint + parámetros + forma de la respuesta; el transporte
 * (firma, reintentos, errores) vive en `./http`.
 */

export interface CreatePaymentInput {
  /** Referencia única del comercio (nuestro `commerce_order`). */
  commerceOrder: string;
  subject: string;
  amount: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
  currency?: string;
  /** 9 = mostrar todos los medios de pago de Flow. */
  paymentMethod?: number;
  /**
   * JSON con datos extra (p. ej. `{ rut }`). OJO: en `payment/create` el parámetro
   * se llama `optional` (singular); en `customer/charge` es `optionals` (plural).
   * Verificado contra el spec oficial.
   */
  optional?: Record<string, string>;
}

export interface CreatePaymentResult {
  token: string;
  /** URL base a la que redirigir con `?token=`. */
  url: string;
  flowOrder: number;
  /** URL de redirección lista (`url?token=token`). */
  redirectUrl: string;
}

/**
 * `POST payment/create` — crea la orden de pago en Flow y devuelve el token + la
 * URL de redirección. El usuario elige el medio en el checkout de Flow
 * (`paymentMethod: 9`). El pago NO está confirmado aquí: se verifica luego con
 * `getStatus` desde el callback.
 *
 * Sin reintento: crear dos órdenes de pago para el mismo `commerceOrder` es un
 * fallo de negocio en Flow, no algo que resolver repitiendo.
 */
export async function createFlowPayment(
  input: CreatePaymentInput,
  config: FlowConfig,
): Promise<CreatePaymentResult> {
  const params: FlowParams = {
    apiKey: config.apiKey,
    commerceOrder: input.commerceOrder,
    subject: input.subject,
    amount: input.amount,
    email: input.email,
    urlConfirmation: input.urlConfirmation,
    urlReturn: input.urlReturn,
    currency: input.currency ?? "CLP",
    paymentMethod: input.paymentMethod ?? 9,
  };
  if (input.optional) params.optional = JSON.stringify(input.optional);

  const data = await flowPost<{ token?: string; url?: string; flowOrder?: number }>(
    "payment/create",
    params,
    config,
  );

  if (!data.token || !data.url) {
    throw new FlowApiError({
      endpoint: "payment/create",
      httpStatus: 200,
      message: "Respuesta sin token/url.",
    });
  }

  return {
    token: data.token,
    url: data.url,
    flowOrder: data.flowOrder ?? 0,
    redirectUrl: `${data.url}?token=${data.token}`,
  };
}

/** Estados de pago de Flow (`payment/getStatus` → campo `status`). */
export const FLOW_STATUS = {
  PENDING: 1,
  PAID: 2,
  REJECTED: 3,
  CANCELED: 4,
} as const;

export interface FlowStatusResult {
  /** 1 pendiente · 2 pagada · 3 rechazada · 4 anulada. */
  status: number;
  commerceOrder: string;
  flowOrder?: number;
  amount?: number;
  /** Objeto `paymentData` de Flow (medio, fecha, etc.), si viene. */
  paymentData?: Record<string, unknown>;
  raw: Record<string, unknown>;
}

type RawPaymentStatus = Record<string, unknown> & {
  status?: number;
  commerceOrder?: string;
  flowOrder?: number;
  amount?: number;
};

function toStatusResult(data: RawPaymentStatus, fallbackCommerceOrder: string): FlowStatusResult {
  return {
    status: data.status as number,
    commerceOrder: String(data.commerceOrder ?? fallbackCommerceOrder),
    flowOrder: data.flowOrder,
    amount: typeof data.amount === "number" ? data.amount : Number(data.amount) || undefined,
    paymentData: (data.paymentData as Record<string, unknown>) ?? undefined,
    raw: data,
  };
}

/**
 * `GET payment/getStatus` — fuente de verdad del pago. NUNCA se asume que un pago
 * fue exitoso porque el usuario volvió al sitio: se consulta aquí con el token
 * que Flow envió en el callback. Lectura idempotente → con reintento.
 */
export async function getFlowStatus(token: string, config: FlowConfig): Promise<FlowStatusResult> {
  const data = await flowGet<RawPaymentStatus>(
    "payment/getStatus",
    { apiKey: config.apiKey, token },
    config,
    { retry: true },
  );

  if (typeof data.status !== "number") {
    throw new FlowApiError({
      endpoint: "payment/getStatus",
      httpStatus: 200,
      message: "Respuesta sin `status`.",
    });
  }
  return toStatusResult(data, "");
}

/**
 * Resultado de consultar un pago por `commerceOrder`. La distinción entre
 * "Flow respondió" y "Flow no me respondió" es la pieza que evita el doble cobro:
 * quien pregunta NUNCA debe interpretar un fallo de red como "no está pagado".
 */
export type FlowStatusLookup =
  /** Flow respondió con un estado. Es la única respuesta sobre la que se decide. */
  | { outcome: "found"; status: FlowStatusResult }
  /**
   * Flow respondió que NO tiene ninguna transacción con esa referencia. Es un
   * **veredicto**, no una duda: si Flow no la registró, no la cobró.
   */
  | { outcome: "not_found"; message: string }
  /** No se pudo obtener respuesta (red, timeout, 5xx, 429). NO significa "no pagado". */
  | { outcome: "unavailable"; message: string };

/**
 * ¿Flow dijo EXPLÍCITAMENTE que no conoce esta referencia?
 *
 * Solo un **400** cuenta: significa que la petición llegó, Flow la entendió y su capa de
 * aplicación respondió. Un 5xx, un 429 o un fallo de red (`httpStatus 0`) no son
 * veredicto de nada y deben seguir siendo `unavailable`.
 *
 * ⚠️ **TRANSITORIO — comparar el texto es una solución puente, no la definitiva.**
 * Decisión explícita de Carlos (2026-08-04): en cuanto el logging nuevo entregue el `code`
 * estable que manda Flow, esta comparación se reemplaza por el número y el texto deja de
 * ser el criterio. No debe quedarse así. `FlowApiError` ya transporta el `code` y
 * `describeLookupError` lo deja en el mensaje, así que la primera ocurrencia registrada
 * basta para cerrarlo. Pendiente en `TODO.md` Frente 1b.
 *
 * Mientras tanto, **equivocarse aquí falla hacia el lado seguro:** si Flow cambia el texto
 * y dejamos de reconocerlo, el resultado vuelve a ser `unavailable`, que es el
 * comportamiento conservador de siempre — se aplaza, nunca se cobra de más.
 */
function isTransactionNotFound(e: unknown): boolean {
  return (
    e instanceof FlowApiError && e.httpStatus === 400 && /transaction not found/i.test(e.message)
  );
}

/** Mensaje de diagnóstico que CONSERVA el `code` de Flow cuando vino (hoy se perdía). */
function describeLookupError(e: unknown): string {
  if (!(e instanceof FlowApiError)) return e instanceof Error ? e.message : String(e);
  return e.code === undefined ? e.message : `${e.message} [code=${e.code}]`;
}

/**
 * `GET payment/getStatusByCommerceId` — FUENTE DE VERDAD del cobro recurrente:
 * confirma el estado del pago por nuestra referencia (`commerceOrder`), sin depender
 * de la respuesta síncrona de `customer/charge`. Lectura idempotente → con reintento.
 *
 * Devuelve un resultado DISCRIMINADO a propósito. La versión anterior devolvía `null`
 * tanto ante "Flow no conoce este pago" como ante "no pude preguntarle", y quien
 * llamaba interpretaba ambos como *no pagado* y cobraba: con Flow aceptando cargos
 * repetidos bajo el mismo `commerceOrder` (medido en la Etapa 3), eso es doble cobro
 * real. Era la deuda declarada en D70 y el punto 1 del Frente 1b.
 *
 * ⚠️ **"No existe" y "no pude preguntar" SÍ se distinguen, desde 2026-08-04.** La versión
 * anterior los unificaba a propósito, porque el spec no documenta qué devuelve Flow ante
 * un `commerceId` desconocido. El spec sigue sin documentarlo, pero ya está **medido**
 * contra Sandbox: responde `400 "Transaction not found"`.
 *
 * Unificarlos tenía un costo que se midió en la misma sesión: un cobro que moría ANTES de
 * llegar a Flow (400 de cuota, 401, 5xx, red) dejaba el ledger `pending` con una
 * referencia que Flow nunca registró, y desde ahí toda consulta caía en `unavailable` →
 * la suscripción se aplazaba **para siempre**, activa, vencida e invisible en el Admin.
 *
 * Quien llama sigue resolviendo el resto con su propio ledger: si no consta que se haya
 * enviado nunca ese `commerceOrder`, no hay nada que preguntar y no se pregunta.
 */
export async function lookupFlowStatusByCommerceId(
  commerceId: string,
  config: FlowConfig,
): Promise<FlowStatusLookup> {
  try {
    const data = await flowGet<RawPaymentStatus>(
      "payment/getStatusByCommerceId",
      { apiKey: config.apiKey, commerceId },
      config,
      { retry: true },
    );
    if (typeof data.status !== "number") {
      return { outcome: "unavailable", message: "Respuesta de Flow sin `status`." };
    }
    return { outcome: "found", status: toStatusResult(data, commerceId) };
  } catch (e) {
    const message = describeLookupError(e);
    return isTransactionNotFound(e)
      ? { outcome: "not_found", message }
      : { outcome: "unavailable", message };
  }
}
