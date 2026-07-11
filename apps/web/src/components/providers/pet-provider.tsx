"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Pet, WeightSource } from "@/types";
import { createMyPet, listMyPets, updateMyPet, type UpdateMyPetInput } from "@/lib/medusa";
import { profileCompleteness } from "@/lib/pet";
import { useSession } from "./session-provider";

/**
 * Estado global del Perfil de Mascota — el núcleo del producto (UX.md §3).
 * El selector de mascota del header cambia `activePet` y re-personaliza toda
 * la UI (home, catálogo, anticipación).
 *
 * FUENTE DE VERDAD (D34): con sesión, las mascotas viven en el backend
 * (`/store/pets`, módulo `pet`) — al autenticarse se hidratan desde ahí y toda
 * mutación se persiste. El INVITADO opera en memoria (ids `local_…`); al
 * iniciar sesión sus mascotas se EMPUJAN al backend (espejo de `transferCart`,
 * API.md §9.1) y la memoria se reemplaza por lo hidratado.
 */
interface PetContextValue {
  pets: Pet[];
  activePet: Pet | null;
  setActivePetId: (id: string) => void;
  /**
   * Crea una mascota (alta de onboarding). Con sesión la persiste en el backend
   * (id real `pet_…`); como invitado queda en memoria (id `local_…`). Si la
   * creación remota falla, degrada a memoria para no romper el flujo (se
   * empuja en la próxima sincronización). Por defecto la deja activa.
   */
  addPet: (pet: Pet, opts?: { activate?: boolean }) => Promise<Pet>;
  /** Vacía las mascotas (cerrar sesión). */
  clearPets: () => void;
  /**
   * Asigna un alimento a una mascota (`currentFoodId`) — la costura del loop
   * alimento↔mascota (B6): la llaman la PDP y la recomendación del funnel.
   * Optimista en memoria; con sesión persiste vía `PATCH /store/pets/:id` y
   * reconcilia `foodAssignedAt` con la fecha que estampa el backend (§9.2).
   */
  assignFood: (petId: string, foodId: string) => void;
  /**
   * Edita campos del perfil (B5, la usa `PetEditDialog`). Optimista en memoria
   * (recalcula `completeness`); con sesión persiste vía PATCH — semántica
   * setter-only (los campos omitidos no cambian). Mismo patrón que assignFood.
   */
  updatePet: (petId: string, changes: PetProfileChanges) => void;
  /** Fecha ISO en que se asignó el alimento actual de cada mascota (por id). */
  foodAssignedAt: Record<string, string>;
}

/** Campos del perfil editables desde la UI (subset de `Pet`, B5). */
export interface PetProfileChanges {
  weightKg?: number;
  weightSource?: WeightSource;
  breed?: string;
  neutered?: boolean;
  conditions?: string[];
}

const PetContext = createContext<PetContextValue | null>(null);

/** id local de invitado (no persistido). El backend emite ids `pet_…`. */
function isLocalId(id: string): boolean {
  return id.startsWith("local_");
}

