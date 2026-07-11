import type { LifeStage, Pet, Species, WeightSource } from "@/types";
import { medusa } from "./client";
import { profileCompleteness } from "@/lib/pet";

/**
 * Mascotas reales del cliente — contrato `/store/pets` (API.md §9, D34).
 *
 * Todas las llamadas van autenticadas: el js-sdk adjunta el JWT de la sesión
 * (D26) y la publishable key. El backend impone la propiedad (un cliente solo
 * ve/toca sus mascotas) y estampa `food_assigned_at` cuando cambia el alimento
 * (reloj único de la anticipación). Este módulo es el único que conoce la forma
 * `StorePet` del backend; hacia la app siempre sale el tipo de dominio `Pet`.
 */

interface StorePet {
  id: string;
  name: string;
  species: Species;
  stage: LifeStage;
  weight_kg: number | null;
  weight_source: WeightSource | null;
  breed: string | null;
  neutered: boolean | null;
  conditions: string[] | null;
  avatar_url: string | null;
  current_food_id: string | null;
  food_assigned_at: string | null;
}

function mapPet(sp: StorePet): Pet {
  const pet: Pet = {
    id: sp.id,
    name: sp.name,
    species: sp.species,
    stage: sp.stage,
    weightKg: sp.weight_kg ?? undefined,
    weightSource: sp.weight_source ?? undefined,
    breed: sp.breed ?? undefined,
    neutered: sp.neutered ?? undefined,
    conditions: sp.conditions ?? undefined,
    avatarUrl: sp.avatar_url ?? undefined,
    currentFoodId: sp.current_food_id ?? undefined,
  };
  // La completitud es derivada (no se almacena, DATABASE.md §8).
  pet.completeness = profileCompleteness(pet);
  return pet;
}

/**
 * Las mascotas del cliente + el mapa de "desde cuándo come esto" (ancla de la
 * anticipación, estampado por el backend). Una sola fuente para el PetProvider.
 */
export async function listMyPets(): Promise<{
  pets: Pet[];
  foodAssignedAt: Record<string, string>;
}> {
  const { pets } = await medusa.client.fetch<{ pets: StorePet[] }>("/store/pets");
  const foodAssignedAt: Record<string, string> = {};
  for (const sp of pets) {
    if (sp.food_assigned_at) foodAssignedAt[sp.id] = sp.food_assigned_at;
  }
  return { pets: pets.map(mapPet), foodAssignedAt };
}

/** Crea la mascota en el backend y devuelve el `Pet` real (id `pet_…`). */
export async function createMyPet(pet: Pet): Promise<Pet> {
  const { pet: created } = await medusa.client.fetch<{ pet: StorePet }>("/store/pets", {
    method: "POST",
    body: {
      name: pet.name,
      species: pet.species,
      stage: pet.stage,
      weight_kg: pet.weightKg,
      weight_source: pet.weightSource,
      breed: pet.breed,
      neutered: pet.neutered,
      conditions: pet.conditions,
    },
  });
  return mapPet(created);
}

/**
 * Campos editables del PATCH (espejo de `StoreUpdatePet` del backend).
 * Semántica SETTER-ONLY (B5): un campo omitido no cambia; el validador no
 * acepta `null` para estos campos (solo `current_food_id`/`avatar_url` son
 * anulables). `conditions: []` sí limpia la lista.
 */
export interface UpdateMyPetInput {
  weight_kg?: number;
  weight_source?: WeightSource;
  breed?: string;
  neutered?: boolean;
  conditions?: string[];
  /** Producto que come (`null` = des-asignar). El backend estampa la fecha. */
  current_food_id?: string | null;
}

export async function updateMyPet(
  id: string,
  changes: UpdateMyPetInput,
): Promise<{ pet: Pet; foodAssignedAt: string | null }> {
  const { pet } = await medusa.client.fetch<{ pet: StorePet }>(`/store/pets/${id}`, {
    method: "PATCH",
    body: changes,
  });
  return { pet: mapPet(pet), foodAssignedAt: pet.food_assigned_at };
}
