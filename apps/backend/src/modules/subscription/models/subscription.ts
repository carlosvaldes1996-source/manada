import { model } from "@medusajs/framework/utils";

/**
 * Suscripción recurrente (D55) — el moat de recurrencia (DATABASE.md §9),
 * reabierto por D55 y construido POR CAPAS. Este modelo es el **Punto 1**:
 * la suscripción se crea al checkout con pago SIMULADO/manual (cero dinero).
 *
 * Mismo patrón que `pet` (D34) y `payment-method` (§10): extiende Medusa sin
 * tocar el core. La relación con Customer (y opcionalmente con Pet) vive en
 * **Module Links** (`src/links/customer-subscription.ts`, `src/links/pet-subscription.ts`),
 * no en columnas: joins nativos vía `query.graph`.
 *
 * Diseño escalable, sin trabajo muerto (DATABASE.md §9.3):
 * - `agreed_unit_price` es SNAPSHOT del precio pactado (CLP entero).
 * - `shipping_address` es SNAPSHOT (no FK): cambiar la dirección de la cuenta no
 *   reescribe entregas ya pactadas.
 * - `payment_method_id` referencia `saved_card` (§10). Se llena al tokenizar la
 *   tarjeta en la 1ª compra suscrita (D59); null solo en suscripciones legadas.
 *
 * Cobro recurrente real (D59, Modelo A de Flow):
 * - `status` gana estados de dunning: `past_due` (cobro falló, reintentando) y
 *   `unpaid` (terminal tras agotar reintentos — distinto de `cancelled`, que es
 *   decisión del usuario y sí permite otra narrativa/reactivación).
 * - `last_charged_at` / `failed_charge_count` / `last_charge_error` /
 *   `next_charge_attempt_at` son el estado mínimo del cobro: el scheduler decide a
 *   quién cobrar y el dunning cuándo reintentar. El LEDGER por período (auditoría +
 *   idempotencia fuerte) vive en el módulo `subscription-charge`, no aquí.
 */
const Subscription = model.define("subscription", {
  id: model.id({ prefix: "sub" }).primaryKey(),
  variant_id: model.text(),
  product_id: model.text(),
  quantity: model.number().default(1),
  frequency_weeks: model.number(),
  next_delivery_date: model.dateTime(),
  status: model.enum(["active", "paused", "cancelled", "past_due", "unpaid"]).default("active"),
  // Precio pactado (CLP entero), snapshot al crear. El backend nunca almacena un
  // segundo precio de catálogo (D23); este es el pactado con el cliente.
  agreed_unit_price: model.number(),
  currency_code: model.text().default("clp"),
  // Snapshot de la dirección de entrega (no puntero a customer_address).
  shipping_address: model.json().nullable(),
  // Ref a `saved_card.id` (§10): la tarjeta tokenizada contra la que cobra el
  // scheduler. Null solo en suscripciones legadas (creadas antes del cobro real).
  payment_method_id: model.text().nullable(),
  // Orden de checkout que originó la suscripción (trazabilidad).
  source_order_id: model.text().nullable(),
  // ── Estado del cobro recurrente (D59) ──────────────────────────────────────
  // Última vez que se cobró con éxito (ancla del ledger + del reloj de entregas).
  last_charged_at: model.dateTime().nullable(),
  // Cobros consecutivos fallidos (dunning). Se resetea a 0 en cada cobro exitoso.
  failed_charge_count: model.number().default(0),
  // Último error de cobro (mensaje de Flow) — para depurar y para el correo de fallo.
  last_charge_error: model.text().nullable(),
  // Cuándo reintentar el cobro tras un fallo (dunning). Null si no hay reintento pendiente.
  next_charge_attempt_at: model.dateTime().nullable(),
});

export default Subscription;
