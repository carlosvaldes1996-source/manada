import type { LifeStage, Pet, Product } from "@/types";
import { formatCLP } from "./format";
import {
  dailyEnergyKcal,
  dailyRationGrams,
  estimateRunOut,
  REFERENCE_KCAL_PER_KG,
  type RunOutEstimate,
} from "./anticipation";

/**
 * Motor de recomendaciones (el "se adelantó por mí").
 *
 * Lógica PURA sobre el catálogo que recibe: el caller (un server component)
 * provee los productos reales de la Store API y este módulo elige el alimento
 * que mejor calza al perfil, ofrece alternativas igual de válidas y explica POR
 * QUÉ, para que la pantalla de recomendación (Funnel F4) asesore en vez de
 * vender una sola opción (FUNNEL_TARGET §1.5). Sin fuente de datos propia:
 * el backend es la única verdad del catálogo (O5).
 */

export const STAGE_LABEL: Record<LifeStage, string> = {
  cachorro: "cachorro",
  adulto: "adulto",
  senior: "senior",
};

/** Tamaño del saco en kg a partir del formato ("3 kg" → 3). */
function bagKg(product: Product): number | undefined {
  if (!product.format || !/kg/i.test(product.format)) return undefined;
  const n = parseFloat(product.format);
  return Number.isFinite(n) ? n : undefined;
}

/** Precio por kilo del saco, si el formato está expresado en kg. */
export function pricePerKg(product: Product): number | undefined {
  const kg = bagKg(product);
  return kg == null ? undefined : Math.round(product.price.current / kg);
}

/* ------------------------ Reglas del motor (predicados) ------------------- */
// Predicados compartidos: el MISMO hecho decide el ranking y sostiene la razón
// que se le muestra al dueño. Nada se afirma sin haberlo verificado aquí.

/** ¿El alimento declara explícitamente la etapa de la mascota? (no "universal"). */
function declaresStage(product: Product, pet: Pet): boolean {
  return Boolean(product.stage?.includes(pet.stage));
}

/** ¿Apto para la etapa? Universal (sin etapa) o la incluye. */
function stageAppropriate(product: Product, pet: Pet): boolean {
  return !product.stage || product.stage.length === 0 || product.stage.includes(pet.stage);
}

/** Condiciones de la mascota para las que ESTE alimento está formulado (verificado). */
function targetedConditions(product: Product, pet: Pet): string[] {
  if (!pet.conditions?.length || !product.suitableConditions?.length) return [];
  return pet.conditions.filter((c) => product.suitableConditions!.includes(c));
}

/** Condiciones de la mascota para las que el alimento está contraindicado (seguridad). */
function contraindicatedFor(product: Product, pet: Pet): string[] {
  if (!pet.conditions?.length || !product.notFor?.length) return [];
  return pet.conditions.filter((c) => product.notFor!.includes(c));
}

/* -------------------------------- Ranking --------------------------------- */

/**
 * PUERTAS DURAS (reglas obligatorias). Un alimento solo es elegible si es de la
 * especie de la mascota, apto para su etapa y NO está contraindicado para sus
 * condiciones. Garantía del MVP: **nunca se recomienda un alimento incompatible**.
 */
export function isEligibleFood(product: Product, pet: Pet): boolean {
  return (
    product.category === "alimento" &&
    product.species.includes(pet.species) &&
    stageAppropriate(product, pet) &&
    contraindicatedFor(product, pet).length === 0
  );
}

/**
 * Pesos del score de PREFERENCIA (se aplica solo sobre alimentos ya elegibles).
 * Reglas explícitas en un solo lugar: cada criterio suma su aporte, mayor total =
 * mejor calce. Fácil de ajustar sin tocar la lógica. (Futuro: `sizeMatch`,
 * `weightManagement`, valor por 1.000 kcal — ver RECOMMENDATION_ENGINE.md.)
 */
