import type { AnticipationNudge, Brand, CartItem, Pet, Product, ShippingEstimate } from "@/types";
import type { Review } from "@/components/commerce/review-card";
import { dailyRationGrams, estimateRunOut, type RunOutEstimate } from "./anticipation";

/**
 * FIXTURES DEMO — únicamente para dos superficies que NO son flujo real:
 *
 * 1. El hero de la landing anónima (`landing-view.tsx`): preview del concepto de
 *    anticipación con "Toby" (decisión de marca, D28 — se conserva tal cual).
 * 2. El styleguide `/dev/components` (gateado en prod, D29): productos, carrito,
 *    reseñas y mascota de muestra para renderizar la Component Library.
 *
 * Ningún flujo real consume este archivo: catálogo, carrito, checkout, cuentas,
 * recomendación y anticipación corren sobre el backend (D23–D28, B6, O5/D33).
 */

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

/**
 * Días desde la última compra de alimento de Toby (demo).
 * Es la ÚNICA palanca temporal del cálculo de anticipación: cambiarla mueve
 * de forma coherente días restantes, % del saco y fecha en el hero.
 */
const TOBY_DAYS_SINCE_PURCHASE = 16;

/** Saco del alimento actual de Toby en kg (demo: saco de 3 kg). */
const TOBY_BAG_KG = 3;

/**
 * Anticipación de Toby derivada de una sola fuente (peso + etapa + saco + días).
 * Fuente de verdad de fechas/porcentajes del hero de la landing → evita que
 * "se acaba el 2 jul" y "~18%" se contradigan (AUDIT_UI_UX U040, U056).
 */
export const TOBY_ANTICIPATION: RunOutEstimate = estimateRunOut(
  TOBY_BAG_KG,
  dailyRationGrams(DEMO_PETS[0].weightKg ?? 8, DEMO_PETS[0].stage),
  TOBY_DAYS_SINCE_PURCHASE,
);

/** Marcas de muestra (BrandCard del styleguide). */
export const BRANDS: Brand[] = [
  { id: "b_royal_canin", name: "Royal Canin", slug: "royal-canin" },
  { id: "b_pro_plan", name: "Pro Plan", slug: "pro-plan" },
  { id: "b_hills", name: "Hill's", slug: "hills" },
  { id: "b_acana", name: "Acana", slug: "acana" },
  { id: "b_nexgard", name: "NexGard", slug: "nexgard" },
];

const brand = (slug: string) => BRANDS.find((b) => b.slug === slug)!;

