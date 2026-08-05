/**
 * Contexto de funnel del navegador (D75 · Etapa 2) — identidad anónima y atribución.
 *
 * Es la ÚNICA pieza del diagnóstico que Medusa no puede dar de ninguna forma: un
 * invitado que agrega al carrito y se va deja hoy una fila con `customer_id = NULL`
 * y `email = NULL`, sin ningún identificador. Todo lo demás del funnel ya está
 * persistido en la base y solo hacía falta consultarlo.
 *
 * Cómo viaja al backend: se adjunta como `metadata.manada_funnel` en el `POST
 * /store/carts` que la app YA hace (el validador nativo acepta `metadata`, así que
 * esta etapa no necesita ningún cambio de backend ni endpoint nuevo). El backend lo
 * lee en el proyector y jamás lo trata como autorización — es dato analítico.
 *
 * Dos horizontes distintos, a propósito:
 *  · `visitor_id` en **localStorage**: identidad persistente del dispositivo, para
 *    reconocer al mismo visitante entre sesiones y unificar dispositivos cuando
 *    inicie sesión.
 *  · Atribución en **sessionStorage**: de qué campaña vino ESTA visita. Se captura
 *    en la primera página de la sesión, que es la única oportunidad de verla.
 *
 * Privacidad: `visitor_id` es un UUID aleatorio sin ningún dato personal, propio y
 * de primera parte (no es una cookie de terceros ni permite rastreo cruzado entre
 * sitios). Requiere reflejarlo en la política de privacidad antes de encender.
 */

const VISITOR_ID_KEY = "manada_visitor_id";
const ATTRIBUTION_KEY = "manada_funnel_attribution";

/** Forma del contexto que consume el proyector del backend. */
export interface FunnelContext {
  visitor_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_path?: string;
  device_type?: string;
  pet_species?: string;
  pet_stage?: string;
}

/** UUID v4 con fallback: `crypto.randomUUID` no existe en contextos no seguros. */
function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Acceso a storage tolerante a fallos (modo privado de Safari, cuota llena…). */
function readStore(store: "local" | "session", key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (store === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function writeStore(store: "local" | "session", key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    (store === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    // Sin storage no hay tracking, pero la tienda sigue funcionando igual.
  }
}

/**
 * Identidad anónima del dispositivo. Se crea la primera vez que se pide y persiste
 * indefinidamente. Devuelve `null` en SSR.
 */
export function getVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  const existing = readStore("local", VISITOR_ID_KEY);
  if (existing) return existing;
  const created = newId();
  writeStore("local", VISITOR_ID_KEY, created);
  return created;
}

/** Clasificación gruesa del dispositivo (sin parsear user-agent). */
function deviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/**
 * Captura la atribución de ESTA sesión. Idempotente: la primera captura gana, así
 * que navegar dentro del sitio no pisa la campaña de origen con un referrer interno.
 *
 * Se llama una vez al montar la app; es barato y no hace ninguna petición.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  if (readStore("session", ATTRIBUTION_KEY)) return;

  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer || "";
  // Un referrer del propio sitio no es atribución: significa navegación interna.
  const isExternalReferrer = referrer !== "" && !referrer.startsWith(window.location.origin);

  const attribution: FunnelContext = {
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
    utm_term: params.get("utm_term") ?? undefined,
    utm_content: params.get("utm_content") ?? undefined,
    referrer: isExternalReferrer ? referrer : undefined,
    landing_path: window.location.pathname,
    device_type: deviceType(),
  };

  writeStore("session", ATTRIBUTION_KEY, JSON.stringify(attribution));
}

/**
 * Adjunta la mascota del funnel al contexto de la sesión. La recomendación es el
 * momento donde la especie y la etapa ya se conocen, y es lo que permite segmentar
 * después ("dueños de cachorros que abandonaron"). Es irreconstruible más tarde.
 */
export function setFunnelPetContext(species?: string, stage?: string): void {
  if (typeof window === "undefined") return;
  const current = readAttribution();
  writeStore(
    "session",
    ATTRIBUTION_KEY,
    JSON.stringify({ ...current, pet_species: species, pet_stage: stage }),
  );
}

function readAttribution(): FunnelContext {
  const raw = readStore("session", ATTRIBUTION_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as FunnelContext;
  } catch {
    return {};
  }
}

/**
 * Contexto completo para adjuntar al crear el carrito. Se limpian las claves
 * `undefined` para no mandar ruido en la metadata (que además viaja a la orden).
 */
export function getFunnelContext(): FunnelContext {
  if (typeof window === "undefined") return {};
  captureAttribution();

  const context: FunnelContext = {
    visitor_id: getVisitorId() ?? undefined,
    ...readAttribution(),
  };

  return Object.fromEntries(
    Object.entries(context).filter(([, v]) => v !== undefined && v !== ""),
  ) as FunnelContext;
}
