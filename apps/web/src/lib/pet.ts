import type { Pet } from "@/types";

/**
 * Condiciones de salud curadas — FUENTE ÚNICA del vocabulario (D38).
 * Se eligen de un tap (patrón Chip del onboarding pre-F1); el texto libre quedó
 * descartado por inconsistente y propenso a errores. Las consumen el perfil
 * (PetEditDialog) y, cuando exista, el paso opcional de salud del funnel.
 */
export const PET_CONDITIONS = [
  "Sobrepeso",
  "Piel sensible",
  "Problemas renales",
  "Articulaciones",
  "Digestión sensible",
] as const;

/**
 * Completitud del perfil de mascota a partir de dimensiones concretas, para que
 * el porcentaje y la lista de "lo que falta" SIEMPRE coincidan (AUDIT_UI_UX U054).
 * El perfil es el núcleo del producto (UX.md §3): cada dato habilita mejor cuidado.
 */

export interface ProfileDimension {
  key: string;
  /** Etiqueta accionable del campo que falta ("Agrega una foto"). */
  label: string;
  /** Por qué pedirlo (valor para el dueño, no para nosotros). */
  hint: string;
  done: boolean;
}

export function profileChecklist(pet: Pet): ProfileDimension[] {
  return [
    { key: "name", label: "Nombre", hint: "Para personalizar todo", done: Boolean(pet.name) },
    { key: "species", label: "Especie", hint: "Perro, gato u otro", done: Boolean(pet.species) },
    { key: "stage", label: "Etapa de vida", hint: "Ajusta la fórmula y la ración", done: Boolean(pet.stage) },
    { key: "weight", label: "Peso", hint: "Calcula la ración diaria y los días de comida", done: typeof pet.weightKg === "number" },
    { key: "breed", label: "Raza", hint: "Afina recomendaciones de salud", done: Boolean(pet.breed) },
    { key: "neutered", label: "Esterilización", hint: "Cambia las necesidades calóricas", done: typeof pet.neutered === "boolean" },
    { key: "photo", label: "Una foto", hint: "Para reconocerlo de un vistazo", done: Boolean(pet.avatarUrl) },
    { key: "health", label: "Info de salud", hint: "Filtra el catálogo a lo seguro para él", done: (pet.conditions?.length ?? 0) > 0 },
  ];
}

/** % de completitud derivado de las dimensiones (coincide con la lista de faltantes). */
export function profileCompleteness(pet: Pet): number {
  const dims = profileChecklist(pet);
  const done = dims.filter((d) => d.done).length;
  return Math.round((done / dims.length) * 100);
}

/** Solo las dimensiones que faltan, para "lo que falta para el 100%". */
export function missingProfileFields(pet: Pet): ProfileDimension[] {
  return profileChecklist(pet).filter((d) => !d.done);
}