/** Productos de muestra (ProductCard/Grid/Rail, facetas y carrito del styleguide). */
export const PRODUCTS: Product[] = [
  {
    id: "prod_rc_adult_3kg",
    slug: "royal-canin-adulto-razas-pequenas-3kg",
    name: "Adulto Razas Pequeñas",
    brand: brand("royal-canin"),
    category: "alimento",
    species: ["perro"],
    stage: ["adulto"],
    price: { current: 24990, compareAt: 29990 },
    format: "3 kg",
    rating: { value: 4.8, count: 212 },
    imageUrl: "🐕",
    subscribable: true,
    subscriptionDiscount: 15,
    stock: 24,
  },
  {
    id: "prod_proplan_adult_15kg",
    slug: "pro-plan-adulto-15kg",
    name: "Adulto Complete Essentials",
    brand: brand("pro-plan"),
    category: "alimento",
    species: ["perro"],
    stage: ["adulto"],
    price: { current: 54990 },
    format: "15 kg",
    rating: { value: 4.7, count: 489 },
    imageUrl: "🐕",
    subscribable: true,
    subscriptionDiscount: 12,
    stock: 8,
  },
  {
    id: "prod_hills_kidney",
    slug: "hills-prescription-diet-renal-2kg",
    name: "Prescription Diet k/d Renal",
    brand: brand("hills"),
    category: "alimento",
    species: ["gato"],
    stage: ["adulto", "senior"],
    price: { current: 32990 },
    format: "2 kg",
    rating: { value: 4.9, count: 76 },
    imageUrl: "🐈",
    subscribable: true,
    subscriptionDiscount: 10,
    stock: 3,
  },
  {
    id: "prod_acana_puppy",
    slug: "acana-puppy-recipe-2kg",
    name: "Puppy Recipe",
    brand: brand("acana"),
    category: "alimento",
    species: ["perro"],
    stage: ["cachorro"],
    price: { current: 28990, compareAt: 31990 },
    format: "2 kg",
    rating: { value: 4.6, count: 134 },
    imageUrl: "🐶",
    subscribable: true,
    subscriptionDiscount: 12,
    stock: 17,
  },
  {
    id: "prod_nexgard_m",
    slug: "nexgard-antiparasitario-perro-mediano",
    name: "Antiparasitario Masticable (4–10 kg)",
    brand: brand("nexgard"),
    category: "farmacia",
    species: ["perro"],
    price: { current: 18990 },
    format: "3 comprimidos",
    rating: { value: 4.5, count: 58 },
    imageUrl: "💊",
    subscribable: false,
    stock: 0,
  },
  {
    id: "prod_bed_cozy",
    slug: "cama-ortopedica-acolchada-m",
    name: "Cama Ortopédica Acolchada",
    brand: { id: "b_manada", name: "Manada", slug: "manada" },
    category: "accesorios",
    species: ["perro", "gato"],
    price: { current: 39990, compareAt: 49990 },
    format: "Talla M",
    rating: { value: 4.4, count: 41 },
    imageUrl: "🛏️",
    subscribable: false,
    stock: 12,
  },
];

/** Carrito demo (2 líneas) para CartItem/Drawer/OrderSummary del styleguide. */
export const DEMO_CART: CartItem[] = [
  { product: PRODUCTS[0], quantity: 1, subscriptionWeeks: 4 },
  { product: PRODUCTS[4], quantity: 2 },
];

/** Estimación de despacho de muestra (HonestShippingBlock del styleguide). */
export const DEMO_SHIPPING: ShippingEstimate = {
  comuna: "Ñuñoa",
  date: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  })(),
  cost: 0,
};

/** Cápsula de anticipación de muestra (AnticipationCapsule del styleguide). */
export const DEMO_NUDGE: AnticipationNudge = {
  id: "nudge_toby_recompra",
  petId: "pet_toby",
  kind: "recompra",
  title: `A Toby le quedan ~${TOBY_ANTICIPATION.daysLeft} días de comida`,
  body: "¿La reagendamos para que no le falte?",
  reason:
    "Lo estimamos con el tamaño de su último saco (3 kg), su peso (8 kg) y los días desde tu compra. Es una sugerencia, no un cobro.",
};

/** Reseñas de muestra (ReviewCard del styleguide; reseñas reales ocultas, D28). */
export const REVIEWS: Review[] = [
  {
    id: "rev_1",
    author: "Camila R.",
    rating: 5,
    date: new Date("2026-06-10"),
    title: "A mi perro le encanta",
    body: "Llegó al día siguiente a Ñuñoa. Toby comió feliz y le cayó perfecto. Repetiré con suscripción.",
    verified: true,
    petName: "Toby",
  },
  {
    id: "rev_2",
    author: "Felipe M.",
    rating: 4,
    date: new Date("2026-05-28"),
    title: "Buen precio, buen rendimiento",
    body: "Buen precio y el saco rinde lo que dicen. Le bajaría una estrella solo porque quería más formato.",
    verified: true,
  },
  {
    id: "rev_3",
    author: "Antonia P.",
    rating: 5,
    date: new Date("2026-05-15"),
    title: "Me avisaron antes de que se acabara",
    body: "Lo mejor fue el recordatorio: me avisaron justo cuando se estaba acabando. Magia.",
    verified: true,
    petName: "Luna",
  },
];
