import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { CART_FUNNEL_MODULE } from "../modules/cart-funnel";
import type CartFunnelModuleService from "../modules/cart-funnel/service";
import {
  CART_FUNNEL_PROJECTION_VERSION,
  FUNNEL_STAGE_RANK,
  type FunnelStage,
} from "../modules/cart-funnel/models/cart-funnel";
import { FLOW_PAYMENT_MODULE } from "../modules/flow-payment";
import type FlowPaymentModuleService from "../modules/flow-payment/service";

/**
 * PROYECTOR del funnel de compra (D75) — el punto arquitectónico único donde se
 * mantienen `stage` y `last_activity_at`.
 *
 * Los subscribers son solo el DISPARADOR; la arquitectura es esta función. La
 * diferencia importa porque de ella salen tres propiedades que no se consiguen
 * escribiendo la lógica dentro de un subscriber:
 *
 *  1. **Deriva, no acumula.** No interpreta el evento (que además solo trae `{id}`):
 *     LEE el carrito completo y recalcula la fila entera. Procesar el mismo evento
 *     tres veces da el mismo resultado → inmune a la entrega *at-least-once* del
 *     bus de Redis.
 *  2. **Se auto-repara.** Como cada pasada recalcula todo desde cero, un evento
 *     perdido lo corrige el siguiente. No hay deriva acumulativa posible.
 *  3. **Un solo código para vivo y para histórico.** El backfill y cualquier job de
 *     reparación llaman a esta misma función, así que no existe una segunda
 *     implementación que se desincronice de la primera.
 *
 * Nunca corre dentro de la transacción del checkout: los eventos de Medusa se
 * emiten solo cuando el workflow terminó con éxito (transactional outbox nativo),
 * y los subscribers son asíncronos. Un fallo aquí no puede romper una venta.
 *
 * Contrato con el Cart: el carrito es el ÚNICO dueño de qué hay dentro. Aquí no se
 * copia ni una línea. Lo que se guarda son hechos que Medusa no tiene, momentos que
 * Medusa sobrescribe, y llaves de consulta cuyo cálculo es caro.
 */

/** Namespace propio dentro de `cart.metadata` (no colisiona con el `rut` del checkout). */
export const FUNNEL_METADATA_KEY = "manada_funnel";

export interface ProjectCartFunnelOptions {
  /**
   * Momento en que se observó la actividad. **En vivo** se pasa `new Date()` y
   * `last_activity_at` queda preciso al segundo. **En backfill se OMITE**, y
   * entonces el valor se deriva solo de los datos.
   *
   * Esta distinción es la razón de ser del parámetro: estampar `Date.now()` en el
   * backfill marcaría todos los carritos históricos con la fecha de hoy y
   * destruiría justo el dato que queremos recuperar (§12.4 de la propuesta).
   */
  observedAt?: Date;
  /** Orden ya conocida por el disparador (`order.placed`), para ahorrar una lectura. */
  orderIdHint?: string;
}

// ── Tipos laxos (mismo criterio que flow-settle.ts: no acoplar a HttpTypes) ────

type QueryFn = {
  graph: (config: {
    entity: string;
    fields: string[];
    filters?: Record<string, unknown>;
  }) => Promise<{ data: Record<string, unknown>[] }>;
};

interface CartGraph {
  id: string;
  email?: string | null;
  customer_id?: string | null;
  currency_code?: string | null;
  completed_at?: string | Date | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  metadata?: Record<string, unknown> | null;
  subtotal?: unknown;
  discount_total?: unknown;
  shipping_total?: unknown;
  total?: unknown;
  items?: {
    id: string;
    quantity?: number | null;
    metadata?: Record<string, unknown> | null;
    adjustments?: { promotion_id?: string | null; code?: string | null }[] | null;
  }[];
  shipping_methods?: { id: string; created_at?: string | Date | null; updated_at?: string | Date | null }[];
  promotions?: { code?: string | null }[];
  order?: { id?: string | null; display_id?: number | null } | null;
}

interface LineItemRow {
  quantity?: number | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  deleted_at?: string | Date | null;
  metadata?: Record<string, unknown> | null;
}

interface FlowPaymentRow {
  status?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  order_id?: string | null;
}

