import { model } from "@medusajs/framework/utils";

/**
 * Intento de pago con Flow (D58) — la pasarela real del checkout (reemplaza el
 * pago manual de D24). Cuarto módulo custom de Manada (patrón idéntico a `pet`
 * D34, `payment-method` §10 y `subscription` D55): extiende Medusa sin tocar el core.
 *
 * Este registro es la ÚNICA fuente de verdad del ciclo de un pago Flow y el eje
 * de la IDEMPOTENCIA: `token` (lo que Flow envía en el callback) es la llave de
 * conciliación; `status` es el mutex que evita completar la orden dos veces si
 * Flow reintenta el callback o si `urlReturn` y `urlConfirmation` llegan a la vez.
 *
 * Por qué difiere la orden hasta aquí: en Manada TODO el post-pago cuelga del
 * evento nativo `order.placed` (correos, suscripción D55, anticipación D35), que
 * se dispara al COMPLETAR el carrito. Al mover ese `complete` del click del
 * usuario al webhook de Flow ya confirmado, la orden (y sus efectos) solo nacen
 * con pago verificado — sin tocar ningún subscriber existente.
 *
 * - `amount` es SNAPSHOT del total cobrado (CLP entero), para conciliar con Flow.
 * - `cart_id` es el carrito que se completará; `order_id` se llena al confirmarse.
 * - `raw_status` guarda el entero de `payment/getStatus` (1 pend · 2 pagada ·
 *   3 rechazada · 4 anulada) para trazabilidad.
 */
const FlowPayment = model.define("flow_payment", {
  id: model.id({ prefix: "flowpay" }).primaryKey(),
  // Carrito de Medusa que se completa al confirmarse el pago.
  cart_id: model.text().index(),
  // Referencia única enviada a Flow como `commerceOrder`.
  commerce_order: model.text().index(),
  // Token que Flow devuelve y reenvía en el callback: LLAVE de conciliación.
  token: model.text().index().nullable(),
  // Nº de orden interno de Flow (`flowOrder`), informativo.
  flow_order: model.text().nullable(),
  // URL de redirección al checkout de Flow (`url?token=`). Se guarda para poder
  // REUSAR un intento `pending` del mismo carrito/monto y no duplicar cobros.
  redirect_url: model.text().nullable(),
  // Total cobrado (CLP entero), snapshot para conciliar con Flow.
  amount: model.number(),
  currency_code: model.text().default("clp"),
  // Estado del pago. `pending` al crear; solo pasa a `paid` cuando getStatus == 2.
  status: model.enum(["pending", "paid", "rejected", "canceled"]).default("pending"),
  // Entero crudo de payment/getStatus (1..4), para trazabilidad.
  raw_status: model.number().nullable(),
  // Orden de Medusa creada al confirmarse el pago (se llena en el settle).
  order_id: model.text().nullable(),
  // Payment collection del carrito, para capturar el pago tras completar.
  payment_collection_id: model.text().nullable(),
  // Último error (útil para depurar callbacks fallidos).
  error: model.text().nullable(),
});

export default FlowPayment;