export const RANKING_WEIGHTS = {
  stageExact: 3, // etapa declarada para la mascota (vs. fórmula universal)
  conditionTarget: 3, // formulado para una condición de la mascota
  availability: 2, // en stock
  editorialRating: 1, // valoración editorial (desempate)
} as const;

/** Puntúa el calce por preferencia (asume el alimento ya pasó las puertas). */
function scoreFood(product: Product, pet: Pet): number {
  let score = 0;
  if (declaresStage(product, pet)) score += RANKING_WEIGHTS.stageExact;
  if (targetedConditions(product, pet).length > 0) score += RANKING_WEIGHTS.conditionTarget;
  if (product.stock > 0) score += RANKING_WEIGHTS.availability;
  score += ((product.rating?.value ?? 0) / 5) * RANKING_WEIGHTS.editorialRating;
  return score;
}

/**
 * Alimentos ELEGIBLES para la mascota (pasan las puertas duras), ordenados de
 * mejor a peor calce. Base para la recomendada y sus alternativas: todo lo que
 * sale de aquí es, por construcción, compatible con la mascota.
 */
export function recommendFoodRanked(pet: Pet, products: Product[]): Product[] {
  return products
    .filter((p) => isEligibleFood(p, pet))
    .sort((a, b) => scoreFood(b, pet) - scoreFood(a, pet));
}

/**
 * Mejor alimento para la mascota (la que elegiríamos): el primero del ranking.
 * Devuelve `undefined` si el catálogo no tiene nada compatible para su perfil.
 */
export function recommendFood(pet: Pet, products: Product[]): Product | undefined {
  return recommendFoodRanked(pet, products)[0];
}

/**
 * Alternativas "igual de válidas" al alimento elegido (FUNNEL_TARGET §1.5): ya
 * son elegibles (misma especie, etapa apropiada, sin contraindicación), en stock,
 * excluyendo la elegida. No son de segunda: matan la sensación de una sola vía.
 */
export function recommendFoodAlternatives(
  pet: Pet,
  products: Product[],
  chosen: Product,
  limit = 2,
): Product[] {
  return recommendFoodRanked(pet, products)
    .filter((p) => p.id !== chosen.id && p.stock > 0)
    .slice(0, limit);
}

/**
 * Razones por las que este alimento le calza a la mascota — **derivadas solo de
 * reglas que el motor realmente ejecutó**. No se afirma nada que no se haya
 * verificado (p. ej. una condición solo se menciona si el alimento la declara).
 * Sostiene el "por qué te lo decimos" con transparencia honesta.
 */
export function foodReasons(pet: Pet, food: Product): string[] {
  const reasons: string[] = [];
  const stageTxt = STAGE_LABEL[pet.stage];

  // 1 · Etapa — verificada por la puerta (el alimento es apto para su etapa).
  if (declaresStage(food, pet)) {
    reasons.push(
      `Formulado para ${pet.species} ${stageTxt}: cubre la energía y los nutrientes de esta etapa.`,
    );
  } else {
    reasons.push(`Apto para todas las etapas, incluida la de ${pet.name} (${stageTxt}).`);
  }

  // 2 · Condición — SOLO si el alimento la declara. Nunca se afirma sin dato.
  const targeted = targetedConditions(food, pet);
  if (targeted.length > 0) {
    reasons.push(`Formulado para su condición (${targeted.join(", ")}).`);
  }

  // 3 · Ración — cálculo real RER/MER si hay peso (transparente y verificable).
  if (pet.weightKg != null) {
    const approx = pet.weightSource && pet.weightSource !== "exacto" ? "~" : "";
    const profile = {
      species: pet.species,
      stage: pet.stage,
      weightKg: pet.weightKg,
      neutered: pet.neutered,
    };
    const energy = dailyEnergyKcal(profile);
    if (food.kcalPerKg) {
      const grams = dailyRationGrams(profile, food.kcalPerKg);
      reasons.push(
        `Ración calculada para sus ${approx}${pet.weightKg} kg: ~${grams} g/día (${energy} kcal), según la densidad de este alimento.`,
      );
    } else {
      reasons.push(
        `Su requerimiento es ~${energy} kcal/día, calculado con sus ${approx}${pet.weightKg} kg y su etapa.`,
      );
    }
  } else {
    reasons.push(`Calcularemos su ración exacta en cuanto nos confirmes su peso.`);
  }

  // 4 · Cierre editorial honesto — solo si hay valoración alta y queda espacio.
  if (reasons.length < 3 && food.rating && food.rating.value >= 4.5) {
    reasons.push(
      `${food.brand.name}: muy bien valorada por otras familias (${food.rating.value.toFixed(1)}★).`,
    );
  }

  return reasons.slice(0, 3);
}

