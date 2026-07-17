import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { PET_MODULE } from "../../../modules/pet";
import PetModuleService from "../../../modules/pet/service";
import { StoreCreatePetType } from "./validators";

/**
 * `/store/pets` (API.md §9) — mascotas del cliente autenticado.
 *
 * La relación Customer↔Pet vive en un **Module Link** (`src/links/customer-pet.ts`),
 * no en una columna plana: la propiedad se resuelve traversando el link con
 * `query.graph` (`customer.pets`). La autenticación y la validación del body (zod)
 * se aplican en `src/api/middlewares.ts`. El contrato HTTP no cambió.
 */

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "customer",
    fields: ["pets.*"],
    filters: { id: req.auth_context.actor_id },
  });
  const pets = ((data?.[0]?.pets ?? []) as { created_at: string }[])
    .filter(Boolean)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  res.json({ pets });
}

export async function POST(
  req: AuthenticatedMedusaRequest<StoreCreatePetType>,
  res: MedusaResponse,
) {
  const petService = req.scope.resolve<PetModuleService>(PET_MODULE);
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);

  const pet = await petService.createPets(req.validatedBody);
  try {
    // Asocia la mascota a su dueño vía el Module Link (fuente única de la relación).
    await link.create({
      [Modules.CUSTOMER]: { customer_id: req.auth_context.actor_id },
      [PET_MODULE]: { pet_id: pet.id },
    });
  } catch (error) {
    // Sin dueño la mascota quedaría huérfana (invisible en GET): la revertimos.
    await petService.deletePets(pet.id);
    throw error;
  }

  res.status(201).json({ pet });
}
