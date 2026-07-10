import type { LifeStage, Pet, Product } from "@/types";
import { formatCLP } from "./format";
import { dailyRationGrams, estimateRunOut, type RunOutEstimate } from "./anticipation";

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

/** ¿El alimento es apropiado para la etapa de la mascota? (sin etapa = universal). */
function stageAppropriate(product: Product, pet: Pet): boolean {
  return !product.stage || product.stage.length === 0 || product.stage.includes(pet.stage);
}

/** Puntúa qué tan bien calza un alimento con la mascota (mayor = mejor). */
function scoreFood(product: Product, pet: Pet): number {
  let score = 0;
  if (pet.stage && product.stage?.includes(pet.stage)) score += 4;
  if (product.stock > 0) score += 2;
  if (product.subscribable) score += 1;
  score += (product.rating?.value ?? 0) / 10; // desempate fino por valoración
  return score;
}

/**
 * Alimentos para la especie de la mascota, ordenados de mejor a peor calce
 * (etapa, stock, valoración). Base para la recomendada y sus alternativas.
 */
export function recommendFoodRanked(pet: Pet, products: Product[]): Product[] {
  return products
    .filter((p) => p.category === "alimento" && p.species.includes(pet.species))
    .sort((a, b) => scoreFood(b, pet) - scoreFood(a, pet));
}

/**
 * Mejor alimento para la mascota (la que elegiríamos): el primero del ranking.
 * Devuelve `undefined` si el catálogo no tiene nada para su especie.
 */
export function recommendFood(pet: Pet, products: Product[]): Product | undefined {
  return recommendFoodRanked(pet, products)[0];
}

/**
 * Alternativas "igual de válidas" al alimento elegido (FUNNEL_TARGET §1.5): misma
 * especie, **etapa apropiada** (nunca comida de cachorro para un adulto), en stock,
 * excluyendo la elegida. No son de segunda: matan la sensación de una sola vía.
 */
export function recommendFoodAlternatives(
  pet: Pet,
  products: Product[],
  chosen: Product,
  limit = 2,
): Product[] {
  return recommendFoodRanked(pet, products)
    .filter((p) => p.id !== chosen.id && p.stock > 0 && stageAppropriate(p, pet))
    .slice(0, limit);
}

/**
 * Las 3 razones concretas por las que este alimento le calza a la mascota,
 * atadas a su perfil (etapa · talla/peso · condición o marca). Es educación real,
 * no una aseveración: sostiene el "por qué te lo decimos" con transparencia.
 */
export function foodReasons(pet: Pet, food: Product): string[] {
  const reasons: string[] = [];
  const stageTxt = STAGE_LABEL[pet.stage];

  reasons.push(
    `Fórmula para ${pet.species} ${stageTxt}: la energía y la proteína que ${pet.name} necesita en esta etapa.`,
  );

  if (pet.weightKg != null) {
    const approx = pet.weightSource && pet.weightSource !== "exacto" ? "~" : "";
    reasons.push(`Croqueta y ración pensadas para sus ${approx}${pet.weightKg} kg.`);
  } else {
    reasons.push(`La ajustamos a su tamaño en cuanto nos confirmes su peso.`);
  }

  if (pet.conditions?.length) {
    reasons.push(`Sin los ingredientes que su condición (${pet.conditions.join(", ")}) no tolera.`);
  } else if (food.rating && food.rating.value >= 4.5) {
    reasons.push(`${food.brand.name}: una fórmula muy bien valorada por otras familias.`);
  } else {
    reasons.push(`${food.brand.name}: la elegimos por su perfil, no por inventario.`);
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
  /** Ración diaria estimada en gramos (peso + etapa). */
  rationGrams: number;
  /** Duración estimada del saco para esta mascota. */
  estimate: RunOutEstimate;
  /** Precio por kilo del saco recomendado, si aplica. */
  pricePerKg?: number;
}

/**
 * Plan de alimentación de un saco recién comprado: cuánto come al día, cuántos
 * días le dura y cuándo habría que reponerlo (saco lleno → `daysSincePurchase=0`).
 * Reutiliza el motor de anticipación para que la fecha sea coherente con la app.
 */
export function foodPlan(pet: Pet, product: Product): FoodPlan | undefined {
  if (pet.weightKg == null) return undefined;
  const kg = bagKg(product);
  if (kg == null) return undefined;
  const rationGrams = dailyRationGrams(pet.weightKg, pet.stage);
  return {
    rationGrams,
    estimate: estimateRunOut(kg, rationGrams, 0),
    pricePerKg: Math.round(product.price.current / kg),
  };
}
