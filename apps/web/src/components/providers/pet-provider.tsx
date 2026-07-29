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
 * mutación se persiste. El INVITADO opera en memoria (ids `local_…`).
 *
 * Adopción de mascotas de invitado: SOLO el registro "valor primero" (cuenta
 * nueva) las EMPUJA al backend (espejo de `transferCart`, API.md §9.1) — lo
 * enciende `useAuthActions.register` vía `requestGuestTransfer()`. El LOGIN a
 * una cuenta existente NO las adopta: solo hidrata las mascotas reales y la
 * memoria (con la mascota temporal del onboarding) se reemplaza por lo
 * hidratado, para no mezclar estados temporales con el perfil del usuario.
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
  /**
   * Marca que la PRÓXIMA transición a `authenticated` debe adoptar las mascotas
   * de invitado (empujarlas al backend). Solo la llama el registro "valor
   * primero" (`useAuthActions.register`); el login a una cuenta existente NO,
   * para no mezclar la mascota temporal del onboarding con el perfil real.
   */
  requestGuestTransfer: () => void;
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
  /**
   * Guarda la foto de la mascota (B4). ANDAMIO HONESTO (directiva de Carlos):
   * sin storage temporal en el backend — el data-URL recortado vive en memoria
   * + `localStorage` de este dispositivo. Cuando exista la estrategia de blobs
   * definitiva, este método sube el archivo y persiste `avatar_url` vía PATCH
   * (la columna y el contrato ya existen); la UI no cambia.
   */
  setPetPhoto: (petId: string, dataUrl: string | null) => void;
  /** Fecha ISO en que se asignó el alimento actual de cada mascota (por id). */
  foodAssignedAt: Record<string, string>;
  /**
   * `true` mientras se resuelve la primera hidratación del perfil (espejo local
   * del invitado o backend del cliente). Deja distinguir "aún cargando" de "no
   * hay mascota", para no redirigir al onboarding en una recarga antes de tiempo.
   */
  isHydrating: boolean;
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

/* ------------------------- Fotos (andamio local, B4) ------------------------ */

const PHOTOS_KEY = "manada.pet_photos";

/** Mapa id→data-URL de las fotos guardadas en este dispositivo. */
function readStoredPhotos(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(PHOTOS_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function writeStoredPhoto(petId: string, dataUrl: string | null) {
  if (typeof window === "undefined") return;
  try {
    const photos = readStoredPhotos();
    if (dataUrl) photos[petId] = dataUrl;
    else delete photos[petId];
    window.localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
  } catch (err) {
    // Cuota llena o storage bloqueado: la foto vive igual en memoria esta sesión.
    console.warn("[pets] no se pudo guardar la foto en el dispositivo", err);
  }
}

/** Renombra la foto guardada cuando una mascota de invitado obtiene id real. */
function migrateStoredPhoto(fromId: string, toId: string) {
  const photos = readStoredPhotos();
  const dataUrl = photos[fromId];
  if (!dataUrl) return;
  writeStoredPhoto(toId, dataUrl);
  writeStoredPhoto(fromId, null);
}

/** Completa `avatarUrl` desde el dispositivo en mascotas hidratadas sin foto. */
function overlayStoredPhotos(pets: Pet[]): Pet[] {
  const photos = readStoredPhotos();
  return pets.map((p) => {
    if (p.avatarUrl || !photos[p.id]) return p;
    const next = { ...p, avatarUrl: photos[p.id] };
    next.completeness = profileCompleteness(next);
    return next;
  });
}

/* ------------------- Espejo local del perfil de INVITADO --------------------- */

/**
 * `localStorage` que refleja el perfil de mascota del INVITADO (ids `local_…`),
 * espejo del patrón del carrito (`manada_cart_id`). Invariantes (directiva de
 * Carlos): (1) es SOLO un reflejo del estado temporal del onboarding —jamás
 * persiste ids reales del backend— y (2) al autenticarse/migrar con éxito se
 * LIMPIA, porque desde ahí el backend es la fuente única y este espejo quedaría
 * obsoleto. Sirve para sobrevivir recargas/pestañas nuevas antes de crear la cuenta.
 */
const GUEST_PETS_KEY = "manada.guest_pets";

interface GuestPetsSnapshot {
  pets: Pet[];
  activePetId: string | null;
  foodAssignedAt: Record<string, string>;
}

/** Lee el espejo del invitado, filtrando defensivamente a solo ids `local_…`. */
function readGuestPets(): GuestPetsSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GUEST_PETS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestPetsSnapshot>;
    const pets = (parsed.pets ?? []).filter((p) => p && isLocalId(p.id));
    if (pets.length === 0) return null;
    return {
      pets,
      activePetId: parsed.activePetId ?? null,
      foodAssignedAt: parsed.foodAssignedAt ?? {},
    };
  } catch {
    return null;
  }
}