/**
 * El "mejor si…" de una alternativa frente a la elegida: por qué alguien podría
 * preferirla (rendimiento por kilo · formato · valoración). Honesto y concreto.
 */
export function alternativeAngle(alt: Product, chosen: Product, pet: Pet): string {
  const altPerKg = pricePerKg(alt);
  const chosenPerKg = pricePerKg(chosen);
  if (altPerKg != null && chosenPerKg != null && altPerKg < chosenPerKg) {
    return `Mejor si buscas rendimiento: ${formatCLP(altPerKg)} por kilo.`;
  }

  const altKg = bagKg(alt);
  const chosenKg = bagKg(chosen);
  if (altKg != null && chosenKg != null && altKg < chosenKg) {
    return `Mejor si prefieres un formato más manejable (${alt.format}).`;
  }

  if ((alt.rating?.value ?? 0) > (chosen.rating?.value ?? 0)) {
    return `Mejor si te guías por lo más valorado (${alt.rating!.value.toFixed(1)}★).`;
  }

  return `Otra fórmula de confianza para ${pet.species} ${STAGE_LABEL[pet.stage]}.`;
}

/**
 * Complementos de cuidado para el riel "también podría servirle": misma especie,
 * otra categoría (farmacia/accesorios), en stock primero.
 */
export function recommendComplements(pet: Pet, products: Product[], limit = 4): Product[] {
  return products
    .filter((p) => p.category !== "alimento" && p.species.includes(pet.species))
    .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0))
    .slice(0, limit);
}

export interface FoodPlan {
  /** Requerimiento energético diario (MER, kcal) — base del cálculo. */
  energyKcal: number;
  /** Ración diaria en gramos (MER ÷ densidad calórica del alimento). */
  rationGrams: number;
  /** Duración estimada del saco para esta mascota. */
  estimate: RunOutEstimate;
  /** Precio por kilo del saco recomendado, si aplica. */
  pricePerKg?: number;
  /** true si se usó la densidad de referencia (el producto no declara kcal/kg). */
  densityAssumed: boolean;
}

/**
 * Plan de alimentación de un saco recién comprado: cuánta energía necesita, cuánto
 * come al día (según la densidad del alimento), cuántos días le dura y cuándo
 * reponerlo (saco lleno → `daysSincePurchase=0`). Reutiliza el motor RER/MER para
 * que la ración y la fecha sean coherentes en toda la app.
 */
export function foodPlan(pet: Pet, product: Product): FoodPlan | undefined {
  if (pet.weightKg == null) return undefined;
  const kg = bagKg(product);
  if (kg == null) return undefined;
  const profile = {
    species: pet.species,
    stage: pet.stage,
    weightKg: pet.weightKg,
    neutered: pet.neutered,
  };
  const energyKcal = dailyEnergyKcal(profile);
  const kcalPerKg = product.kcalPerKg ?? REFERENCE_KCAL_PER_KG;
  const rationGrams = dailyRationGrams(profile, kcalPerKg);
  return {
    energyKcal,
    rationGrams,
    estimate: estimateRunOut(kg, rationGrams, 0),
    pricePerKg: Math.round(product.price.current / kg),
    densityAssumed: product.kcalPerKg == null,
  };
}
