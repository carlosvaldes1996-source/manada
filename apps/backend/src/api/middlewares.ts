import {
  authenticate,
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { StoreCreatePet, StoreUpdatePet } from "./store/pets/validators";

/**
 * Campo calculado `subscription_price` en la Store API (Fase 5 · Etapa 2).
 *
 * Manada tiene UN solo precio base por producto (el precio de la variante). Si el
 * producto es suscribible, guarda `subscription_discount_percentage` en su metadata.
 * El **backend** es responsable de calcular el precio de suscripción a partir del
 * precio base — nunca se almacena un segundo precio. Así, si cambia el precio normal
 * (desde el Admin), el precio de suscripción se actualiza solo.
 *
 * El frontend consume `price` (nativo, `calculated_price`) y `subscription_price`
 * (este campo) directamente desde la API, sin hacer ningún cálculo de negocio.
 *
 * Implementación: se envuelve `res.json` para las rutas GET de productos de la
 * Store API y se inyecta `subscription_price` en cada producto, derivándolo de la
 * variante primaria (menor `variant_rank`) y su `calculated_price`. Se preserva el
 * comportamiento nativo de `/store/products` (precios por región, filtros, paginación).
 */

/**
 * Política de redondeo CLP: hacia abajo al múltiplo de $10 (idéntica a
 * `roundCLP` en apps/web/src/lib/format.ts, U066). El resultado que entrega el
 * backend coincide exactamente con lo que el frontend mostraría, sin doble verdad.
 */
const CLP_ROUND_STEP = 10;

function roundCLP(amount: number): number {
  return Math.floor(amount / CLP_ROUND_STEP) * CLP_ROUND_STEP;
}

/** metadata puede venir como boolean nativo (seed) o string "true" (Admin). */
function metaBool(value: unknown): boolean {
  return value === true || value === "true";
}

/** metadata numérica puede venir como number (seed) o string (Admin). */
function metaNumber(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

type AnyVariant = {
  variant_rank?: number | null;
  calculated_price?: { calculated_amount?: number | null } | null;
  subscription_price?: number | null;
};

type AnyProduct = {
  metadata?: Record<string, unknown> | null;
  variants?: AnyVariant[];
  subscription_price?: number | null;
};

/**
 * Calcula e inyecta `subscription_price` **por variante** (multi-formato): cada
 * formato tiene su propio precio de suscripción, derivado de su precio base y del
 * `subscription_discount_percentage` del producto. Devuelve `null` por variante si
 * el producto no es suscribible, no hay descuento, o no vino el precio calculado.
 *
 * Compatibilidad: se conserva `product.subscription_price` (= variante primaria)
 * para el consumidor actual del front. Hoy todo esto está DORMIDO
 * (`SUBSCRIPTIONS_ENABLED=false`); queda listo para cuando aterrice la suscripción.
 */
function withSubscriptionPrice(product: AnyProduct): AnyProduct {
  const meta = product.metadata ?? {};
  const subscribable = metaBool(meta.subscribable);
  const pct = metaNumber(meta.subscription_discount_percentage);
  const variants = product.variants ?? [];

  const priceFor = (variant: AnyVariant): number | null => {
    if (!subscribable || pct <= 0) return null;
    const base = variant.calculated_price?.calculated_amount;
    return typeof base === "number" ? roundCLP(base * (1 - pct / 100)) : null;
  };

  for (const variant of variants) {
    variant.subscription_price = priceFor(variant);
  }

  const primary = [...variants].sort(
    (a, b) => (a.variant_rank ?? 0) - (b.variant_rank ?? 0),
  )[0];
  product.subscription_price = primary ? priceFor(primary) : null;
  return product;
}

/** Middleware que envuelve `res.json` para augmentar la respuesta de productos. */
function augmentProducts(
  _req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    const payload = body as { products?: AnyProduct[]; product?: AnyProduct } | null;
    if (payload?.products) payload.products.forEach(withSubscriptionPrice);
    if (payload?.product) withSubscriptionPrice(payload.product);
    return originalJson(body);
  }) as MedusaResponse["json"];
  next();
}

/**
 * Autenticación de cliente para `/store/pets` (API.md §9): mismo JWT de la
 * sesión (D26). Un cliente solo opera sus mascotas; la propiedad se impone en
 * las rutas con el `customer_id` del `auth_context`.
 */
const petsAuth = authenticate("customer", ["bearer", "session"]);

/**
 * Autenticación de cliente para `/store/payment-methods` (API.md §10): mismo
 * esquema que `/store/pets` — la propiedad se impone en las rutas.
 */
const paymentMethodsAuth = authenticate("customer", ["bearer", "session"]);

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/products",
      method: ["GET"],
      middlewares: [augmentProducts],
    },
    {
      matcher: "/store/products/:id",
      method: ["GET"],
      middlewares: [augmentProducts],
    },
    {
      matcher: "/store/pets",
      method: ["GET"],
      middlewares: [petsAuth],
    },
    {
      matcher: "/store/pets",
      method: ["POST"],
      middlewares: [petsAuth, validateAndTransformBody(StoreCreatePet)],
    },
    {
      matcher: "/store/pets/:id",
      method: ["PATCH"],
      middlewares: [petsAuth, validateAndTransformBody(StoreUpdatePet)],
    },
    {
      matcher: "/store/payment-methods",
      method: ["GET"],
      middlewares: [paymentMethodsAuth],
    },
    {
      matcher: "/store/payment-methods/:id",
      method: ["DELETE"],
      middlewares: [paymentMethodsAuth],
    },
  ],
});
