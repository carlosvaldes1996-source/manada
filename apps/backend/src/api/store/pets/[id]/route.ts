import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { PET_MODULE } from "../../../../modules/pet";
import PetModuleService from "../../../../modules/pet/service";
import { StoreUpdatePetType } from "../validators";

/**
 * `PATCH /store/pets/:id` (API.md §9.2) — edición parcial de UNA mascota propia.
 *
 * - Propiedad: la mascota debe estar entre las del cliente (Module Link
 *   Customer↔Pet, resuelto con `query.graph`); si no, 404 (no revela existencia).
 * - Regla de anticipación: si el body trae `current_food_id`, el BACKEND estampa
 *   `food_assigned_at = now()` (reloj del servidor = fuente única del "desde
 *   cuándo come esto"); al des-asignar (`null`), la fecha también se limpia.
 */
export async function PATCH(
  req: AuthenticatedMedusaRequest<StoreUpdatePetType>,
  res: MedusaResponse,
) {
  const petService = req.scope.resolve<PetModuleService>(PET_MODULE);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;

  const { data } = await query.graph({
    entity: "customer",
    fields: ["pets.id"],
    filters: { id: req.auth_context.actor_id },
  });
  const owns = ((data?.[0]?.pets ?? []) as { id: string }[]).some((p) => p.id === id);
  if (!owns) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `La mascota ${id} no existe`);
  }

  const update: Record<string, unknown> = { ...req.validatedBody };
  if ("current_food_id" in update) {
    update.food_assigned_at = update.current_food_id ? new Date() : null;
  }

  const pet = await petService.updatePets({ id, ...update });
  res.json({ pet });
}
