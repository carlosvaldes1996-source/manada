import { Module } from "@medusajs/framework/utils";
import SubscriptionModuleService from "./service";

/**
 * Módulo `subscription` (D55) — el moat de recurrencia. Tercer módulo custom de
 * Manada (patrón idéntico a `pet`, D34, y `payment-method`, §10).
 */
export const SUBSCRIPTION_MODULE = "subscription";

export default Module(SUBSCRIPTION_MODULE, {
  service: SubscriptionModuleService,
});
