import type { CartItem } from "@/types";
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

/** Campos a pedir para que cada línea traiga marca (metadata) y categoría. */
export const CART_FIELDS = "+items.product.metadata,*items.product.categories";

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

/** Líneas del carrito → `CartItem[]` que consume la UI (orden estable de creación). */
export function mapCartItems(cart: MedusaCart | null): CartItem[] {
  const items = [...(cart?.items ?? [])];
  items.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
  return items.map((line) => ({ product: mapLineItemProduct(line), quantity: line.quantity }));
}

/** Busca la línea que corresponde a un `productId` (product_id de Medusa). */
export function findLineIdByProduct(cart: MedusaCart | null, productId: string): string | undefined {
  return cart?.items?.find((l) => l.product_id === productId)?.id;
}
