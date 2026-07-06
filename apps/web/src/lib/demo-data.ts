import type { AnticipationNudge, CartItem, Pet, ShippingEstimate } from "@/types";
import { PRODUCT_BY_ID } from "./data/catalog";
import { dailyRationGrams, estimateRunOut, type RunOutEstimate } from "./anticipation";

export * from "./data/catalog";

/**
 * Datos demo consistentes para todo el prototipo (PROTOTYPE_BRIEF §2).
 * Usuario "Carlos", perro "Toby" (adulto, 8 kg, Ñuñoa/RM).
 * Sirven para mostrar personalización y anticipación hasta conectar backend (Fase 4).
 */

export const DEMO_USER = {
  id: "u_carlos",
  firstName: "Carlos",
  comuna: "Ñuñoa",
  region: "Región Metropolitana",
} as const;

export const DEMO_PETS: Pet[] = [
  {
    id: "pet_toby",
    name: "Toby",
    species: "perro",
    stage: "adulto",
    weightKg: 8,
    breed: "Mestizo",
    neutered: true,
    conditions: [],
    currentFoodId: "prod_rc_adult_3kg",
    completeness: 75,
  },
];

/** Mascota activa por defecto en el selector global. */
export const DEFAULT_PET = DEMO_PETS[0];

/**
 * Días desde la última compra de alimento de Toby (demo).
 * Es la ÚNICA palanca temporal del cálculo de anticipación: cambiarla mueve
 * de forma coherente días restantes, % del saco y fecha en TODA la app.
 */
const TOBY_DAYS_SINCE_PURCHASE = 16;

/** Saco del alimento actual de Toby en kg (prod_rc_adult_3kg = 3 kg). */
const TOBY_BAG_KG = 3;

/**
 * Anticipación de Toby derivada de una sola fuente (peso + etapa + saco + días).
 * Fuente de verdad de fechas/porcentajes para Home, cápsula y perfil → evita
 * que "se acaba el 2 jul" y "~18%" se contradigan (AUDIT_UI_UX U040, U056).
 */
export const TOBY_ANTICIPATION: RunOutEstimate = estimateRunOut(
  TOBY_BAG_KG,
  dailyRationGrams(DEFAULT_PET.weightKg ?? 8, DEFAULT_PET.stage),
  TOBY_DAYS_SINCE_PURCHASE,
);

/** Carrito demo (2 líneas) para Carrito, Drawer y OrderSummary. */
export const DEMO_CART: CartItem[] = [
  { product: PRODUCT_BY_ID.get("prod_rc_adult_3kg")!, quantity: 1, subscriptionWeeks: 4 },
  { product: PRODUCT_BY_ID.get("prod_nexgard_m")!, quantity: 2 },
];

/** Estimación de despacho honesta por defecto (Ñuñoa, mañana, gratis). */
export const DEMO_SHIPPING: ShippingEstimate = {
  comuna: DEMO_USER.comuna,
  date: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  })(),
  cost: 0,
};

/** Cápsula de anticipación demo para Toby (Home + perfil de mascota). */
export const DEMO_NUDGE: AnticipationNudge = {
  id: "nudge_toby_recompra",
  petId: "pet_toby",
  kind: "recompra",
  title: `A Toby le quedan ~${TOBY_ANTICIPATION.daysLeft} días de comida`,
  body: "¿La reagendamos para que no le falte?",
  reason:
    "Lo estimamos con el tamaño de su último saco (3 kg), su peso (8 kg) y los días desde tu compra. Es una sugerencia, no un cobro.",
};
