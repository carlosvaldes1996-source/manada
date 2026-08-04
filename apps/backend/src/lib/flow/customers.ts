import { flowGet, flowPost, FlowApiError, type FlowConfig, type FlowParams } from "./http";

/**
 * Bindings del servicio `customer` de Flow (D70, Etapa 1) — capa ALTA.
 * Doc oficial: https://developers.flow.cl/api (tag `customer`, spec `es-openApiFlow.yaml`).
 *
 * Un Customer de Flow es la BÓVEDA de la tarjeta de un cliente: Flow lo identifica
 * con un hash `cus_…` y guarda contra él, como MUCHO, UNA tarjeta (el objeto Customer
 * expone `creditCardType`/`last4CardDigits`/`registerDate` en singular, y no existe
 * ningún servicio de listado de tarjetas). Registrar una tarjeta nueva REEMPLAZA la
 * anterior.
 *
 * Este archivo NO conoce Medusa ni el dominio de Manada: traduce endpoints a tipos.
 * La orquestación (idempotencia, persistencia, cuándo crear) vive en
 * `src/lib/flow-customer.ts`.
 */

// ─────────────────────────────────────────────────────────────────────────────
// El objeto Customer (schema `Customer` del spec oficial).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estado del cliente en Flow. El spec lo documenta como STRING (`'0'`/`'1'`), no
 * como número — se compara como string a propósito.
 */
export const FLOW_CUSTOMER_STATUS = {
  /** 0 = Eliminado (vía `customer/delete`). */
  DELETED: "0",
  /** 1 = Activo. */
  ACTIVE: "1",
} as const;

/**
 * Modo de pago del cliente, según el spec oficial:
 *  - `auto`   → tiene tarjeta registrada; se le puede hacer `customer/charge`.
 *  - `manual` → sin tarjeta utilizable; Flow cobraría por email.
 *
 * Es la respuesta AUTORITATIVA a "¿puedo cobrarle server-to-server?", mejor que
 * inferirlo de que tengamos marca/últimos-4 guardados localmente.
 */
export const FLOW_PAY_MODE = {
  AUTO: "auto",
  MANUAL: "manual",
} as const;

export type FlowPayMode = (typeof FLOW_PAY_MODE)[keyof typeof FLOW_PAY_MODE];

/** El objeto Customer tal como lo devuelve Flow (create/edit/get/delete/unRegister). */
export interface FlowCustomer {
  customerId: string;
  /** `yyyy-mm-dd hh:mm:ss` (hora de Flow, sin zona explícita). */
  created?: string;
  email?: string;
  name?: string;
  /** `auto` | `manual` — ver `FLOW_PAY_MODE`. */
  payMode?: string;
  /** Marca de la tarjeta registrada (p. ej. `Visa`). */
  creditCardType?: string;
  last4CardDigits?: string;
  /** El identificador del cliente en NUESTRO sistema (`customer_id` de Medusa). */
  externalId?: string;
  /** `'0'` eliminado · `'1'` activo. */
  status?: string;
  /** `yyyy-mm-dd hh:mm:ss` — cuándo registró su tarjeta. */
  registerDate?: string;
  raw: Record<string, unknown>;
}

type RawCustomer = Record<string, unknown> & {
  customerId?: string;
  created?: string;
  email?: string;
  name?: string;
  pay_mode?: string;
  creditCardType?: string;
  last4CardDigits?: string;
  externalId?: string;
  status?: string | number;
  registerDate?: string;
};

/**
 * Normaliza la respuesta de Flow al tipo del proyecto: `pay_mode` (snake_case en la
 * API) pasa a `payMode`, y `status` se fuerza a string porque el spec lo declara
 * string pero los ejemplos mezclan `'1'` y `1`.
 */
function toFlowCustomer(data: RawCustomer, endpoint: string): FlowCustomer {
  if (!data.customerId) {
    throw new FlowApiError({
      endpoint,
      httpStatus: 200,
      message: "Respuesta sin `customerId`.",
    });
  }
  return {
    customerId: String(data.customerId),
    created: data.created,
    email: data.email,
    name: data.name,
    payMode: data.pay_mode,
    creditCardType: data.creditCardType,
    last4CardDigits: data.last4CardDigits,
    externalId: data.externalId,
    status: data.status === undefined || data.status === null ? undefined : String(data.status),
    registerDate: data.registerDate,
    raw: data,
  };
}

