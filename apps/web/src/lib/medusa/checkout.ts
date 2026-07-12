import type { HttpTypes } from "@medusajs/types";
import { medusa } from "./client";
import { CART_FIELDS, type MedusaCart } from "./cart";

/**
 * Flujo de checkout sobre la Store API de Medusa (Fase 5 · Etapa 3, D24).
 *
 * Todo nativo de Medusa: email + dirección en el carrito → shipping options →
 * shipping method → sesión de pago (manual) → `complete` = **orden real**. El
 * backend descuenta stock (reserva) y la orden queda en el Admin para preparar el
 * despacho manual. Sin lógica de negocio propia; el frontend solo orquesta llamadas.
 */

/** Proveedor de pago MANUAL (transferencia/offline). MP llega en la próxima etapa. */
export const MANUAL_PAYMENT_PROVIDER = "pp_system_default";

/** Dirección de despacho mínima válida para Medusa (Chile). */
export interface CheckoutAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string; // comuna
  province?: string; // región
  postal_code?: string;
  phone?: string;
  country_code: "cl";
}

export interface ShippingOptionView {
  id: string;
  name: string;
  amount: number;
  description?: string;
}

/** Opciones de despacho reales para el carrito (de la config de fulfillment del backend). */
export async function listShippingOptions(cartId: string): Promise<ShippingOptionView[]> {
  const { shipping_options } = await medusa.store.fulfillment.listCartOptions({ cart_id: cartId });
  return (shipping_options ?? []).map((o) => {
    const opt = o as typeof o & { amount?: number; calculated_price?: { calculated_amount?: number } };
    return {
      id: opt.id,
      name: opt.name,
      amount: opt.amount ?? opt.calculated_price?.calculated_amount ?? 0,
      description: (opt.type as { description?: string } | undefined)?.description,
    };
  });
}

/**
 * Fija email + dirección de despacho (y facturación) en el carrito. El RUT (para
 * la boleta) se guarda en `metadata.rut`: lo hereda la orden y queda visible en
 * el Admin. Solución nativa mínima, sin módulo propio.
 */
export async function setCheckoutInfo(
  cartId: string,
  email: string,
  address: CheckoutAddress,
  rut?: string,
): Promise<MedusaCart> {
  const { cart } = await medusa.store.cart.update(
    cartId,
    {
      email,
      shipping_address: address,
      billing_address: address,
      ...(rut ? { metadata: { rut } } : {}),
    },
    { fields: CART_FIELDS },
  );
  return cart as unknown as MedusaCart;
}

/** Selecciona el método de despacho. */
export async function selectShippingMethod(cartId: string, optionId: string): Promise<MedusaCart> {
  const { cart } = await medusa.store.cart.addShippingMethod(
    cartId,
    { option_id: optionId },
    { fields: CART_FIELDS },
  );
  return cart as unknown as MedusaCart;
}

/** Inicia la sesión de pago MANUAL sobre el payment collection del carrito. */
export async function initManualPayment(cartId: string): Promise<void> {
  const { cart } = await medusa.store.cart.retrieve(cartId, {
    fields: "id,region_id,currency_code,+payment_collection.id,*payment_collection.payment_sessions",
  });
  await medusa.store.payment.initiatePaymentSession(cart as HttpTypes.StoreCart, {
    provider_id: MANUAL_PAYMENT_PROVIDER,
  });
}

export interface CompletedOrder {
  id: string;
  display_id: number;
  email: string;
  total: number;
}

/** Completa el carrito → crea la ORDEN. Devuelve la orden o un mensaje de error. */
export async function completeCart(
  cartId: string,
): Promise<{ order?: CompletedOrder; error?: string }> {
  const res = await medusa.store.cart.complete(cartId);
  if (res.type === "order") {
    const o = res.order;
    return { order: { id: o.id, display_id: o.display_id ?? 0, email: o.email ?? "", total: o.total ?? 0 } };
  }
  return { error: res.error?.message ?? "No se pudo completar la orden." };
}
