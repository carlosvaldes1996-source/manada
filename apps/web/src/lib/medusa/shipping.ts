import { medusa } from "./client";

/**
 * Política de envío consumida desde el backend (Fase 5 · Etapa B).
 *
 * FUENTE ÚNICA DE VERDAD = backend (`GET /store/shipping-policy`). El frontend
 * NO define umbrales ni costos: solo consume estos valores para la UI (barra de
 * envío gratis, línea de despacho en la PDP, resumen del carrito). El cobro real
 * lo aplica el backend (opción de despacho + promoción automática de envío gratis).
 */
export interface ShippingPolicy {
  currencyCode: string;
  baseShippingAmount: number;
  freeShippingThreshold: number;
}

let cached: ShippingPolicy | null = null;

export async function getShippingPolicy(): Promise<ShippingPolicy> {
  if (cached) return cached;
  const { shipping_policy } = await medusa.client.fetch<{
    shipping_policy: {
      currency_code: string;
      base_shipping_amount: number;
      free_shipping_threshold: number;
    };
  }>("/store/shipping-policy");
  cached = {
    currencyCode: shipping_policy.currency_code,
    baseShippingAmount: shipping_policy.base_shipping_amount,
    freeShippingThreshold: shipping_policy.free_shipping_threshold,
  };
  return cached;
}
