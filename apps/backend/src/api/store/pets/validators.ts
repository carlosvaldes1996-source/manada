import { z } from "@medusajs/deps/zod";

/**
 * Validación de borde para `/store/pets` (API.md §9). Se usa la instancia de
 * zod que Medusa centraliza en `@medusajs/deps` — la misma que consume
 * `validateAndTransformBody` — para no duplicar la dependencia.
 *
 * Los enums espejan el modelo (`src/modules/pet/models/pet.ts`); un valor fuera
 * de rango se rechaza aquí, antes de tocar el servicio.
 */

const species = z.enum(["perro", "gato", "otro"]);
const stage = z.enum(["cachorro", "adulto", "senior"]);
const weightSource = z.enum(["exacto", "rango", "estimado"]);

export const StoreCreatePet = z.object({
  name: z.string().trim().min(1).max(80),
  species,
  stage,
  weight_kg: z.number().positive().max(120).optional(),
  weight_source: weightSource.optional(),
  breed: z.string().trim().min(1).max(120).optional(),
  neutered: z.boolean().optional(),
  conditions: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
});
export type StoreCreatePetType = z.infer<typeof StoreCreatePet>;

/**
 * PATCH parcial. `current_food_id` acepta `null` (des-asignar alimento);
 * `food_assigned_at` NO se acepta del cliente: lo estampa el backend (§9.2).
 * `avatar_url` se persiste sin validar formato (la forma real la fija B4).
 */
export const StoreUpdatePet = StoreCreatePet.partial().extend({
  current_food_id: z.string().trim().min(1).max(120).nullable().optional(),
  avatar_url: z.string().trim().min(1).max(2048).nullable().optional(),
});
export type StoreUpdatePetType = z.infer<typeof StoreUpdatePet>;
