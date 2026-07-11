import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { PET_MODULE } from "../../../../modules/pet";
import PetModuleService from "../../../../modules/pet/service";
import { StoreUpdatePetType } from "../validators";

/**
 * `PATCH /store/pets/:id` (API.md §9.2) — edición parcial de UNA mascota propia.
 *
 * - Propiedad: la mascota debe pertenecer al `customer_id` del token; si no,
 *   404 (no se revela existencia).
 * - Regla de anticipación: si el body trae `current_food_id`, el BACKEND estampa
 *   `food_assigned_at = now()` (reloj del servidor = fuente única del "desde
 *   cuándo come esto"); al des-asignar (`null`), la fecha también se limpia.
 */
export async function PATCH(
  req: AuthenticatedMedusaRequest<StoreUpdatePetType>,
  res: MedusaResponse,
) {
  const pets = req.scope.resolve<PetModuleService>(PET_MODULE);
  const { id } = req.params;

  const [existing] = await pets.listPets({
    id,
    customer_id: req.auth_context.actor_id,
  });
  if (!existing) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `La mascota ${id} no existe`);
  }

  const data: Record<string, unknown> = { ...req.validatedBody };
  if ("current_food_id" in data) {
    data.food_assigned_at = data.current_food_id ? new Date() : null;
  }

  const pet = await pets.updatePets({ id, ...data });
  res.json({ pet });
}
