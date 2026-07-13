import type { LifeStage, Pet, Species } from "@/types";

/**
 * Motor de anticipación + nutrición (determinístico, sin IA).
 *
 * La ración ya no es un "g/kg" plano: se calcula con el estándar veterinario
 * RER/MER (NRC 2006 / WSAVA) y la densidad calórica real del alimento, para que
 * cada número sea reproducible y defendible frente a un veterinario. La
 * anticipación (cuándo se acaba el saco) se deriva de esa ración. Ver UX.md §3.
 */

/**
 * Objetivo de peso (proxy de condición corporal). Hoy default `mantener`; el
 * motor ya lo soporta para cuando el perfil lo capture (trabajo futuro).
 */
export type WeightGoal = "mantener" | "bajar" | "subir";

/** Perfil energético mínimo para el cálculo RER/MER. */
export interface EnergyProfile {
  species: Species;
  stage: LifeStage;
  weightKg: number;
  neutered?: boolean;
  weightGoal?: WeightGoal;
}

/**
 * Densidad calórica de referencia (kcal/kg de energía metabolizable) para estimar
 * la ración cuando aún no hay un alimento elegido (onboarding, preview). Valor
 * típico de alimento seco; en cuanto hay un producto se usa su `kcalPerKg` real.
 */
export const REFERENCE_KCAL_PER_KG = 3500;

/**
 * RER — Requerimiento Energético en Reposo (kcal/día). Fórmula alométrica estándar
 * `70 × peso^0.75`, válida en todo el rango de peso.
 */
export function restingEnergyKcal(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75);
}

/**
 * Factor MER (k), como reglas explícitas y editables: MER = RER × k. Base por
 * especie×etapa + modificadores aditivos por esterilización y objetivo de peso
 * (solo en adulto/senior; en crecimiento domina el factor de la etapa). Valores
 * de referencia NRC 2006 / WSAVA — cambiar aquí ajusta todo el motor.
 */
const MER_BASE: Record<Species, Record<LifeStage, number>> = {
  perro: { cachorro: 2.5, adulto: 1.8, senior: 1.4 },
  gato: { cachorro: 2.5, adulto: 1.4, senior: 1.2 },
  otro: { cachorro: 2.5, adulto: 1.8, senior: 1.4 }, // fallback = perro
};
const NEUTER_ADJUST = -0.2;
const GOAL_ADJUST: Record<WeightGoal, number> = { mantener: 0, bajar: -0.4, subir: 0.2 };

export function merFactor(pet: EnergyProfile): number {
  let k = MER_BASE[pet.species][pet.stage];
  if (pet.stage !== "cachorro") {
    if (pet.neutered) k += NEUTER_ADJUST;
    k += GOAL_ADJUST[pet.weightGoal ?? "mantener"];
  }
  return Math.min(5, Math.max(0.8, Math.round(k * 100) / 100));
}

/** MER — Requerimiento Energético de Mantención (kcal/día) = RER × k. */
export function dailyEnergyKcal(pet: EnergyProfile): number {
  return Math.round(restingEnergyKcal(pet.weightKg) * merFactor(pet));
}

/**
 * Ración diaria en gramos = MER ÷ densidad calórica del alimento. Con el
 * `kcalPerKg` real del producto la ración es exacta; sin él usa la densidad de
 * referencia (estimación honesta hasta que se elige un alimento).
 */
export function dailyRationGrams(
  pet: EnergyProfile,
  kcalPerKg: number = REFERENCE_KCAL_PER_KG,
): number {
  return Math.round((dailyEnergyKcal(pet) * 1000) / kcalPerKg);
}

export interface RunOutEstimate {
  /** Días restantes de alimento. */
  daysLeft: number;
  /** % del saco que queda (0–100), para la barra de progreso. */
  percentLeft: number;
  /** Fecha estimada en que se agota. */
  runOutDate: Date;
  /** Días transcurridos desde la compra/asignación (línea de tiempo del saco). */
  daysSincePurchase: number;
}

/**
 * Estima cuándo se agota el alimento a partir del tamaño del saco, la ración
 * diaria y los días transcurridos desde la compra.
 */
export function estimateRunOut(
  bagKg: number,
  rationGrams: number,
  daysSincePurchase: number,
): RunOutEstimate {
  const totalDays = Math.max(1, Math.round((bagKg * 1000) / rationGrams));
  const daysLeft = Math.max(0, totalDays - daysSincePurchase);
  const percentLeft = Math.round((daysLeft / totalDays) * 100);
  const runOutDate = new Date();
  runOutDate.setDate(runOutDate.getDate() + daysLeft);
  return { daysLeft, percentLeft, runOutDate, daysSincePurchase };
}

/** kg del saco a partir del formato del producto ("3 kg" → 3; "500 g"/undefined → undefined). */
export function bagKgFromFormat(format?: string): number | undefined {
  if (!format || !/kg/i.test(format)) return undefined;
  const n = parseFloat(format);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Anticipación REAL de una mascota para el alimento que tiene asignado
 * (`pet.currentFoodId`). Deriva la ración del peso + etapa y estima cuándo se
 * agota el saco contando desde la fecha de asignación (el reloj arranca cuando
 * el dueño nos dice qué come). Devuelve `null` si faltan datos —sin peso o sin
 * tamaño de saco— para que la UI degrade sin romperse.
 *
 * Reemplaza al demo `TOBY_ANTICIPATION`: ahora los días restantes salen del
 * alimento y la mascota reales (PET_EXPERIENCE Bloque 6).
 */
export function petFoodAnticipation(
  pet: { weightKg?: number; stage: LifeStage; species: Species; neutered?: boolean },
  food: { format?: string; kcalPerKg?: number },
  assignedAtISO?: string,
): RunOutEstimate | null {
  if (!pet.weightKg) return null;
  const bagKg = bagKgFromFormat(food.format);
  if (!bagKg) return null;
  const ration = dailyRationGrams(
    { species: pet.species, stage: pet.stage, weightKg: pet.weightKg, neutered: pet.neutered },
    food.kcalPerKg,
  );
  const assignedAt = assignedAtISO ? new Date(assignedAtISO).getTime() : Date.now();
  const daysSince = Math.max(0, Math.floor((Date.now() - assignedAt) / 86_400_000));
  return estimateRunOut(bagKg, ration, daysSince);
}

/** Sugerencia de transición de fórmula por etapa de vida (cross-sell suave). */
export function suggestStageTransition(pet: Pet): string | null {
  if (pet.stage === "cachorro") {
    return `${pet.name} pronto pasará a fórmula adulta; te avisaremos a tiempo.`;
  }
  if (pet.stage === "senior") {
    return `A los ${pet.stage}s les va mejor una fórmula con apoyo articular.`;
  }
  return null;
}
