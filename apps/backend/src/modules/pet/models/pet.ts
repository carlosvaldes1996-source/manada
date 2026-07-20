import { model } from "@medusajs/framework/utils";

/**
 * Perfil de mascota (D34) — la entidad crítica del moat (DATABASE.md §1/§8),
 * con el alcance del MVP: los campos que el frontend ya usa hoy.
 *
 * La relación con Customer vive en un **Module Link** (`src/links/customer-pet.ts`),
 * no en una columna: patrón idiomático de Medusa v2, con joins nativos vía
 * `query.graph` (`customer.pets` / `pet.customer`). `food_assigned_at` lo estampa
 * el BACKEND al cambiar `current_food_id` — ancla del cálculo de anticipación.
 */
const Pet = model.define("pet", {
  id: model.id({ prefix: "pet" }).primaryKey(),
  name: model.text(),
  species: model.enum(["perro", "gato", "otro"]),
  stage: model.enum(["cachorro", "adulto", "senior"]),
  weight_kg: model.float().nullable(),
  weight_source: model.enum(["exacto", "rango", "estimado"]).nullable(),
  breed: model.text().nullable(),
  neutered: model.boolean().nullable(),
  conditions: model.array().nullable(),
  avatar_url: model.text().nullable(),
  current_food_id: model.text().nullable(),
  food_assigned_at: model.dateTime().nullable(),
});

export default Pet;
