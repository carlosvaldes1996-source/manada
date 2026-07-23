import { defineLink } from "@medusajs/framework/utils";
import PetModule from "../modules/pet";
import SubscriptionModule from "../modules/subscription";

/**
 * Module Link Pet ↔ Subscription (D55) — OPCIONAL. Se crea solo si la compra que
 * originó la suscripción está ligada a una mascota del cliente → alimenta "el
 * plan de {nombre}" (D42). Si la suscripción no apunta a ninguna mascota,
 * simplemente no se crea el enlace (no hay columna que quede en null).
 *
 * Cardinalidad 1→N: una mascota puede tener varias suscripciones (p. ej. alimento
 * + snack recurrente); una suscripción alimenta a lo sumo una mascota.
 */
export default defineLink(
  PetModule.linkable.pet,
  {
    linkable: SubscriptionModule.linkable.subscription,
    isList: true,
  },
);
