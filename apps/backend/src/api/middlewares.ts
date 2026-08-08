import {
  authenticate,
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { StoreCreatePet, StoreUpdatePet } from "./store/pets/validators";
import { StoreAccountRegister } from "./store/account/register/validators";
import { resolveCustomersByEmail } from "../lib/account-provisioning";
import { AdminCreateFormat } from "./admin/products/[id]/formats/validators";
import { StoreAddSubscriptionItem } from "./store/carts/[id]/subscription-items/validators";
import { StoreUpdateSubscription } from "./store/subscriptions/[id]/validators";

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

type AnyProduct = {
  metadata?: Record<string, unknown> | null;
  variants?: {
    variant_rank?: number | null;
    calculated_price?: { calculated_amount?: number | null } | null;
  }[];
  subscription_price?: number | null;
};

/**
 * Calcula e inyecta `subscription_price` en un producto. Devuelve `null` si no es
 * suscribible, si no hay descuento, o si la respuesta no trae precio calculado
 * (p. ej. cuando el caller no pidió `variants.calculated_price`).
 */
function withSubscriptionPrice(product: AnyProduct): AnyProduct {
  const meta = product.metadata ?? {};
  const subscribable = metaBool(meta.subscribable);
  const pct = metaNumber(meta.subscription_discount_percentage);

  let subscriptionPrice: number | null = null;
  if (subscribable && pct > 0) {
    const variants = product.variants ?? [];
    const primary = [...variants].sort(
      (a, b) => (a.variant_rank ?? 0) - (b.variant_rank ?? 0),
    )[0];
    const base = primary?.calculated_price?.calculated_amount;
    if (typeof base === "number") {
      subscriptionPrice = roundCLP(base * (1 - pct / 100));
    }
  }

  product.subscription_price = subscriptionPrice;
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

/**
 * Autenticación de cliente para `/store/subscriptions` (API.md §13, D55): mismo
 * esquema que `/store/pets` — la propiedad se impone en la ruta por `customer_id`.
 */
const subscriptionsAuth = authenticate("customer", ["bearer", "session"]);

/**
 * Autenticación de cliente para `POST /store/account/confirm` (API.md §17.2, D82).
 * Aquí la sesión NO es solo control de acceso: es la prueba de posesión del correo
 * que habilita la adopción del invitado (la identidad nace con clave aleatoria, así
 * que un token solo puede venir del enlace enviado a esa casilla).
 */
const accountConfirmAuth = authenticate("customer", ["bearer", "session"]);

/**
 * Cierra la ruta NATIVA `POST /store/customers` cuando el correo ya existe (D82).
 *
 * `POST /store/account/register` (§17.3) sustituyó a esta ruta **en nuestro frontend**,
 * pero la nativa sigue publicada y cualquiera puede llamarla: verificado que con un
 * invitado presente crea igual la segunda fila, porque `validateCustomerAccountCreation`
 * solo lanza si YA hay cuenta. Sin este guard, la invariante "nunca dos `customer` por
 * correo" valdría para nuestra app y no para la API.
 *
 * Y no es solo higiene de datos. Un tercero que registre por aquí el correo de otro:
 *  · deja al dueño real **sin poder adoptar nunca** su compra de invitado (a partir de
 *    ahí `provisionAccount` responde `already_account` para siempre), y
 *  · reinstala la ambigüedad de `findOrCreateCustomerStep` (§17.6) — con las dos filas
 *    presentes, el próximo checkout de invitado de la víctima puede engancharse al
 *    `customer` del atacante, y ahí sí se le filtran datos del pedido.
 *
 * El correo limpio pasa intacto: no se rompe el uso legítimo de la ruta.
 */
async function blockDuplicateCustomer(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const email = (req.body as { email?: unknown } | undefined)?.email;
  if (typeof email !== "string" || !email.trim()) return next();

  try {
    const customerService = req.scope.resolve(Modules.CUSTOMER);
    const { registered, guest } = await resolveCustomersByEmail(
      customerService as never,
      email.trim().toLowerCase(),
    );
    if (registered || guest) {
      res.status(409).json({
        status: "already_account",
        message: "Ya hay una cuenta con ese correo. Inicia sesión o recupera tu contraseña.",
      });
      return;
    }
  } catch {
    // Si no se pudo comprobar, no se inventa un bloqueo: sigue el camino nativo.
  }
  return next();
}

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
      // Extensión Manada: alta de formatos/variantes en un paso (ver
      // src/api/admin/products/[id]/formats/route.ts y el widget product-add-format).
      matcher: "/admin/products/:id/formats",
      method: ["POST"],
      middlewares: [validateAndTransformBody(AdminCreateFormat)],
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
    {
      matcher: "/store/subscriptions",
      method: ["GET"],
      middlewares: [subscriptionsAuth],
    },
    {
      matcher: "/store/subscriptions/:id",
      method: ["PATCH"],
      middlewares: [subscriptionsAuth, validateAndTransformBody(StoreUpdateSubscription)],
    },
    {
      // Actualizar la tarjeta de una suscripción (D59, dunning): tokeniza una tarjeta
      // nueva en Flow. Requiere cuenta (la propiedad se impone en la ruta).
      matcher: "/store/subscriptions/:id/payment-method",
      method: ["POST"],
      middlewares: [subscriptionsAuth],
    },
    {
      // Alta de línea de SUSCRIPCIÓN al carrito con precio suscrito (D55). Sin auth
      // de cliente (carritos de invitado permitidos, como la ruta core de line-items);
      // la publishable key la impone el middleware global de /store.
      matcher: "/store/carts/:id/subscription-items",
      method: ["POST"],
      middlewares: [validateAndTransformBody(StoreAddSubscriptionItem)],
    },
    {
      // 1ª compra de una SUSCRIPCIÓN (D59): tokeniza la tarjeta en Flow. REQUIERE
      // cuenta (no se puede tokenizar a un invitado) → auth de cliente.
      matcher: "/store/carts/:id/subscription-payment",
      method: ["POST"],
      middlewares: [subscriptionsAuth],
    },
    {
      // Alta de cuenta sin duplicar clientes (API.md §17.3, D82). PÚBLICA a propósito:
      // es el paso previo a tener sesión. Reemplaza a `store.customer.create` en el
      // registro del storefront.
      matcher: "/store/account/register",
      method: ["POST"],
      middlewares: [validateAndTransformBody(StoreAccountRegister)],
    },
    {
      // Consuma la adopción invitado→cuenta (API.md §17.2). La auth es la prueba
      // de posesión del correo.
      matcher: "/store/account/confirm",
      method: ["POST"],
      middlewares: [accountConfirmAuth],
    },
    {
      // Guard sobre la ruta NATIVA de alta (§17.3): la invariante "un customer por
      // correo" tiene que valer también para quien llame la API directo.
      matcher: "/store/customers",
      method: ["POST"],
      middlewares: [blockDuplicateCustomer],
    },
  ],
});
