/**
 * Medición del embudo de negocio de Manada (SEO & Tracking, D46).
 *
 * Único punto de la app que conoce la forma del `dataLayer`. GTM es el punto
 * central: estas funciones EMPUJAN eventos al dataLayer y GTM decide a dónde
 * enrutarlos (GA4, Meta Pixel, Google Ads…). El código de producto nunca habla
 * con GA4/Pixel directamente — así se agregan destinos con solo configurar GTM.
 *
 * Instrumentamos SOLO los 6 hitos que explican la conversión del negocio, no
 * decenas de micro-eventos:
 *   1. onboarding_start      — arranca el alta de mascota (tope del embudo)
 *   2. recommendation_shown  — se mostró la recomendación (momento "aha")
 *   3. add_to_cart           — sumó al carrito         (ecommerce GA4 estándar)
 *   4. begin_checkout        — inició el checkout       (ecommerce GA4 estándar)
 *   5. purchase              — compra realizada         (ecommerce GA4 estándar)
 *   6. subscription          — recordatorio/suscripción (anticipación; "si aplica")
 *
 * Los eventos de comercio usan el esquema `ecommerce` recomendado por GA4 para
 * que GA4/Ads los entiendan de forma nativa a través de GTM.
 */
import type { CartItem, Pet, Product } from "@/types";

const CURRENCY = "CLP";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Empuje SSR-safe al dataLayer. En dev sin GTM el push es inofensivo. */
function push(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}

/** Producto Manada → ítem de ecommerce GA4. */
function toItem(product: Product, quantity = 1) {
  return {
    item_id: product.id,
    item_name: product.name,
    item_brand: product.brand?.name,
    item_category: product.category,
    price: product.price.current,
    quantity,
  };
}

/**
 * Evento de comercio con esquema GA4. GA4 recomienda LIMPIAR `ecommerce` antes
 * de cada push para no arrastrar ítems de un evento previo.
 */
function pushEcommerce(event: string, ecommerce: Record<string, unknown>) {
  push({ ecommerce: null });
  push({ event, ecommerce });
}

// ── Los 6 hitos del embudo ────────────────────────────────────────────────

/** 1 · Arranca el alta de mascota (tope del embudo de adquisición). */
export function trackOnboardingStart() {
  push({ event: "onboarding_start" });
}

/** 2 · Se mostró la recomendación (el momento "aha" del producto). */
export function trackRecommendationShown(pet: Pet, product: Product) {
  pushEcommerce("recommendation_shown", {
    pet_species: pet.species,
    pet_stage: pet.stage,
    items: [toItem(product)],
  });
}

/** 3 · Sumó un producto al carrito. */
export function trackAddToCart(product: Product, quantity = 1) {
  pushEcommerce("add_to_cart", {
    currency: CURRENCY,
    value: product.price.current * quantity,
    items: [toItem(product, quantity)],
  });
}

/** 4 · Inició el checkout. */
export function trackBeginCheckout(items: CartItem[], value: number) {
  pushEcommerce("begin_checkout", {
    currency: CURRENCY,
    value,
    items: items.map((i) => toItem(i.product, i.quantity)),
  });
}

/** 5 · Compra realizada (orden creada en Medusa). */
export function trackPurchase(input: {
  transactionId: string;
  value: number;
  items: CartItem[];
}) {
  pushEcommerce("purchase", {
    transaction_id: input.transactionId,
    currency: CURRENCY,
    value: input.value,
    items: input.items.map((i) => toItem(i.product, i.quantity)),
  });
}

/**
 * 6 · Suscripción / anticipación ("si aplica"). En el MVP la suscripción
 * recurrente está diferida (D29): el proxy real de intención recurrente es el
 * recordatorio de recompra. `type` distingue el caso ("reminder" hoy;
 * "recurring" cuando se active la suscripción) para no perder la señal desde el
 * día uno y no tener que re-instrumentar cuando el moat recurrente aterrice.
 */
export function trackSubscription(
  product: Product,
  type: "reminder" | "recurring" = "reminder",
) {
  pushEcommerce("subscription", {
    subscription_type: type,
    items: [toItem(product)],
  });
}
