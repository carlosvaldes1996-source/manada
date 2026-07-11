import { Module } from "@medusajs/framework/utils";
import PetModuleService from "./service";

/**
 * Módulo `pet` (D34) — primer módulo custom de Manada (previsto en D21 como
 * `pet-profile`): el perfil de mascota vive en el backend como fuente única.
 */
export const PET_MODULE = "pet";

export default Module(PET_MODULE, {
  service: PetModuleService,
});