/**
 * Persiste el espejo del invitado. La foto vive aparte (PHOTOS_KEY) y se
 * re-superpone al leer, así que aquí se OMITE (evita duplicar el data-URL y
 * llenar la cuota). Solo se guardan las mascotas `local_…`.
 */
function writeGuestPets(
  pets: Pet[],
  activePetId: string | null,
  foodAssignedAt: Record<string, string>,
) {
  if (typeof window === "undefined") return;
  try {
    const slim = pets.map((p) => ({ ...p, avatarUrl: undefined }));
    const ids = new Set(pets.map((p) => p.id));
    const activeId = activePetId && ids.has(activePetId) ? activePetId : (pets[0]?.id ?? null);
    const assigned: Record<string, string> = {};
    for (const id of ids) if (foodAssignedAt[id]) assigned[id] = foodAssignedAt[id];
    window.localStorage.setItem(
      GUEST_PETS_KEY,
      JSON.stringify({ pets: slim, activePetId: activeId, foodAssignedAt: assigned }),
    );
  } catch (err) {
    // Cuota llena o storage bloqueado: el perfil vive igual en memoria esta sesión.
    console.warn("[pets] no se pudo guardar el perfil de invitado en el dispositivo", err);
  }
}

/** Borra el espejo del invitado (al migrar/autenticar o cerrar sesión). */
function clearGuestPets() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_PETS_KEY);
  } catch {
    // noop: si no se puede limpiar, el próximo login lo sobreescribe/ignora igual.
  }
}

