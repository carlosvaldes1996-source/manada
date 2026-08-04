import { Module } from "@medusajs/framework/utils";
import SubscriptionChargeModuleService from "./service";

/**
 * Módulo `subscription-charge` (D59) — ledger de cobros recurrentes. Quinto módulo
 * custom de Manada (patrón idéntico a `flow-payment` D58). Persiste cada intento de
 * cobro de una renovación y es el eje de la idempotencia del scheduler.
 */
export const SUBSCRIPTION_CHARGE_MODULE = "subscription_charge";

export default Module(SUBSCRIPTION_CHARGE_MODULE, {
  service: SubscriptionChargeModuleService,
});
