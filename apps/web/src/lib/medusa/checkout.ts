import { medusa } from "./client";
import { CART_FIELDS, type MedusaCart } from "./cart";

/**
 * Flujo de checkout sobre la Store API de Medusa (Fase 5 · Etapa 3, D24).
 *
 * Prepara el carrito para pagar: email + dirección → shipping options → shipping
 * method. El PAGO lo maneja Flow (D58, `lib/medusa/flow.ts` → `createFlowPayment`):
 * la orden se crea recién cuando Flow confirma el pago (webhook + payment/getStatus),
 * no al hacer click. El frontend solo orquesta llamadas; sin lógica de negocio.
 */

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

/**
 * Fija SOLO el correo en el carrito (D79). Se llama cuando el comprador termina de
 * escribirlo en el checkout, sin esperar a que apriete "Pagar".
 *
 * Por qué existe: `setCheckoutInfo` corre únicamente dentro del envío del pago, así
 * que quien escribía su correo y se iba quedaba **anónimo** en el funnel — justo el
 * segmento más valioso (dejó contacto, tenía intención, no compró). Con esto,
 * "llegó al checkout" pasa a significar lo que dice.
 *
 * Es la MISMA llamada nativa que ya hace el checkout al pagar, solo que antes y con
 * un único campo: la actualización es parcial, no pisa dirección ni metadata. Quien
 * la invoca la trata como best-effort — nunca debe bloquear ni romper el pago.
 */
export async function setCartEmail(cartId: string, email: string): Promise<void> {
  await medusa.store.cart.update(cartId, { email }, { fields: CART_FIELDS });
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
