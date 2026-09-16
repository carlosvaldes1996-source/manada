/**
 * Medición del embudo de negocio de Manada (SEO & Tracking, D46).
 *
 * Único punto de la app que conoce la forma del `dataLayer`. GTM es el punto
 * central: estas funciones EMPUJAN eventos al dataLayer y GTM decide a dónde
 * enrutarlos (GA4, Meta Pixel, Google Ads…). El código de producto nunca habla
 * con GA4/Pixel directamente — así se agregan destinos con solo configurar GTM.
 *
 * Instrumentamos SOLO los hitos que explican la conversión del negocio, no
 * decenas de micro-eventos:
 *   1. onboarding_start      — arranca el alta de mascota (tope del embudo)
 *   2. recommendation_shown  — se mostró la recomendación (momento "aha")
 *   3. add_to_cart           — sumó al carrito         (ecommerce GA4 estándar)
 *   4. begin_checkout        — inició el checkout       (ecommerce GA4 estándar)
 *   5. purchase              — compra realizada         (ecommerce GA4 estándar)
 *   6. subscription          — recordatorio/suscripción (anticipación; "si aplica")
 *
 * Ampliación 2026-09 — los 4 que faltaban para poder DIAGNOSTICAR. La primera
 * campaña pagada (405 usuarios) dejó un embudo ilegible: 130 personas abrieron
 * el alta de mascota y CERO llegaron a la recomendación, sin forma de saber por
 * qué. Los 6 hitos de arriba dicen si el negocio convierte; estos 4 dicen dónde
 * se rompe cuando no convierte:
 *   7. virtual_page_view     — navegación de cliente (SPA); SOLO para el Pixel
 *   8. view_item             — se vio una PDP        (ecommerce GA4 estándar)
 *   9. onboarding_step_view  — se mostró un paso del alta
 *  10. onboarding_submit     — se completó el alta y se pidió la recomendación
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

// ── Visibilidad del embudo (ampliación 2026-09) ───────────────────────────

/**
 * 7 · Navegación de cliente (SPA).
 *
 * El contenedor de GTM y el Pixel base solo disparan en la CARGA INICIAL: el
 * disparador `All Pages - Meta` es de tipo PAGEVIEW y no se entera de un
 * `router.push`. Hasta hoy, toda navegación interna era INVISIBLE para Meta —
 * una PDP alcanzada desde el catálogo no contaba como visita, y la recomendación
 * (a la que solo se llega por `router.push`) no contaba nunca.
 *
 * ⚠️ Este evento NO debe enrutarse a GA4. La medición mejorada del tag de Google
 * ya cuenta los cambios de historial por su cuenta; mapearlo también a GA4
 * duplicaría todas las vistas de página. Es exclusivamente para el Pixel.
 */
export function trackPageView(path: string) {
  push({ event: "virtual_page_view", page_path: path });
}

/**
 * 8 · Se vio una ficha de producto (PDP).
 *
 * `ViewContent` de Meta colgaba de `recommendation_shown`, o sea del final del
 * onboarding. Pautar a una PDP no generaba NINGUNA señal de fondo de embudo, y
 * sin señal con volumen el algoritmo de Meta no tiene sobre qué optimizar (por
 * eso solo entregaba clics baratos). `view_item` es el nombre estándar de GA4.
 */
export function trackViewItem(product: Product) {
  pushEcommerce("view_item", {
    currency: CURRENCY,
    value: product.price.current,
    items: [toItem(product)],
  });
}

/**
 * 9 · Se mostró un paso del alta de mascota.
 *
 * Entre `onboarding_start` y `recommendation_shown` no había nada: se sabía
 * quién entraba y quién llegaba al final, pero no en qué pregunta se caía la
 * gente. Con 2 pasos bastan 2 valores para leer la fricción de cada pantalla.
 */
export function trackOnboardingStep(stepId: string, index: number, total: number) {
  push({
    event: "onboarding_step_view",
    step_id: stepId,
    step_index: index + 1,
    step_total: total,
  });
}

/**
 * 10 · Se completó el alta y se pidió la recomendación (navegación en vuelo).
 *
 * El evento que separa las dos explicaciones de un embudo que muere al final:
 *  - `onboarding_submit` ≈ 0            → el formulario no se completa (fricción).
 *  - `onboarding_submit` >> `recommendation_shown` → el formulario SÍ se completa
 *    pero la navegación a la recomendación se pierde (lentitud del servidor,
 *    error, o el usuario se va antes de que llegue el payload).
 * Sin este evento las dos hipótesis se ven idénticas desde GA4 y no hay forma
 * de decidir dónde invertir el arreglo.
 */
export function trackOnboardingSubmit() {
  push({ event: "onboarding_submit" });
}