/** Contexto de funnel que `apps/web` deja en `cart.metadata.manada_funnel`. */
interface FunnelMetadata {
  visitor_id?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_term?: unknown;
  utm_content?: unknown;
  referrer?: unknown;
  landing_path?: unknown;
  device_type?: unknown;
  pet_species?: unknown;
  pet_stage?: unknown;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fecha robusta (los timestamps llegan como string o Date según el origen). */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Máximo de fechas ignorando nulos. */
function maxDate(...values: (Date | null | undefined)[]): Date | null {
  let best: Date | null = null;
  for (const v of values) {
    if (v && (!best || v.getTime() > best.getTime())) best = v;
  }
  return best;
}

/** Mínimo de fechas ignorando nulos. */
function minDate(...values: (Date | null | undefined)[]): Date | null {
  let best: Date | null = null;
  for (const v of values) {
    if (v && (!best || v.getTime() < best.getTime())) best = v;
  }
  return best;
}

/**
 * Entero CLP robusto. Los totales del carrito son `bigNumber().computed()`, que
 * según el camino de lectura llegan como number, string o `{ value }`.
 */
function toInt(value: unknown): number {
  if (typeof value === "number") return Math.round(value);
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
  if (value && typeof value === "object") {
    const inner = (value as { value?: unknown; numeric?: unknown }).numeric ??
      (value as { value?: unknown }).value;
    if (inner !== undefined && inner !== value) return toInt(inner);
  }
  return 0;
}

/** Texto saneado para columnas de atribución (evita basura y filas gigantes). */
function toText(value: unknown, maxLength = 255): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

/** Primer valor no nulo (para "el primero que llega gana" en campos de atribución). */
function firstNonNull<T>(existing: T | null | undefined, incoming: T | null | undefined): T | null {
  return (existing ?? incoming ?? null) as T | null;
}

// ── El proyector ──────────────────────────────────────────────────────────────

/**
 * Recalcula la fila de funnel de un carrito. Idempotente y seguro de repetir.
 * Devuelve `null` si el carrito ya no existe (nada que proyectar).
 */
export async function projectCartFunnel(
  container: MedusaContainer,
  cartId: string,
  options: ProjectCartFunnelOptions = {},
): Promise<{ stage: FunnelStage } | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as QueryFn;
  const funnelService = container.resolve<CartFunnelModuleService>(CART_FUNNEL_MODULE);

