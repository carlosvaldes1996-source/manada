import CustomerModule from "@medusajs/medusa/customer";
import { defineLink } from "@medusajs/framework/utils";
import PetModule from "../modules/pet";

/**
 * Module Link Customer ↔ Pet (graduación del atajo `customer_id` de D34).
 *
 * Patrón idiomático de Medusa v2: la relación entre módulos vive en una tabla de
 * enlace gestionada por el Link Module, respetando el aislamiento entre módulos y
 * habilitando joins nativos con `query.graph` en ambos sentidos
 * (`customer.pets`, `pet.customer`). Reemplaza a la columna plana `pet.customer_id`
 * (fuente única, sin duplicar la referencia).
 *
 * Cardinalidad 1→N: un cliente tiene muchas mascotas; cada mascota, un cliente.
 */
export default defineLink(CustomerModule.linkable.customer, {
  linkable: PetModule.linkable.pet,
  isList: true,
});