/** ¿Este cliente de Flow tiene una tarjeta contra la que se puede cobrar? */
export function isChargeable(customer: Pick<FlowCustomer, "payMode" | "status">): boolean {
  return customer.status === FLOW_CUSTOMER_STATUS.ACTIVE && customer.payMode === FLOW_PAY_MODE.AUTO;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ciclo de vida.
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateCustomerInput {
  name: string;
  email: string;
  /** Referencia estable del comercio: usamos el `customer_id` de Medusa. */
  externalId: string;
}

/**
 * `POST customer/create` — crea el cliente en Flow. Los tres campos son REQUERIDOS
 * por el spec.
 *
 * ⚠️ SIN REINTENTO, a propósito: Flow no ofrece "crear si no existe" ni ninguna
 * búsqueda por `externalId` (ver `findFlowCustomerByExternalId`), así que repetir
 * una petición cuyo resultado se desconoce crearía un `cus_…` huérfano. La
 * idempotencia se garantiza AGUAS ARRIBA, en la base de datos de Manada
 * (`flow_customer.customer_id` es único).
 */
export async function createFlowCustomer(
  input: CreateCustomerInput,
  config: FlowConfig,
): Promise<FlowCustomer> {
  const params: FlowParams = {
    apiKey: config.apiKey,
    name: input.name,
    email: input.email,
    externalId: input.externalId,
  };
  const data = await flowPost<RawCustomer>("customer/create", params, config);
  return toFlowCustomer(data, "customer/create");
}

export interface EditCustomerInput {
  customerId: string;
  /** Los tres son opcionales: se envía solo lo que cambia. */
  name?: string;
  email?: string;
  externalId?: string;
}

/**
 * `POST customer/edit` — actualiza los datos del cliente en Flow. Con reintento:
 * repetir el mismo `edit` converge al mismo estado (es idempotente de hecho).
 */
export async function editFlowCustomer(
  input: EditCustomerInput,
  config: FlowConfig,
): Promise<FlowCustomer> {
  const params: FlowParams = { apiKey: config.apiKey, customerId: input.customerId };
  if (input.name !== undefined) params.name = input.name;
  if (input.email !== undefined) params.email = input.email;
  if (input.externalId !== undefined) params.externalId = input.externalId;

  const data = await flowPost<RawCustomer>("customer/edit", params, config, { retry: true });
  return toFlowCustomer(data, "customer/edit");
}

/**
 * `GET customer/get` — lee el cliente por su `customerId`. Lectura idempotente →
 * con reintento. Es la ÚNICA forma de consultar un cliente puntual: no existe
 * búsqueda por `externalId`.
 */
export async function getFlowCustomer(
  customerId: string,
  config: FlowConfig,
): Promise<FlowCustomer> {
  const data = await flowGet<RawCustomer>(
    "customer/get",
    { apiKey: config.apiKey, customerId },
    config,
    { retry: true },
  );
  return toFlowCustomer(data, "customer/get");
}

/**
 * `POST customer/delete` — elimina el cliente en Flow (pasa a `status = '0'`).
 *
 * Restricción del spec: el cliente NO debe tener suscripciones activas ni importes
 * pendientes de pago; si los tiene, Flow responde error de negocio (401).
 */
export async function deleteFlowCustomer(
  customerId: string,
  config: FlowConfig,
): Promise<FlowCustomer> {
  const data = await flowPost<RawCustomer>(
    "customer/delete",
    { apiKey: config.apiKey, customerId },
    config,
  );
  return toFlowCustomer(data, "customer/delete");
}

export interface FlowCustomerPage {
  total: number;
  hasMore: boolean;
  data: FlowCustomer[];
}

export interface ListCustomersInput {
  /** Registro inicial (por omisión 0). */
  start?: number;
  /** Registros por página (por omisión 10, máximo 100). */
  limit?: number;
  /** ⚠️ Filtra por NOMBRE del cliente, no por externalId ni por email. */
  filter?: string;
  /** Filtro por estado del cliente (`0` eliminado · `1` activo). */
  status?: number;
}

/**
 * `GET customer/list` — lista paginada de clientes.
 *
 * ⚠️ El único filtro de texto es `filter`, y el spec lo define como "filtro por
 * NOMBRE del cliente". No hay filtro por `externalId` ni por email.
 */
export async function listFlowCustomers(
  input: ListCustomersInput,
  config: FlowConfig,
): Promise<FlowCustomerPage> {
  const params: FlowParams = { apiKey: config.apiKey };
  if (input.start !== undefined) params.start = input.start;
  if (input.limit !== undefined) params.limit = input.limit;
  if (input.filter !== undefined) params.filter = input.filter;
  if (input.status !== undefined) params.status = input.status;

  const data = await flowGet<{ total?: number; hasMore?: boolean | number; data?: RawCustomer[] }>(
    "customer/list",
    params,
    config,
    { retry: true },
  );

  return {
    total: Number(data.total ?? 0),
    hasMore: Boolean(data.hasMore),
    data: (Array.isArray(data.data) ? data.data : []).map((c) => toFlowCustomer(c, "customer/list")),
  };
}

/**
 * Busca un cliente de Flow por nuestro `externalId` RECORRIENDO `customer/list`.
 *
 * ⚠️ Rescate de último recurso, NO un camino normal. La API de Flow no permite
 * buscar por `externalId` (`customer/list` solo filtra por nombre), así que esto
 * pagina el padrón completo del comercio y compara en memoria: es O(n) contra un
 * servicio externo y se degrada a medida que crece la cartera.
 *
 * Existe únicamente para reconciliar a mano si se perdiera el vínculo local. El
 * camino normal es que `flow_customer` guarde el `customerId` desde el momento de
 * la creación. `maxPages` acota el peor caso.
 */
export async function findFlowCustomerByExternalId(
  externalId: string,
  config: FlowConfig,
  maxPages = 20,
): Promise<FlowCustomer | null> {
  const limit = 100;
  for (let page = 0; page < maxPages; page++) {
    const { data, hasMore } = await listFlowCustomers({ start: page * limit, limit }, config);
    const hit = data.find((c) => c.externalId === externalId);
    if (hit) return hit;
    if (!hasMore || data.length === 0) return null;
  }
  console.warn(
    `[flow] findFlowCustomerByExternalId: se alcanzó el tope de ${maxPages} páginas sin encontrar ${externalId}`,
  );
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Registro de tarjeta (tokenización).
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterCardInput {
  customerId: string;
  /** URL a la que Flow devuelve el navegador (por POST) con el `token` del registro. */
  urlReturn: string;
}

export interface RegisterCardResult {
  token: string;
  url: string;
  /** URL de redirección lista (`url?token=token`). */
  redirectUrl: string;
}

/**
 * `POST customer/register` — inicia el registro (tokenización) de la tarjeta.
 * Devuelve la URL segura de Flow a la que se redirige al usuario (`url + "?token=" +
 * token`, según el spec). Al terminar, Flow hace **POST** a `url_return` con el
 * parámetro `token`; el resultado real se confirma con `getFlowRegisterStatus`
 * (nunca se asume por el retorno del navegador).
 *
 * Sin reintento: cada llamada abre una transacción de registro nueva.
 */
export async function registerFlowCard(
  input: RegisterCardInput,
  config: FlowConfig,
): Promise<RegisterCardResult> {
  const data = await flowPost<{ token?: string; url?: string }>(
    "customer/register",
    { apiKey: config.apiKey, customerId: input.customerId, url_return: input.urlReturn },
    config,
  );

  if (!data.token || !data.url) {
    throw new FlowApiError({
      endpoint: "customer/register",
      httpStatus: 200,
      message: "Respuesta sin token/url.",
    });
  }
  return { token: data.token, url: data.url, redirectUrl: `${data.url}?token=${data.token}` };
}

export interface RegisterStatusResult {
  /**
   * Éxito ROBUSTO: la tarjeta quedó registrada. El spec define `status` `'1'`
   * registrado / `'0'` no registrado, pero NO nos apoyamos solo en ese entero: el
   * criterio es haber recibido además lo que NECESITAMOS para cobrar y mostrar
   * (`customerId` + `last4CardDigits` + `creditCardType`).
   */
  registered: boolean;
  /** `'1'` registrado · `'0'` no registrado, tal como vino. */
  status?: string;
  customerId?: string;
  creditCardType?: string;
  last4CardDigits?: string;
  /** BIN + últimos 4 enmascarados (`"457630 **** **** 0366"`). Puede venir null. */
  cardNumber?: string | null;
  /** Banco emisor en MAYÚSCULAS. Puede venir null. */
  issuerBank?: string | null;
  raw: Record<string, unknown>;
}

/**
 * `GET customer/getRegisterStatus` — confirma el resultado de la tokenización con
 * el `token` que Flow envió al `urlReturn`. Fuente de verdad del registro.
 *
 * ⚠️ Flow NO devuelve fecha de vencimiento de la tarjeta en ningún servicio: el
 * `RegisterResult` del spec expone solo marca, últimos 4, BIN enmascarado y banco
 * emisor. Cualquier `exp_month`/`exp_year` local es, con Flow, un dato inventado.
 *
 * Lectura idempotente → con reintento.
 */
export async function getFlowRegisterStatus(
  token: string,
  config: FlowConfig,
): Promise<RegisterStatusResult> {
  const data = await flowGet<
    Record<string, unknown> & {
      status?: string | number;
      customerId?: string;
      creditCardType?: string;
      last4CardDigits?: string;
      cardNumber?: string | null;
      issuerBank?: string | null;
    }
  >("customer/getRegisterStatus", { apiKey: config.apiKey, token }, config, { retry: true });

  const brand = data.creditCardType ? String(data.creditCardType) : undefined;
  const last4 = data.last4CardDigits ? String(data.last4CardDigits) : undefined;
  return {
    registered: Boolean(brand && last4 && data.customerId),
    status: data.status === undefined || data.status === null ? undefined : String(data.status),
    customerId: data.customerId ? String(data.customerId) : undefined,
    creditCardType: brand,
    last4CardDigits: last4,
    cardNumber: data.cardNumber ?? undefined,
    issuerBank: data.issuerBank ?? undefined,
    raw: data,
  };
}

/**
 * `POST customer/unRegister` — elimina el registro de la tarjeta del cliente (el
 * cliente sigue existiendo). Según el spec, tras esto no se le pueden hacer cargos
 * automáticos y Flow pasaría a cobrar por email — es decir, `pay_mode` cae a
 * `manual`.
 */
export async function unregisterFlowCard(
  customerId: string,
  config: FlowConfig,
): Promise<FlowCustomer> {
  const data = await flowPost<RawCustomer>(
    "customer/unRegister",
    { apiKey: config.apiKey, customerId },
    config,
  );
  return toFlowCustomer(data, "customer/unRegister");
}

// ─────────────────────────────────────────────────────────────────────────────
// Cobro contra la tarjeta tokenizada (usado por la etapa de cobros, D59).
// ─────────────────────────────────────────────────────────────────────────────

export interface ChargeCustomerInput {
  customerId: string;
  amount: number;
  subject: string;
  /** Referencia única del comercio por período (eje de la idempotencia del cobro). */
  commerceOrder: string;
  currency?: string;
  /** Datos extra. OJO: aquí el parámetro es `optionals` (plural), no `optional`. */
  optionals?: Record<string, string>;
}

export interface ChargeCustomerResult {
  /** HTTP 2xx: Flow procesó la petición (puede ser pago o rechazo controlado). */
  ok: boolean;
  /** Escala de pago de Flow (1 pend · 2 pagada · 3 rechazada · 4 anulada), si vino. */
  status?: number;
  flowOrder?: number;
  commerceOrder: string;
  /** Mensaje de Flow ante un rechazo/negativa (tarjeta sin fondos, etc.). */
  message?: string;
  raw: Record<string, unknown>;
}

/**
 * `POST customer/charge` — cobra server-to-server contra la tarjeta tokenizada del
 * cliente (sin redirección). Si el cliente no tiene tarjeta registrada, Flow
 * responde error.
 *
 * NO lanza ante un rechazo de negocio (tarjeta sin fondos): eso es un desenlace
 * esperado que el dunning debe registrar, no una excepción. Devuelve `ok=false` +
 * `message`. La verdad del cobro NUNCA se asume de aquí: el orquestador confirma
 * con `getFlowStatusByCommerceId` antes de crear la orden.
 *
 * ⚠️ SIN REINTENTO, y así debe quedarse: repetir un cobro cuyo resultado se
 * desconoce puede cobrar dos veces. Un timeout se resuelve CONSULTANDO.
 */
export async function chargeFlowCustomer(
  input: ChargeCustomerInput,
  config: FlowConfig,
): Promise<ChargeCustomerResult> {
  const params: FlowParams = {
    apiKey: config.apiKey,
    customerId: input.customerId,
    amount: input.amount,
    subject: input.subject,
    commerceOrder: input.commerceOrder,
    currency: input.currency ?? "CLP",
  };
  if (input.optionals) params.optionals = JSON.stringify(input.optionals);

  try {
    const data = await flowPost<
      Record<string, unknown> & { status?: number; flowOrder?: number; commerceOrder?: string }
    >("customer/charge", params, config);

    return {
      ok: true,
      status: typeof data.status === "number" ? data.status : undefined,
      flowOrder: data.flowOrder,
      commerceOrder: data.commerceOrder ? String(data.commerceOrder) : input.commerceOrder,
      message: typeof data.message === "string" ? data.message : undefined,
      raw: data,
    };
  } catch (e) {
    if (e instanceof FlowApiError) {
      return {
        ok: false,
        commerceOrder: input.commerceOrder,
        message: e.message,
        raw: {},
      };
    }
    throw e;
  }
}
