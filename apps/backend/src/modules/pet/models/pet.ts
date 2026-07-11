import { model } from "@medusajs/framework/utils";

/**
 * Perfil de mascota (D34) — la entidad crítica del moat (DATABASE.md §1/§8),
 * con el alcance del MVP: los campos que el frontend ya usa hoy.
 *
 * `customer_id` es un campo plano indexado (no module link): el único patrón de
 * consulta es "las mascotas de este cliente" (rationale en DATABASE.md §8).
 * `food_assigned_at` lo estampa el BACKEND al cambiar `current_food_id` — es el
 * ancla del cálculo de anticipación ("desde cuándo come esto").
 */
const Pet = model.define("pet", {
  id: model.id({ prefix: "pet" }).primaryKey(),
  customer_id: model.text().index(),
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
