import { model } from "@medusajs/framework/utils";

/**
 * Intento de cobro recurrente de una suscripción (D59) — LEDGER de renovaciones.
 * Quinto módulo custom de Manada (patrón idéntico a `flow_payment` D58): extiende
 * Medusa sin tocar el core.
 *
 * Es el eje de la IDEMPOTENCIA del scheduler y la auditoría del dinero recurrente
 * (espejo de `flow_payment`, pero para cobros server-to-server con `customer/charge`):
 *
 * - **Una fila por PERÍODO** (`subscription_id` + `period_key`): el período es la
 *   fecha de entrega pactada (`next_delivery_date`), que solo avanza tras un cobro
 *   exitoso. Si el job corre dos veces para el mismo período, encuentra esta fila y
 *   NO vuelve a cobrar → nunca hay doble cobro ni doble orden.
 * - `status = paid` es el mutex: cobrado. Si además hay `order_id`, la renovación
 *   quedó completa. `paid` sin `order_id` = cobrado pero la orden aún no se creó
 *   (fallo transitorio) → el siguiente barrido reintenta SOLO la creación de la
 *   orden, sin volver a cobrar (auto-sanación).
 * - `commerce_order` es la referencia del ÚLTIMO intento enviada a Flow (única por
 *   intento: Flow rechaza `commerceOrder` repetidos). `attempt` cuenta los intentos
 *   del período (dunning); `raw_status` guarda el entero de Flow (1..4).
 */
const SubscriptionCharge = model.define("subscription_charge", {
  id: model.id({ prefix: "subchg" }).primaryKey(),
  // Suscripción cobrada (ref plana; el dueño real vive en el módulo subscription).
  subscription_id: model.text().index(),
  // Período de entrega que cubre este cobro (YYYY-MM-DD de `next_delivery_date`).
  // Junto con `subscription_id` identifica el período de forma idempotente.
  period_key: model.text().index(),
  // Referencia única enviada a Flow como `commerceOrder` en el ÚLTIMO intento.
  commerce_order: model.text().index(),
  // Nº de orden interno de Flow (`flowOrder`), informativo.
  flow_order: model.text().nullable(),
  // Monto cobrado (CLP entero), snapshot para conciliar con Flow.
  amount: model.number(),
  currency_code: model.text().default("clp"),
  // Estado del intento del período: pending (en curso) · paid (cobrado) ·
  // rejected (Flow rechazó el cobro) · failed (error inesperado / sin tarjeta).
  status: model.enum(["pending", "paid", "rejected", "failed"]).default("pending"),
  // Entero crudo de Flow (1 pend · 2 pagada · 3 rechazada · 4 anulada), trazabilidad.
  raw_status: model.number().nullable(),
  // Orden de Medusa creada tras el cobro (se llena al crearla; null = pendiente).
  order_id: model.text().nullable(),
  // Nº de intento del período (dunning): 1 en el primero, +1 en cada reintento.
  attempt: model.number().default(1),
  // Último error (mensaje de Flow o interno), para depurar cobros fallidos.
  error: model.text().nullable(),
});

export default SubscriptionCharge;
