import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { PET_MODULE } from "../modules/pet";
import PetModuleService from "../modules/pet/service";

/**
 * Backfill del Module Link Customer↔Pet a partir de la columna plana
 * `pet.customer_id` (graduación de D34). Se ejecuta UNA vez, DESPUÉS de crear la
 * tabla de enlace (`medusa db:migrate`) y ANTES de eliminar `pet.customer_id`.
 *
 * Idempotente: `remoteLink.create` sobre un par ya existente es un upsert, así que
 * re-ejecutarlo no duplica enlaces.
 */
export default async function backfillCustomerPetLinks({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const petService = container.resolve<PetModuleService>(PET_MODULE);

  const pets = await petService.listPets({}, { take: 100000 });

  const definitions = pets
    .map((p) => ({
      pet_id: p.id,
      customer_id: (p as { customer_id?: string | null }).customer_id,
    }))
    .filter((row): row is { pet_id: string; customer_id: string } => Boolean(row.customer_id))
    .map((row) => ({
      [Modules.CUSTOMER]: { customer_id: row.customer_id },
      [PET_MODULE]: { pet_id: row.pet_id },
    }));

  if (definitions.length) {
    await link.create(definitions);
  }

  logger.info(
    `[backfill] Links Customer↔Pet asegurados: ${definitions.length} de ${pets.length} mascotas.`,
  );
}