  // (1) El carrito, con las relaciones necesarias para que los totales sean REALES.
  //     Medusa calcula `total` a partir de las relaciones CARGADAS: pedir de menos
  //     devuelve un total silenciosamente incorrecto. Es exactamente la causa raíz
  //     del cobro de $3.990 sobre $29.500 de D73 — aquí solo ensuciaría un reporte,
  //     pero el error sería el mismo, así que se cargan igual de completas.
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "customer_id",
      "currency_code",
      "completed_at",
      "created_at",
      "updated_at",
      "metadata",
      "subtotal",
      "discount_total",
      "shipping_total",
      "total",
      // `items.*` COMPLETO y no una selección: sin `unit_price` cargado, Medusa
      // calcula el subtotal de productos como 0 y `total` queda = solo el envío.
      // Se comprobó en local: pedir `items.id`/`items.quantity` daba subtotal 3990
      // (el despacho) en carritos con producto. Es la MISMA causa raíz del cobro
      // de $3.990 sobre $29.500 de D73, y vuelve a aparecer en cuanto se recorta
      // la selección de campos. Aquí solo ensuciaría un reporte, pero es el mismo
      // error, así que se carga igual de completo que en la ruta de pago.
      "items.*",
      "items.adjustments.*",
      "items.tax_lines.*",
      "shipping_methods.*",
      "shipping_methods.adjustments.*",
      "shipping_methods.tax_lines.*",
      "promotions.code",
      "order.id",
      "order.display_id",
    ],
    filters: { id: cartId },
  });
  const cart = carts?.[0] as unknown as CartGraph | undefined;
  if (!cart) return null;

  // (2) TODAS las líneas, incluidas las eliminadas. Quitar un producto es un soft
  //     delete y NO toca la fila `cart`, así que el `deleted_at` de la línea es la
  //     única huella de esa actividad — imprescindible para `last_activity_at`.
  const cartModule = container.resolve(Modules.CART) as {
    listLineItems: (
      filters: Record<string, unknown>,
      config?: Record<string, unknown>,
    ) => Promise<LineItemRow[]>;
  };
  let allItems: LineItemRow[] = [];
  try {
    allItems = await cartModule.listLineItems({ cart_id: cartId }, { withDeleted: true });
  } catch {
    // Si el módulo cambiara de forma, el proyector degrada en vez de romperse: se
    // pierde precisión en `last_activity_at`, no la proyección entera.
    allItems = [];
  }

  // (3) Intentos de pago (D58). Se lee `flow_payment` sin acoplarse a Flow: si
  //     mañana entra otra pasarela, se suma su lectura y el resto no cambia.
  const flowService = container.resolve<FlowPaymentModuleService>(FLOW_PAYMENT_MODULE);
  let payments: FlowPaymentRow[] = [];
  try {
    payments = (await flowService.listFlowPayments({ cart_id: cartId })) as FlowPaymentRow[];
  } catch {
    payments = [];
  }

  // ── Derivaciones ────────────────────────────────────────────────────────────

  const cartCreatedAt = toDate(cart.created_at);
  const cartUpdatedAt = toDate(cart.updated_at);
  const completedAt = toDate(cart.completed_at);

  const liveItems = cart.items ?? [];
  const itemsCount = liveItems.length;
  const unitsCount = liveItems.reduce((sum, it) => sum + (it.quantity ?? 0), 0);
  const hasSubscription = liveItems.some((it) => Boolean(it.metadata?.is_subscription));

  const shippingMethods = cart.shipping_methods ?? [];
  const sortedPayments = [...payments].sort(
    (a, b) => (toDate(a.created_at)?.getTime() ?? 0) - (toDate(b.created_at)?.getTime() ?? 0),
  );
  const lastPayment = sortedPayments[sortedPayments.length - 1];

  // Etapa alcanzada (eje de PROGRESO, monótono). El desenlace del pago —rechazado o
  // anulado— NO vive aquí: es ortogonal y va en `last_payment_status`.
  let derivedStage: FunnelStage = "active";
  if (cart.email) derivedStage = "identified";
  if (shippingMethods.length > 0) derivedStage = "checkout_started";
  if (sortedPayments.length > 0) derivedStage = "payment_pending";
  if (completedAt) derivedStage = "paid";

  // Momentos de cruce. Casi todos son EXACTOS porque el dato ya está en la BD:
  //  · activated_at        = la línea más antigua (incluidas las eliminadas)
  //  · checkout_started_at = el método de despacho más antiguo
  //  · payment_pending_at  = el primer intento de pago
  //  · paid_at             = completed_at del carrito
  // La única aproximación es `identified_at`: Medusa no guarda cuándo se fijó el
  // email, así que en vivo se usa el momento observado y en backfill `updated_at`
  // del carrito, que es la mejor cota disponible. Queda declarado, no disimulado.
  const firstItemAt = minDate(...allItems.map((it) => toDate(it.created_at)));
  const activatedAt = allItems.length > 0 ? (firstItemAt ?? cartCreatedAt) : null;
  const checkoutStartedAt = minDate(...shippingMethods.map((sm) => toDate(sm.created_at)));
  const paymentPendingAt = minDate(...sortedPayments.map((p) => toDate(p.created_at)));

  // `last_activity_at` DERIVADO: el máximo de todo lo que dejó huella. Incluye el
  // `deleted_at` de las líneas quitadas. `observedAt` solo existe en vivo.
  const derivedActivity = maxDate(
    cartCreatedAt,
    cartUpdatedAt,
    completedAt,
    ...allItems.flatMap((it) => [toDate(it.created_at), toDate(it.updated_at), toDate(it.deleted_at)]),
    ...shippingMethods.flatMap((sm) => [toDate(sm.created_at), toDate(sm.updated_at)]),
    ...sortedPayments.flatMap((p) => [toDate(p.created_at), toDate(p.updated_at)]),
    options.observedAt ?? null,
  );

  // Contexto que `apps/web` dejó al crear el carrito (identidad anónima + atribución).
  const meta = (cart.metadata?.[FUNNEL_METADATA_KEY] ?? {}) as FunnelMetadata;

  const promoCodes = [
    ...new Set(
      (cart.promotions ?? [])
        .map((p) => toText(p.code, 64))
        .filter((c): c is string => Boolean(c)),
    ),
  ];

  const orderId = options.orderIdHint ?? cart.order?.id ?? lastPayment?.order_id ?? null;

  // ── Escritura idempotente ───────────────────────────────────────────────────

  const existingRows = await funnelService.listCartFunnels({ cart_id: cartId });
  const existing = existingRows[0] as (Record<string, unknown> & { id: string }) | undefined;

  // El progreso NUNCA retrocede: así el orden de llegada de los eventos es
  // irrelevante y una métrica histórica no cambia de significado.
  const previousStage = (existing?.stage as FunnelStage | undefined) ?? null;
  const stage: FunnelStage =
    previousStage && FUNNEL_STAGE_RANK[previousStage] > FUNNEL_STAGE_RANK[derivedStage]
      ? previousStage
      : derivedStage;

  // Cada marca de tiempo se fija UNA vez (gana el primer cruce observado).
  const keepEarliest = (field: string, derived: Date | null): Date | null =>
    toDate(existing?.[field]) ?? derived;

  const identifiedAt = cart.email
    ? (toDate(existing?.identified_at) ?? options.observedAt ?? cartUpdatedAt)
    : null;

  const lastActivityAt =
    maxDate(toDate(existing?.last_activity_at), derivedActivity) ?? new Date();

  // Convirtió DESPUÉS de un correo de recuperación → mide el ROI del programa de
  // remarketing, no solo si el correo salió.
  const recoveryEmailAt = toDate(existing?.recovery_email_at);
  const recoveredAt =
    toDate(existing?.recovered_at) ??
    (completedAt && recoveryEmailAt && completedAt.getTime() > recoveryEmailAt.getTime()
      ? completedAt
      : null);

  const payload = {
    cart_id: cartId,

    // Identidad. La atribución es "el primero que llega gana": una lectura
    // posterior sin metadata no puede borrar lo que ya se capturó.
    visitor_id: firstNonNull(toText(existing?.visitor_id), toText(meta.visitor_id, 64)),
    customer_id: cart.customer_id ?? null,
    email: cart.email ?? null,

    // Progreso.
    stage,
    activated_at: keepEarliest("activated_at", activatedAt),
    identified_at: identifiedAt,
    checkout_started_at: keepEarliest("checkout_started_at", checkoutStartedAt),
    payment_pending_at: keepEarliest("payment_pending_at", paymentPendingAt),
    paid_at: keepEarliest("paid_at", completedAt),
    last_activity_at: lastActivityAt,

    // Desenlace del pago.
    payment_attempts: sortedPayments.length,
    last_payment_status: toText(lastPayment?.status, 32),

    // Snapshot comercial (categoría c: los totales del carrito no son columnas).
    items_count: itemsCount,
    units_count: unitsCount,
    subtotal: toInt(cart.subtotal),
    discount_total: toInt(cart.discount_total),
    shipping_total: toInt(cart.shipping_total),
    total: toInt(cart.total),
    currency_code: (cart.currency_code ?? "clp").toLowerCase(),
    has_subscription: hasSubscription,
    promo_codes: promoCodes.length > 0 ? promoCodes : null,

    // Conversión.
    order_id: orderId,
    order_display_id: cart.order?.display_id ?? null,
    converted_at: keepEarliest("converted_at", completedAt),

    // Atribución.
    utm_source: firstNonNull(toText(existing?.utm_source), toText(meta.utm_source, 128)),
    utm_medium: firstNonNull(toText(existing?.utm_medium), toText(meta.utm_medium, 128)),
    utm_campaign: firstNonNull(toText(existing?.utm_campaign), toText(meta.utm_campaign, 128)),
    utm_term: firstNonNull(toText(existing?.utm_term), toText(meta.utm_term, 128)),
    utm_content: firstNonNull(toText(existing?.utm_content), toText(meta.utm_content, 128)),
    referrer: firstNonNull(toText(existing?.referrer), toText(meta.referrer, 512)),
    landing_path: firstNonNull(toText(existing?.landing_path), toText(meta.landing_path, 512)),
    device_type: firstNonNull(toText(existing?.device_type), toText(meta.device_type, 32)),

    // Contexto Manada.
    pet_species: firstNonNull(toText(existing?.pet_species), toText(meta.pet_species, 32)),
    pet_stage: firstNonNull(toText(existing?.pet_stage), toText(meta.pet_stage, 32)),

    // CRM: el proyector NO toca los contadores de envío (los posee el job de
    // recuperación); solo deriva si la conversión ocurrió después del correo.
    recovered_at: recoveredAt,

    projection_version: CART_FUNNEL_PROJECTION_VERSION,
    projected_at: new Date(),
  };

  if (existing) {
    await funnelService.updateCartFunnels({ id: existing.id, ...payload });
  } else {
    try {
      await funnelService.createCartFunnels(payload);
    } catch (e) {
      // Dos proyecciones concurrentes del mismo carrito pueden intentar crear la
      // fila a la vez; `cart_id` es único, así que la perdedora reintenta como
      // update. Es la única carrera posible y se resuelve sin lock.
      const retry = await funnelService.listCartFunnels({ cart_id: cartId });
      if (retry[0]) await funnelService.updateCartFunnels({ id: retry[0].id, ...payload });
      else throw e;
    }
  }

  return { stage };
}

/**
 * Envoltorio para disparadores: proyecta y NUNCA lanza.
 *
 * El tracking jamás puede tumbar una operación de negocio. Los subscribers usan
 * esta variante; el backfill usa `projectCartFunnel` directo porque ahí sí
 * queremos ver los fallos.
 */
export async function projectCartFunnelSafely(
  container: MedusaContainer,
  cartId: string,
  options: ProjectCartFunnelOptions = {},
): Promise<void> {
  try {
    await projectCartFunnel(container, cartId, options);
  } catch (e) {
    console.warn(`[funnel] No se pudo proyectar el carrito ${cartId}:`, e);
  }
}
