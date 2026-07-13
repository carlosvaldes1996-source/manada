import { Module } from "@medusajs/framework/utils";
import PaymentMethodModuleService from "./service";

/**
 * Módulo `payment-method` (API.md §10) — referencias a medios de pago guardados
 * del cliente. Segundo módulo custom (patrón idéntico a `pet`, D34).
 */
export const PAYMENT_METHOD_MODULE = "payment_method";

export default Module(PAYMENT_METHOD_MODULE, {
  service: PaymentMethodModuleService,
});
