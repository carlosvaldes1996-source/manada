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
 * - `payment_method_id` nace nullable: el Bloque 4 (pago real) lo llena contra
 *   `saved_card`/Mercado Pago SIN migración.
 * - `status` acota a 3 estados hoy; los estados de fallo se anexan al enum en el
 *   Bloque 5, no antes.
 */
const Subscription = model.define("subscription", {
  id: model.id({ prefix: "sub" }).primaryKey(),
  variant_id: model.text(),
  product_id: model.text(),
  quantity: model.number().default(1),
  frequency_weeks: model.number(),
  next_delivery_date: model.dateTime(),
  status: model.enum(["active", "paused", "cancelled"]).default("active"),
  // Precio pactado (CLP entero), snapshot al crear. El backend nunca almacena un
  // segundo precio de catálogo (D23); este es el pactado con el cliente.
  agreed_unit_price: model.number(),
  currency_code: model.text().default("clp"),
  // Snapshot de la dirección de entrega (no puntero a customer_address).
  shipping_address: model.json().nullable(),
  // Ref a `saved_card.id` (§10). Null en el Punto 1 (pago manual).
  payment_method_id: model.text().nullable(),
  // Orden de checkout que originó la suscripción (trazabilidad).
  source_order_id: model.text().nullable(),
});

export default Subscription;
