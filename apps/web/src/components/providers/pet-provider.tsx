"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Pet } from "@/types";

/**
 * Estado global del Perfil de Mascota — el núcleo del producto (UX.md §3).
 * El selector de mascota del header cambia `activePet` y re-personaliza toda
 * la UI (home, catálogo, anticipación).
 *
 * Fase 3.3B: arranca **vacío** para soportar al visitante nuevo (sin mascota
 * sembrada). El alta conversacional usa `addPet`; el demo-login siembra a Toby
 * vía `seedPets` (ver `useAuthActions`). En Fase 4 se conecta al backend.
 */
interface PetContextValue {
  pets: Pet[];
  activePet: Pet | null;
  setActivePetId: (id: string) => void;
  /** Crea una mascota (alta de onboarding). Por defecto la deja activa. */
  addPet: (pet: Pet, opts?: { activate?: boolean }) => void;
  /** Reemplaza la lista (demo-login). Activa `activeId` o la primera. */
  seedPets: (pets: Pet[], activeId?: string) => void;
  /** Vacía las mascotas (cerrar sesión). */
  clearPets: () => void;
  /**
   * Asigna un alimento a una mascota (`currentFoodId`) y registra CUÁNDO, para
   * que la anticipación se calcule desde esa fecha. Es la costura del loop
   * alimento↔mascota (PET_EXPERIENCE Bloque 6): la llama la PDP al "Agregar para
   * {nombre}" y, más adelante, la recomendación del funnel — una sola API, sin
   * duplicar. El backend real la reemplaza persistiendo `current_food` en el módulo.
   */
  assignFood: (petId: string, foodId: string) => void;
  /** Fecha ISO en que se asignó el alimento actual de cada mascota (por id). */
  foodAssignedAt: Record<string, string>;
}

const PetContext = createContext<PetContextValue | null>(null);

export function PetProvider({ children }: { children: React.ReactNode }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [foodAssignedAt, setFoodAssignedAt] = useState<Record<string, string>>({});

  const addPet = useCallback<PetContextValue["addPet"]>((pet, opts) => {
    setPets((prev) => [...prev, pet]);
    if (opts?.activate ?? true) setActivePetId(pet.id);
  }, []);

  const seedPets = useCallback<PetContextValue["seedPets"]>((next, activeId) => {
    setPets(next);
    setActivePetId(activeId ?? next[0]?.id ?? null);
  }, []);

  const clearPets = useCallback(() => {
    setPets([]);
    setActivePetId(null);
    setFoodAssignedAt({});
  }, []);

  const assignFood = useCallback<PetContextValue["assignFood"]>((petId, foodId) => {
    setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, currentFoodId: foodId } : p)));
    setFoodAssignedAt((prev) => ({ ...prev, [petId]: new Date().toISOString() }));
  }, []);

  const value = useMemo<PetContextValue>(
    () => ({
      pets,
      activePet: pets.find((p) => p.id === activePetId) ?? null,
      setActivePetId,
      addPet,
      seedPets,
      clearPets,
      assignFood,
      foodAssignedAt,
    }),
    [pets, activePetId, addPet, seedPets, clearPets, assignFood, foodAssignedAt],
  );

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePet(): PetContextValue {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error("usePet debe usarse dentro de <PetProvider>");
  return ctx;
}
