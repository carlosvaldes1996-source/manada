import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PET_MODULE } from "../../../modules/pet";
import PetModuleService from "../../../modules/pet/service";
import { StoreCreatePetType } from "./validators";

/**
 * `/store/pets` (API.md §9) — mascotas del cliente autenticado.
 *
 * La autenticación (`authenticate("customer", …)`) y la validación del body
 * (zod) se aplican en `src/api/middlewares.ts`; aquí solo se impone la
 * PROPIEDAD: todo se filtra/crea con el `customer_id` del token — un cliente
 * jamás ve ni toca mascotas ajenas.
 */

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pets = req.scope.resolve<PetModuleService>(PET_MODULE);
  const list = await pets.listPets(
    { customer_id: req.auth_context.actor_id },
    { order: { created_at: "ASC" } },
  );
  res.json({ pets: list });
}

export async function POST(
  req: AuthenticatedMedusaRequest<StoreCreatePetType>,
  res: MedusaResponse,
) {
  const pets = req.scope.resolve<PetModuleService>(PET_MODULE);
  const pet = await pets.createPets({
    ...req.validatedBody,
    customer_id: req.auth_context.actor_id,
  });
  res.status(201).json({ pet });
}
