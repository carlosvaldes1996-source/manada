import crypto from "crypto";

/**
 * Cliente REST de Flow (D58) — pasarela de pago de Manada.
 * Doc oficial: https://developers.flow.cl/api
 *
 * Fuente única de la integración HTTP con Flow: firma HMAC-SHA256, `payment/create`
 * y `payment/getStatus`. Toda la config llega por variables de entorno (NUNCA
 * hardcodeada): `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_API_URL` (sandbox vs prod).
 *
 * Firma (Flow): se ordenan alfabéticamente TODOS los parámetros (excepto `s`), se
 * concatenan como `nombreValor` sin separadores y se firma con HMAC-SHA256 usando
 * la secretKey. El hash resultante viaja como parámetro `s`.
 */

export interface FlowConfig {
  apiKey: string;
  secretKey: string;
  /** Base sin slash final, p. ej. `https://sandbox.flow.cl/api` o `https://www.flow.cl/api`. */
  apiUrl: string;
}

/**
 * Lee y valida la config de Flow del entorno. Lanza si falta un secreto: sin
 * llaves no se puede firmar ni cobrar, así que es preferible fallar claro y
 * temprano (en el endpoint) que emitir una firma inválida.
 */
export function getFlowConfig(): FlowConfig {
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  const apiUrl = (process.env.FLOW_API_URL || "https://sandbox.flow.cl/api").replace(/\/+$/, "");
  if (!apiKey || !secretKey) {
    throw new Error(
      "[flow] Faltan FLOW_API_KEY / FLOW_SECRET_KEY. Configúralas en el entorno " +
        "(ver apps/backend/.env.template).",
    );
  }
  return { apiKey, secretKey, apiUrl };
}

/** ¿Está Flow configurado? (sin lanzar — útil para health checks / logs). */
export function isFlowConfigured(): boolean {
  return Boolean(process.env.FLOW_API_KEY && process.env.FLOW_SECRET_KEY);
}

/** Todo valor que viaja a Flow se serializa a string (Flow firma sobre strings). */
type FlowParams = Record<string, string | number>;

/**
 * Firma HMAC-SHA256 sobre los parámetros (excluye `s`): orden alfabético por
 * nombre + concatenación `nombreValor` sin separadores. Devuelve el hash hex.
 */
export function signParams(params: FlowParams, secretKey: string): string {
  const toSign = Object.keys(params)
    .filter((k) => k !== "s")
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("");
  return crypto.createHmac("sha256", secretKey).update(toSign).digest("hex");
}

/** Serializa a `application/x-www-form-urlencoded` (con la firma incluida). */
function toFormBody(params: FlowParams, secretKey: string): string {
  const signed = { ...params, s: signParams(params, secretKey) };
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(signed)) usp.append(k, String(v));
  return usp.toString();
}

/** Construye la query string firmada (para GET). */
function toSignedQuery(params: FlowParams, secretKey: string): string {
  const signed = { ...params, s: signParams(params, secretKey) };
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(signed)) usp.append(k, String(v));
  return usp.toString();
}

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
  /** JSON con datos extra (p. ej. `{ rut }`). */
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

  const res = await fetch(`${config.apiUrl}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: toFormBody(params, config.secretKey),
  });

  const data = (await res.json().catch(() => ({}))) as {
    token?: string;
    url?: string;
    flowOrder?: number;
    message?: string;
    code?: number;
  };

  if (!res.ok || !data.token || !data.url) {
    throw new Error(
      `[flow] payment/create falló (${res.status}): ${data.message ?? JSON.stringify(data)}`,
    );
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

/**
 * `GET payment/getStatus` — fuente de verdad del pago. NUNCA se asume que un pago
 * fue exitoso porque el usuario volvió al sitio: se consulta aquí con el token
 * que Flow envió en el callback.
 */
export async function getFlowStatus(
  token: string,
  config: FlowConfig,
): Promise<FlowStatusResult> {
  const params: FlowParams = { apiKey: config.apiKey, token };
  const query = toSignedQuery(params, config.secretKey);

  const res = await fetch(`${config.apiUrl}/payment/getStatus?${query}`, { method: "GET" });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    status?: number;
    commerceOrder?: string;
    flowOrder?: number;
    amount?: number;
    message?: string;
  };

  if (!res.ok || typeof data.status !== "number") {
    throw new Error(
      `[flow] payment/getStatus falló (${res.status}): ${data.message ?? JSON.stringify(data)}`,
    );
  }

  return {
    status: data.status,
    commerceOrder: String(data.commerceOrder ?? ""),
    flowOrder: data.flowOrder,
    amount: typeof data.amount === "number" ? data.amount : Number(data.amount) || undefined,
    paymentData: (data.paymentData as Record<string, unknown>) ?? undefined,
    raw: data,
  };
}
