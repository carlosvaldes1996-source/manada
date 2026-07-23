import type { CartItem, SubscriptionFrequencyWeeks } from "@/types";
import { medusa } from "./client";
import { getRegionId } from "./region";
import { mapLineItemProduct, type StoreCartLineLike } from "./map-product";

/**
 * Capa de carrito sobre la Store API de Medusa (Fase 5 · Etapa 3).
 *
 * El carrito real de Medusa es la **fuente de verdad**: crear/agregar/actualizar/
 * quitar líneas, totales en CLP y, más adelante, dirección/despacho/pago. El
 * `cart-provider` es un envoltorio delgado de React sobre estas funciones + el
 * `cart_id` persistido en `localStorage`. Compra única (sin suscripción: el motor
 * recurrente es el moat, posterior al MVP).
 */

/**
 * Campos a pedir para que cada línea traiga marca (metadata del producto),
 * categoría y su **metadata propia** (`is_subscription`/`frequency_weeks`, D55):
 * así la intención de suscripción sobrevive el ida y vuelta por Medusa.
 */
export const CART_FIELDS = "+items.metadata,+items.product.metadata,*items.product.categories";

/** Tipo laxo del carrito (evita acoplar a la forma exacta de HttpTypes). */
export interface MedusaCart {
  id: string;
  items?: (StoreCartLineLike & { created_at?: string })[];
  item_subtotal?: number;
  item_total?: number;
  total?: number;
  email?: string | null;
  customer_id?: string | null;
  completed_at?: string | null;
}

async function unwrap(p: Promise<{ cart: unknown }>): Promise<MedusaCart> {
  return (await p).cart as MedusaCart;
}

export async function createCart(): Promise<MedusaCart> {
  const region_id = await getRegionId();
  return unwrap(medusa.store.cart.create({ region_id }, { fields: CART_FIELDS }));
}

export async function retrieveCart(id: string): Promise<MedusaCart | null> {
  try {
    return await unwrap(medusa.store.cart.retrieve(id, { fields: CART_FIELDS }));
  } catch {
    return null; // carrito inexistente/expirado → el provider crea uno nuevo
  }
}

export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<MedusaCart> {
  return unwrap(
    medusa.store.cart.createLineItem(cartId, { variant_id: variantId, quantity }, { fields: CART_FIELDS }),
  );
}

/**
 * Agrega una línea de SUSCRIPCIÓN (D55) vía la ruta propia del backend
 * (`/store/carts/:id/subscription-items`, API.md §13): el backend fija el **precio
 * suscrito** (descuento del producto) como precio de la línea desde la primera
 * compra y le deja la metadata `{ is_subscription, frequency_weeks }`. Luego se
 * re-lee el carrito con la MISMA forma que consume la UI (mapCartItems).
 */
export async function addSubscriptionLineItem(
  cartId: string,
  variantId: string,
  quantity: number,
  frequencyWeeks: SubscriptionFrequencyWeeks,
): Promise<MedusaCart> {
  await medusa.client.fetch(`/store/carts/${cartId}/subscription-items`, {
    method: "POST",
    body: { variant_id: variantId, quantity, frequency_weeks: frequencyWeeks },
  });
  const cart = await retrieveCart(cartId);
  if (!cart) throw new Error("No se pudo releer el carrito tras suscribir.");
  return cart;
}

export async function setLineItemQuantity(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<MedusaCart> {
  return unwrap(
    medusa.store.cart.updateLineItem(cartId, lineId, { quantity }, { fields: CART_FIELDS }),
  );
}

export async function removeLineItem(cartId: string, lineId: string): Promise<MedusaCart | null> {
  await medusa.store.cart.deleteLineItem(cartId, lineId);
  return retrieveCart(cartId);
}

/**
 * Asocia el carrito de invitado al cliente autenticado (Fase 5 · Etapa A).
 * Nativo (`store.cart.transferCart`): tras el login, el carrito que traía el
 * visitante pasa a pertenecer a su cuenta, de modo que la orden que complete
 * queda ligada al cliente y aparece en su historial de pedidos.
 */
export async function transferCartToCustomer(cartId: string): Promise<MedusaCart> {
  return unwrap(medusa.store.cart.transferCart(cartId, { fields: CART_FIELDS }));
}

/** Líneas del carrito → `CartItem[]` que consume la UI (orden estable de creación). */
export function mapCartItems(cart: MedusaCart | null): CartItem[] {
  const items = [...(cart?.items ?? [])];
  items.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
  return items.map((line) => {
    const item: CartItem = { product: mapLineItemProduct(line), quantity: line.quantity };
    // La intención de suscripción viaja en la metadata de la línea (D55): si está,
    // la exponemos como frecuencia para que el carrito/checkout la distingan.
    const meta = line.metadata as { is_subscription?: unknown; frequency_weeks?: unknown } | null;
    if (meta?.is_subscription && meta.frequency_weeks) {
      item.subscriptionWeeks = Number(meta.frequency_weeks) as SubscriptionFrequencyWeeks;
    }
    return item;
  });
}

/** Busca la línea que corresponde a un `productId` (product_id de Medusa). */
export function findLineIdByProduct(cart: MedusaCart | null, productId: string): string | undefined {
  return cart?.items?.find((l) => l.product_id === productId)?.id;
}
