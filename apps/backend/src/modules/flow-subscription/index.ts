import { Module } from "@medusajs/framework/utils";
import FlowSubscriptionModuleService from "./service";

/**
 * Módulo `flow-subscription` (D71, API.md §16) — espejo local del modelo de
 * suscripción NATIVO de Flow: planes (`flow_plan`) y suscripciones
 * (`flow_subscription`).
 *
 * ── Por qué DOS modelos en un módulo, si el proyecto usa uno por módulo ───────
 * Un plan de Flow no tiene significado independiente: existe solo para ser
 * referenciado por suscripciones, y toda operación real (crear, cambiar de plan)
 * los toca juntos. Separarlos en dos módulos obligaría a lecturas cruzadas para
 * algo que siempre se usa en conjunto, sin ganar aislamiento. Es un contexto
 * acotado, no dos.
 */
export const FLOW_SUBSCRIPTION_MODULE = "flow_subscription";

export default Module(FLOW_SUBSCRIPTION_MODULE, {
  service: FlowSubscriptionModuleService,
});
