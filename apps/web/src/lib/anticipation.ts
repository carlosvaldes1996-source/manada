import type { LifeStage, Pet } from "@/types";

/**
 * Motor de anticipación (stub con reglas estáticas — el diferenciador del producto).
 * En Fase 4 se reemplaza por datos reales de consumo. Aquí calcula, de forma
 * determinista a partir del perfil de mascota, lo que la UI "se adelanta" a ofrecer.
 * Ver DESIGN_SYSTEM §12.2 y UX.md §3.
 */

/** Ración diaria aproximada en gramos (demo: ~18 g/kg adulto, ajustada por etapa). */
export function dailyRationGrams(weightKg: number, stage: LifeStage): number {
  const perKg = stage === "cachorro" ? 26 : stage === "senior" ? 15 : 18;
  return Math.round(weightKg * perKg);
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
  pet: { weightKg?: number; stage: LifeStage },
  food: { format?: string },
  assignedAtISO?: string,
): RunOutEstimate | null {
  if (!pet.weightKg) return null;
  const bagKg = bagKgFromFormat(food.format);
  if (!bagKg) return null;
  const ration = dailyRationGrams(pet.weightKg, pet.stage);
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
