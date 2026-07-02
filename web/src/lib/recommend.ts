import type { Pet, Product } from "@/types";
import { PRODUCTS } from "./data/catalog";
import { dailyRationGrams, estimateRunOut, type RunOutEstimate } from "./anticipation";

/**
 * Motor de recomendaciones (stub determinista — el "se adelantó por mí").
 *
 * A partir del perfil de mascota recién creado elige el alimento que mejor le
 * calza y calcula cuánto durará y cuándo reponerlo, para que la pantalla de
 * recomendación pruebe que Manada YA conoce a la mascota (UX.md §3, journey A/D).
 * En Fase 4 se reemplaza por datos reales de consumo y catálogo del backend.
 */

/** Tamaño del saco en kg a partir del formato ("3 kg" → 3). */
function bagKg(product: Product): number | undefined {
  if (!product.format || !/kg/i.test(product.format)) return undefined;
  const n = parseFloat(product.format);
  return Number.isFinite(n) ? n : undefined;
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
 * Mejor alimento para la mascota: misma especie, priorizando etapa, stock y
 * suscribible. Devuelve `undefined` si el catálogo no tiene nada para su especie.
 */
export function recommendFood(pet: Pet): Product | undefined {
  const candidates = PRODUCTS.filter(
    (p) => p.category === "alimento" && p.species.includes(pet.species),
  );
  if (candidates.length === 0) return undefined;
  return [...candidates].sort((a, b) => scoreFood(b, pet) - scoreFood(a, pet))[0];
}

/**
 * Complementos de cuidado para el riel "también podría servirle": misma especie,
 * otra categoría (farmacia/accesorios), en stock primero.
 */
export function recommendComplements(pet: Pet, limit = 4): Product[] {
  return PRODUCTS.filter(
    (p) => p.category !== "alimento" && p.species.includes(pet.species),
  )
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
