import crypto from "crypto";

/**
 * Transporte HTTP de Flow — capa BAJA de la integración (D70).
 * Doc oficial: https://developers.flow.cl/api (spec: `es-openApiFlow.yaml`).
 *
 * Único dueño de: configuración por entorno, firma HMAC-SHA256, ejecución de la
 * petición, normalización del error y política de reintentos. Los bindings por
 * servicio (`payments.ts`, `customers.ts`) viven encima y NO vuelven a hablar
 * `fetch`: solo declaran endpoint + parámetros + forma de la respuesta.
 *
 * Firma (doc §"¿Cómo firmar con su SecretKey?"): se ordenan alfabéticamente
 * ascendente TODOS los parámetros menos `s`, se concatenan como `nombreValor`
 * sin separadores y se firma con HMAC-SHA256 usando la secretKey. El hash hex
 * viaja en el parámetro `s`.
 *
 * ⚠️ Los parámetros de una petición contienen la `apiKey` del comercio: NUNCA se
 * loguean ni se adjuntan a un error. Solo se propaga la respuesta de Flow.
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
export type FlowParams = Record<string, string | number>;

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

/** Serializa los parámetros firmados a `application/x-www-form-urlencoded`. */
function toSignedForm(params: FlowParams, secretKey: string): string {
  const signed = { ...params, s: signParams(params, secretKey) };
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(signed)) usp.append(k, String(v));
  return usp.toString();
}

/**
 * Error de la API de Flow. Flow responde `400` (error del API) y `401` (error de
 * negocio) con el objeto `Error` `{ code, message }` — ambos son DETERMINISTAS:
 * reintentarlos da el mismo resultado, así que nunca se reintentan.
 *
 * Nunca transporta los parámetros de la petición (llevan la `apiKey`).
 */
export class FlowApiError extends Error {
  /** Endpoint relativo, p. ej. `customer/create`. */
  readonly endpoint: string;
  /** Código HTTP de la respuesta (0 si la petición nunca llegó a completarse). */
  readonly httpStatus: number;
  /** Campo `code` del objeto Error de Flow, si vino. */
  readonly code?: number;

  constructor(args: { endpoint: string; httpStatus: number; code?: number; message: string }) {
    super(`[flow] ${args.endpoint} falló (${args.httpStatus}): ${args.message}`);
    this.name = "FlowApiError";
    this.endpoint = args.endpoint;
    this.httpStatus = args.httpStatus;
    this.code = args.code;
  }
}

export interface FlowRequestOptions {
  /**
   * Reintentar ante fallo TRANSITORIO (error de red, 429, 5xx). Solo debe activarse
   * en operaciones cuya repetición es inocua: lecturas (`GET`) y escrituras que
   * convergen al mismo estado (`customer/edit`).
   *
   * NUNCA en `customer/create` (duplicaría clientes en Flow) ni en `customer/charge`
   * (duplicaría cobros): ahí un timeout es ambiguo y se resuelve consultando, no
   * repitiendo.
   */
  retry?: boolean;
  /** Timeout por intento. Por defecto 20 s. */
  timeoutMs?: number;
}

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [300, 900];
const DEFAULT_TIMEOUT_MS = 20_000;

/** Un fallo transitorio merece reintento; un 400/401 de Flow no (es determinista). */
function isTransient(httpStatus: number): boolean {
  return httpStatus === 0 || httpStatus === 429 || httpStatus >= 500;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Ejecuta UNA petición firmada contra Flow y devuelve el JSON tipado.
 *
 * `GET` firma sobre la query string; `POST` sobre el cuerpo form-urlencoded — en
 * ambos casos con el mismo algoritmo. Ante `400`/`401` lanza `FlowApiError` con el
 * `code`/`message` de Flow (sin filtrar la petición).
 */
async function request<T>(
  method: "GET" | "POST",
  endpoint: string,
  params: FlowParams,
  config: FlowConfig,
  options: FlowRequestOptions = {},
): Promise<T> {
  const { retry = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const body = toSignedForm(params, config.secretKey);
  const url = method === "GET" ? `${config.apiUrl}/${endpoint}?${body}` : `${config.apiUrl}/${endpoint}`;

  let lastError: FlowApiError | undefined;

  for (let attempt = 1; attempt <= (retry ? MAX_ATTEMPTS : 1); attempt++) {
    let httpStatus = 0;
    let data: Record<string, unknown> = {};

    try {
      const res = await fetch(url, {
        method,
        headers:
          method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined,
        body: method === "POST" ? body : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
      httpStatus = res.status;
      data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (res.ok) return data as T;

      lastError = new FlowApiError({
        endpoint,
        httpStatus,
        code: typeof data.code === "number" ? data.code : undefined,
        message: typeof data.message === "string" ? data.message : JSON.stringify(data),
      });
    } catch (e) {
      // Error de red / timeout: la petición pudo o no llegar a Flow. httpStatus 0.
      lastError = new FlowApiError({
        endpoint,
        httpStatus: 0,
        message: e instanceof Error ? e.message : String(e),
      });
    }

    const willRetry = retry && attempt < MAX_ATTEMPTS && isTransient(lastError.httpStatus);
    if (!willRetry) break;

    console.warn(
      `[flow] ${endpoint}: fallo transitorio (${lastError.httpStatus}), ` +
        `reintento ${attempt + 1}/${MAX_ATTEMPTS}`,
    );
    await sleep(BACKOFF_MS[attempt - 1] ?? 900);
  }

  throw lastError;
}

/** `GET` firmado (la firma viaja en la query string). */
export function flowGet<T>(
  endpoint: string,
  params: FlowParams,
  config: FlowConfig,
  options?: FlowRequestOptions,
): Promise<T> {
  return request<T>("GET", endpoint, params, config, options);
}

/** `POST` firmado (la firma viaja en el cuerpo form-urlencoded). */
export function flowPost<T>(
  endpoint: string,
  params: FlowParams,
  config: FlowConfig,
  options?: FlowRequestOptions,
): Promise<T> {
  return request<T>("POST", endpoint, params, config, options);
}

/**
 * Traduce un fallo de Flow a un mensaje ACCIONABLE para el comprador.
 *
 * Los errores de Flow llegan en inglés y con jerga de su API (`The userEmail: x@y.cl
 * is not valid.`). Mostrados en crudo no dicen nada; ocultos tras un 500 genérico
 * dicen menos todavía —y hacen que un dato mal escrito parezca una caída del sistema.
 * Aquí se mapean los fallos que el usuario PUEDE resolver; el resto cae a un mensaje
 * neutro y el detalle técnico queda en los logs del servidor.
 */
export function flowErrorMessage(error: unknown): string {
  const raw = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();

  // Flow valida el correo del comprador (rechaza dominios inexistentes, típico de
  // los correos de prueba). Es el fallo más frecuente y el más fácil de corregir.
  if (raw.includes("useremail") || (raw.includes("email") && raw.includes("not valid"))) {
    return (
      "El correo que ingresaste no es válido para el pago. Revísalo y usa una " +
      "dirección real: la usamos para enviarte el comprobante."
    );
  }
  if (raw.includes("amount")) {
    return "El monto del pedido no pudo procesarse. Vuelve al carrito y reintenta.";
  }
  if (raw.includes("commerceorder")) {
    return "Ya hay un intento de pago en curso para este pedido. Espera un momento y reintenta.";
  }
  return "No pudimos iniciar el pago. Revisa tus datos e inténtalo de nuevo en un momento.";
}
