import { medusa } from "./client";

/**
 * Política de envío consumida desde el backend (Fase 5 · Etapa B).
 *
 * FUENTE ÚNICA DE VERDAD = backend (`GET /store/shipping-policy`). El frontend
 * NO define umbrales, costos ni quién tiene envío gratis: solo consume estos
 * valores para la UI (barra de envío gratis, línea de despacho en la PDP, resumen
 * del carrito). El cobro real lo aplica el backend (opción de despacho + las dos
 * promociones automáticas de envío gratis: por monto y por suscripción).
 *
 * El texto que se le muestra al comprador se arma en un solo lugar,
 * `@/lib/shipping-copy`, para que las dos ramas de la regla se cuenten igual en
 * todas las pantallas.
 */
export interface ShippingPolicy {
  currencyCode: string;
  baseShippingAmount: number;
  freeShippingThreshold: number;
  /** La suscripción incluye el despacho, sin monto mínimo. */
  subscriptionFreeShipping: boolean;
}

let cached: ShippingPolicy | null = null;

export async function getShippingPolicy(): Promise<ShippingPolicy> {
  if (cached) return cached;
  const { shipping_policy } = await medusa.client.fetch<{
    shipping_policy: {
      currency_code: string;
      base_shipping_amount: number;
      free_shipping_threshold: number;
      subscription_free_shipping?: boolean;
    };
  }>("/store/shipping-policy");
  cached = {
    currencyCode: shipping_policy.currency_code,
    baseShippingAmount: shipping_policy.base_shipping_amount,
    freeShippingThreshold: shipping_policy.free_shipping_threshold,
    // Ausente = backend viejo aún desplegado: no se anuncia un beneficio que ese
    // backend no aplicaría al cobrar.
    subscriptionFreeShipping: shipping_policy.subscription_free_shipping ?? false,
  };
  return cached;
}
