import { model } from "@medusajs/framework/utils";

/**
 * Proyección del funnel de compra sobre el carrito (D75) — séptimo módulo custom
 * de Manada (patrón idéntico a `pet` D34, `subscription` D55 y `flow-payment` D58).
 *
 * ⚠️ ESTO NO ES UN ESPEJO DEL CARRITO. El Cart de Medusa sigue siendo el ÚNICO
 * dueño de qué hay dentro (líneas, precios, ajustes, direcciones) y nunca se
 * duplica aquí. Esta tabla guarda EXCLUSIVAMENTE hechos que cumplen una de tres
 * condiciones (FUNNEL_TRACKING_PROPOSAL §11.1):
 *
 *   (a) Medusa no los guarda en absoluto  → `visitor_id`, atribución, etapa.
 *   (b) Medusa los sobrescribe y nos importa el momento → los `*_at` de cada etapa.
 *   (c) Son llaves de consulta caras de calcular → los totales (los del carrito son
 *       columnas CALCULADAS, no almacenadas: no existe un `select total from cart`).
 *
 * Los campos de la categoría (c) son COPIAS y jamás son autoritativos: si discrepan
 * del carrito, gana el carrito y el proyector los corrige en la pasada siguiente.
 *
 * Una fila por carrito, escrita por UNA sola función idempotente
 * (`src/lib/cart-funnel-projection.ts`), disparada por subscribers — es decir,
 * SIEMPRE fuera del camino crítico del checkout. Nada de lo que ocurra aquí puede
 * romper una venta.
 */

/**
 * Eje de PROGRESO: estrictamente monótono (solo avanza). Que sea monótono es lo
 * que hace irrelevante el orden de llegada de los eventos (entrega at-least-once)
 * y lo que impide que una métrica histórica cambie de significado.
 *
 * El desenlace del pago (rechazado/anulado) es un eje DISTINTO y vive en
 * `last_payment_status`: un pago rechazado que luego se reintenta con éxito no es
 * "menos progreso", y mezclarlo aquí rompería el orden (§11.3).
 *
 * `abandoned` NO existe como estado almacenado: se deriva en lectura
 * (`stage != 'paid' AND last_activity_at < now() - interval`). Así la definición de
 * "abandonado" se cambia cambiando una consulta, no reprocesando la tabla.
 */
