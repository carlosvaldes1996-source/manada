import { Module } from "@medusajs/framework/utils";
import FlowPaymentModuleService from "./service";

/**
 * Módulo `flow-payment` (D58) — la pasarela de pago real de Manada (Flow).
 * Cuarto módulo custom (patrón idéntico a `pet` D34, `payment-method` §10 y
 * `subscription` D55). Persiste el ciclo de cada intento de pago con Flow.
 */
export const FLOW_PAYMENT_MODULE = "flow_payment";

export default Module(FLOW_PAYMENT_MODULE, {
  service: FlowPaymentModuleService,
});
