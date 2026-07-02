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
  return { daysLeft, percentLeft, runOutDate };
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
