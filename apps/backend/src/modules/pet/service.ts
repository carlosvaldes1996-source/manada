import { MedusaService } from "@medusajs/framework/utils";
import Pet from "./models/pet";

/**
 * Servicio del módulo `pet` (D34). `MedusaService` autogenera el CRUD
 * (`listPets`/`retrievePet`/`createPets`/`updatePets`/`deletePets`); las rutas
 * de la Store API (`/store/pets`, API.md §9) imponen la propiedad por
 * `customer_id` — el servicio no conoce la sesión.
 */
class PetModuleService extends MedusaService({ Pet }) {}

export default PetModuleService;