export function PetProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [foodAssignedAt, setFoodAssignedAt] = useState<Record<string, string>>({});

  // Refs para leer estado fresco dentro de callbacks/efectos sin stale closures.
  const statusRef = useRef(status);
  const petsRef = useRef(pets);
  const activePetIdRef = useRef(activePetId);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    petsRef.current = pets;
  }, [pets]);
  useEffect(() => {
    activePetIdRef.current = activePetId;
  }, [activePetId]);

  /** Guard de sincronización en curso (evita el doble efecto de StrictMode). */
  const syncingRef = useRef(false);

  // Al autenticarse: empujar las mascotas de invitado y luego hidratar TODO
  // desde el backend (una sola fuente). Al recargar con sesión persistida, la
  // memoria arranca vacía → es solo hidratación.
  useEffect(() => {
    if (status !== "authenticated" || syncingRef.current) return;
    syncingRef.current = true;

    void (async () => {
      try {
        // 1 · Push de mascotas locales (espejo de transferCart). Se conserva
        //     también su alimento asignado (el backend re-estampa la fecha).
        const locals = petsRef.current.filter((p) => isLocalId(p.id));
        const activeLocalId = activePetIdRef.current;
        let nextActiveId: string | null = null;

        for (const guest of locals) {
          try {
            const created = await createMyPet(guest);
            if (guest.currentFoodId) {
              await updateMyPet(created.id, { current_food_id: guest.currentFoodId });
            }
            if (guest.id === activeLocalId) nextActiveId = created.id;
          } catch (err) {
            console.warn("[pets] no se pudo transferir una mascota de invitado", err);
          }
        }

        // 2 · Hidratar desde la fuente única.
        const { pets: remote, foodAssignedAt: assignedAt } = await listMyPets();
        setPets(remote);
        setFoodAssignedAt(assignedAt);
        setActivePetId((prev) => {
          const candidate = nextActiveId ?? prev;
          if (candidate && remote.some((p) => p.id === candidate)) return candidate;
          return remote[0]?.id ?? null;
        });
      } catch (err) {
        // Sin backend no rompemos la sesión: la memoria queda como esté.
        console.warn("[pets] hidratación de mascotas falló", err);
      } finally {
        syncingRef.current = false;
      }
    })();
  }, [status]);

  const addPet = useCallback<PetContextValue["addPet"]>(async (pet, opts) => {
    let final = pet;
    if (statusRef.current === "authenticated") {
      try {
        final = await createMyPet(pet);
      } catch (err) {
        console.warn("[pets] creación remota falló; la mascota queda local", err);
      }
    }
    setPets((prev) => [...prev, final]);
    if (opts?.activate ?? true) setActivePetId(final.id);
    return final;
  }, []);

  const clearPets = useCallback(() => {
    setPets([]);
    setActivePetId(null);
    setFoodAssignedAt({});
  }, []);

  const assignFood = useCallback<PetContextValue["assignFood"]>((petId, foodId) => {
    // Optimista: la UI (toast de la PDP, dashboard) refleja el vínculo al tiro.
    setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, currentFoodId: foodId } : p)));
    setFoodAssignedAt((prev) => ({ ...prev, [petId]: new Date().toISOString() }));

    // Con sesión y mascota persistida → el backend es la verdad (re-estampa fecha).
    if (statusRef.current === "authenticated" && !isLocalId(petId)) {
      void updateMyPet(petId, { current_food_id: foodId })
        .then(({ foodAssignedAt: serverAt }) => {
          if (serverAt) {
            setFoodAssignedAt((prev) => ({ ...prev, [petId]: serverAt }));
          }
        })
        .catch((err) => console.warn("[pets] no se pudo persistir el alimento", err));
    }
  }, []);

  const updatePet = useCallback<PetContextValue["updatePet"]>((petId, changes) => {
    // Optimista: la ficha y la barra de completitud reflejan el cambio al tiro.
    setPets((prev) =>
      prev.map((p) => {
        if (p.id !== petId) return p;
        const next = { ...p, ...changes };
        next.completeness = profileCompleteness(next);
        return next;
      }),
    );

    if (statusRef.current === "authenticated" && !isLocalId(petId)) {
      const body: UpdateMyPetInput = {
        weight_kg: changes.weightKg,
        weight_source: changes.weightSource,
        breed: changes.breed,
        neutered: changes.neutered,
        conditions: changes.conditions,
      };
      void updateMyPet(petId, body).catch((err) =>
        console.warn("[pets] no se pudo persistir la edición del perfil", err),
      );
    }
  }, []);

  const value = useMemo<PetContextValue>(
    () => ({
      pets,
      activePet: pets.find((p) => p.id === activePetId) ?? null,
      setActivePetId,
      addPet,
      clearPets,
      assignFood,
      updatePet,
      foodAssignedAt,
    }),
    [pets, activePetId, addPet, clearPets, assignFood, updatePet, foodAssignedAt],
  );

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePet(): PetContextValue {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error("usePet debe usarse dentro de <PetProvider>");
  return ctx;
}