export const FUNNEL_STAGES = [
  "active", //           ≥1 producto en el carrito (nace aquí: la creación es perezosa)
  "identified", //       email fijado → llegó al formulario del checkout
  "checkout_started", // método de despacho elegido
  "payment_pending", //  existe un intento de pago → llegó a la pasarela
  "paid", //             carrito completado + orden creada
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

/** Orden del eje de progreso. Índice mayor = más avanzado. */
export const FUNNEL_STAGE_RANK: Record<FunnelStage, number> = {
  active: 0,
  identified: 1,
  checkout_started: 2,
  payment_pending: 3,
  paid: 4,
};

/**
 * Versión del proyector con la que se calculó la fila. Subir este número y
 * re-proyectar solo las filas por debajo es lo que hace BARATO agregar un campo
 * mañana: se añade la columna nullable, se sube la versión, y un job repasa lo
 * viejo con el MISMO proyector. Sin migraciones de datos a mano.
 */
export const CART_FUNNEL_PROJECTION_VERSION = 1;

const CartFunnel = model
  .define("cart_funnel", {
    id: model.id({ prefix: "cfun" }).primaryKey(),

    // ── Identidad ────────────────────────────────────────────────────────────
    /** Carrito proyectado. 1:1 — la llave de idempotencia de todo el módulo. */
    cart_id: model.text().unique(),
    /**
     * Identidad ANÓNIMA del dispositivo (categoría a). Es lo único de esta tabla
     * que Medusa no puede dar de ninguna forma, y lo único que se pierde para
     * siempre si no se captura en el momento. Lo emite `apps/web` y viaja en
     * `cart.metadata.manada_funnel` al crear el carrito.
     */
    visitor_id: model.text().index().nullable(),
    /** Copia de `cart.customer_id` como llave de filtro (categoría c). */
    customer_id: model.text().index().nullable(),
    /** Copia de `cart.email` como llave de filtro (categoría c). */
    email: model.text().index().nullable(),

    // ── Eje de PROGRESO ──────────────────────────────────────────────────────
    stage: model.enum([...FUNNEL_STAGES]).default("active").index(),
    /** Primer producto agregado. El "nacimiento" del funnel. */
    activated_at: model.dateTime().nullable(),
    /** Dejó su email (llegó al checkout). */
    identified_at: model.dateTime().nullable(),
    /** Eligió método de despacho. */
    checkout_started_at: model.dateTime().nullable(),
    /** Se creó un intento de pago (llegó a la pasarela). */
    payment_pending_at: model.dateTime().nullable(),
    /** Pago confirmado y orden creada. */
    paid_at: model.dateTime().nullable(),
    /**
     * Último movimiento real. NO es `cart.updated_at`: se verificó que
     * `addToCartWorkflow` no toca la fila `cart`, así que ese campo miente. El
     * proyector lo DERIVA del máximo de todos los timestamps involucrados
     * (incluido el `deleted_at` de las líneas eliminadas, única huella de que
     * alguien sacó un producto). Ver §12.4.
     */
    last_activity_at: model.dateTime().index(),

    // ── Eje de DESENLACE del pago ────────────────────────────────────────────
    /** Cuántos intentos de pago se crearon. ≥2 es, por sí solo, señal de fricción. */
    payment_attempts: model.number().default(0),
    /**
     * Estado del último intento. Deriva de `flow_payment` pero NO se acopla a
     * Flow: si mañana entra otra pasarela, se suma su lectura sin tocar el resto.
     */
    last_payment_status: model.text().nullable(),

    // ── Snapshot comercial (categoría c) ─────────────────────────────────────
    // Los totales del carrito en Medusa son `.computed()`, no columnas. Sin esta
    // foto, listar carritos abandonados por valor obliga a hidratar todas las
    // relaciones de cada carrito. Se guarda el DESGLOSE y no solo `total` porque
    // calcularlo cuesta lo mismo en la misma lectura, y pedirlo mañana sí costaría
    // una migración.
    /** Líneas distintas. */
    items_count: model.number().default(0),
    /** Unidades sumadas (≠ líneas: 3 sacos de un producto son 1 línea, 3 unidades). */
    units_count: model.number().default(0),
    subtotal: model.number().default(0),
    discount_total: model.number().default(0),
    shipping_total: model.number().default(0),
    total: model.number().default(0),
    currency_code: model.text().default("clp"),
    /** Alguna línea con `metadata.is_subscription` (D55). */
    has_subscription: model.boolean().default(false),
    /**
     * Códigos de promoción aplicados (p. ej. `ENVIO_GRATIS_30K`). `array()` y no
     * `json()` porque queda como `text[]` nativo: se filtra con operadores de
     * array en vez de extraer de un JSON en cada fila.
     */
    promo_codes: model.array().nullable(),

    // ── Conversión ───────────────────────────────────────────────────────────
    // El vínculo canónico carrito↔orden sigue siendo el link NATIVO `order_cart`.
    // Esto es la llave denormalizada para no hacer un join en cada consulta.
    order_id: model.text().index().nullable(),
    order_display_id: model.number().nullable(),
    converted_at: model.dateTime().nullable(),

    // ── Atribución (categoría a) ─────────────────────────────────────────────
    // Ocho columnas que se pierden para siempre si no se capturan en el momento.
    // Son las que evitan más migraciones: sin ellas no se puede responder "¿qué
    // campaña trae carritos que sí convierten?", la primera pregunta de cualquier
    // dashboard. Planas y no JSONB porque se filtran y agrupan constantemente.
    utm_source: model.text().index().nullable(),
    utm_medium: model.text().nullable(),
    utm_campaign: model.text().index().nullable(),
    utm_term: model.text().nullable(),
    utm_content: model.text().nullable(),
    referrer: model.text().nullable(),
    /** Primera página vista de la sesión que originó el carrito. */
    landing_path: model.text().nullable(),
    device_type: model.text().nullable(),

    // ── Contexto Manada (categoría a) ────────────────────────────────────────
    // El funnel de Manada empieza dando de alta una mascota. Poder segmentar
    // "dueños de cachorros que abandonaron" es el tipo de campaña que justifica
    // todo esto. Cuestan 2 columnas hoy y son irreconstruibles después.
    pet_species: model.text().nullable(),
    pet_stage: model.text().nullable(),

    // ── CRM / activación (categoría a) ───────────────────────────────────────
    // Nadie más es dueño de esto: es lo que NOSOTROS le hicimos al carrito.
    recovery_email_count: model.number().default(0),
    recovery_email_at: model.dateTime().nullable(),
    /** Convirtió DESPUÉS de un correo de recuperación → mide el ROI del programa. */
    recovered_at: model.dateTime().nullable(),

    // ── Extensión y housekeeping ─────────────────────────────────────────────
    /** Válvula de escape para la cola larga, sin migrar por cada idea nueva. */
    context: model.json().nullable(),
    projection_version: model.number().default(CART_FUNNEL_PROJECTION_VERSION),
    /** Cuándo corrió el proyector por última vez (hace visible la deriva). */
    projected_at: model.dateTime().nullable(),
  })
  .indexes([
    // El acceso más frecuente del backoffice y del CRM: "abandonados en la etapa X
    // sin actividad desde Y". Compuesto porque siempre se filtran juntos.
    { on: ["stage", "last_activity_at"] },
  ]);

export default CartFunnel;