export function PetProvider({ children }: { children: React.ReactNode }) {
  const { status, isLoading: sessionLoading } = useSession();
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [foodAssignedAt, setFoodAssignedAt] = useState<Record<string, string>>({});
  // Primera hidratación en curso (evita el redirect prematuro al onboarding).
  const [isHydrating, setIsHydrating] = useState(true);

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
  /** El espejo local del invitado ya se sembró (una sola vez por montaje). */
  const guestHydratedRef = useRef(false);
  /** Intención de adoptar las mascotas de invitado en la próxima autenticación
   *  (solo el registro la enciende; ver `requestGuestTransfer`). */
  const transferGuestsRef = useRef(false);

  // Hidratación del perfil según la sesión (una sola fuente de verdad por modo):
  //  · INVITADO (anónimo) → espejo local del onboarding (`localStorage`), que
  //    sobrevive recargas y pestañas nuevas.
  //  · AUTENTICADO → backend (fuente única, D34); el registro "valor primero"
  //    además EMPUJA las mascotas de invitado y luego LIMPIA el espejo local
  //    (desde aquí el backend manda; el espejo quedaría obsoleto). El login a una
  //    cuenta existente NO adopta (la memoria del onboarding se reemplaza).
  // Se espera a que la sesión resuelva (`sessionLoading`) para no sembrar el perfil
  // de invitado cuando en realidad hay una sesión persistida.
  useEffect(() => {
    if (sessionLoading) return;

    // INVITADO: sembrar desde el espejo local, una sola vez por montaje. El seteo
    // va diferido (microtask), mismo patrón que la sesión/carrito, para no encadenar
    // renders síncronos dentro del efecto.
    if (status !== "authenticated") {
      if (guestHydratedRef.current) return;
      guestHydratedRef.current = true;
      void (async () => {
        const stored = readGuestPets();
        if (stored) {
          const seeded = overlayStoredPhotos(stored.pets).map((p) => ({
            ...p,
            completeness: profileCompleteness(p),
          }));
          setPets(seeded);
          setFoodAssignedAt(stored.foodAssignedAt);
          setActivePetId((prev) => {
            if (prev) return prev;
            const wanted = stored.activePetId;
            return wanted && seeded.some((p) => p.id === wanted) ? wanted : seeded[0].id;
          });
        }
        setIsHydrating(false);
      })();
      return;
    }

    // AUTENTICADO: fuente única = backend. syncingRef evita el doble efecto de StrictMode.
    if (syncingRef.current) return;
    syncingRef.current = true;

    // Leer y consumir el intent: si no lo encendió el registro, no adoptamos nada.
    const transferGuests = transferGuestsRef.current;
    transferGuestsRef.current = false;

    void (async () => {
      // Solo se limpia el espejo local si NO falló una migración (para no perder
      // una mascota aún no persistida). Cierra la garantía "migrado ⇒ limpio".
      let migrationFailed = false;
      try {
        // 1 · Push de mascotas locales (espejo de transferCart) — SOLO en registro.
        //     Se conserva también su alimento asignado (el backend re-estampa la fecha).
        let nextActiveId: string | null = null;

        if (transferGuests) {
          const locals = petsRef.current.filter((p) => isLocalId(p.id));
          const activeLocalId = activePetIdRef.current;
          for (const guest of locals) {
            try {
              const created = await createMyPet(guest);
              if (guest.currentFoodId) {
                await updateMyPet(created.id, { current_food_id: guest.currentFoodId });
              }
              // La foto del dispositivo sigue a la mascota a su id real.
              migrateStoredPhoto(guest.id, created.id);
              if (guest.id === activeLocalId) nextActiveId = created.id;
            } catch (err) {
              migrationFailed = true;
              console.warn("[pets] no se pudo transferir una mascota de invitado", err);
            }
          }
        }

        // 2 · Hidratar desde la fuente única (+ fotos guardadas en el dispositivo).
        const { pets: remote, foodAssignedAt: assignedAt } = await listMyPets();
        setPets(overlayStoredPhotos(remote));
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
        // Ya autenticado y con el backend como fuente única → el espejo local es
        // obsoleto: se limpia (salvo migración fallida, para no perder datos).
        if (!migrationFailed) clearGuestPets();
        setIsHydrating(false);
        syncingRef.current = false;
      }
    })();
  }, [status, sessionLoading]);

  // Espejo local del perfil de INVITADO: solo en modo anónimo y solo ids `local_…`.
  // Sobrevive recargas hasta que se cree la cuenta y se migre (donde se limpia).
  useEffect(() => {
    if (sessionLoading || status === "authenticated") return;
    const localPets = pets.filter((p) => isLocalId(p.id));
    if (localPets.length > 0) writeGuestPets(localPets, activePetId, foodAssignedAt);
  }, [pets, activePetId, foodAssignedAt, status, sessionLoading]);

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

  const requestGuestTransfer = useCallback(() => {
    transferGuestsRef.current = true;
  }, []);

  const clearPets = useCallback(() => {
    setPets([]);
    setActivePetId(null);
    setFoodAssignedAt({});
    clearGuestPets(); // cerrar sesión olvida también el espejo de invitado.
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

  const setPetPhoto = useCallback<PetContextValue["setPetPhoto"]>((petId, dataUrl) => {
    setPets((prev) =>
      prev.map((p) => {
        if (p.id !== petId) return p;
        const next = { ...p, avatarUrl: dataUrl ?? undefined };
        next.completeness = profileCompleteness(next);
        return next;
      }),
    );
    writeStoredPhoto(petId, dataUrl);
  }, []);

  const value = useMemo<PetContextValue>(
    () => ({
      pets,
      activePet: pets.find((p) => p.id === activePetId) ?? null,
      setActivePetId,
      addPet,
      requestGuestTransfer,
      clearPets,
      assignFood,
      updatePet,
      setPetPhoto,
      foodAssignedAt,
      isHydrating,
    }),
    [pets, activePetId, addPet, requestGuestTransfer, clearPets, assignFood, updatePet, setPetPhoto, foodAssignedAt, isHydrating],
  );

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePet(): PetContextValue {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error("usePet debe usarse dentro de <PetProvider>");
  return ctx;
}
