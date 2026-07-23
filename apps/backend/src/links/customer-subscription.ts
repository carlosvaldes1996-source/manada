import CustomerModule from "@medusajs/medusa/customer";
import { defineLink } from "@medusajs/framework/utils";
import SubscriptionModule from "../modules/subscription";

/**
 * Module Link Customer ↔ Subscription (D55) — mismo patrón que Customer↔Pet
 * (`customer-pet.ts`, graduado en D47): la relación vive en una tabla de enlace
 * gestionada por el Link Module, NO en una columna plana `customer_id`. Habilita
 * joins nativos con `query.graph` en ambos sentidos (`customer.subscriptions`,
 * `subscription.customer`) respetando el aislamiento entre módulos.
 *
 * Cardinalidad 1→N: un cliente tiene muchas suscripciones; cada suscripción,
 * un cliente.
 */
export default defineLink(CustomerModule.linkable.customer, {
  linkable: SubscriptionModule.linkable.subscription,
  isList: true,
});
