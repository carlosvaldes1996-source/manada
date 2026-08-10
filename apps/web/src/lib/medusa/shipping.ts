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
/** Dónde despachamos hoy. `regions` trae los nombres canónicos de `chile-regions.ts`. */
export interface ShippingCoverage {
  regions: string[];
  /** Cómo se le nombra la zona al comprador ("Región Metropolitana"). */
  label: string;
  /** Comunas que recorre el reparto. Vacío = sin restricción a nivel de comuna. */
  comunas: string[];
  /** Nombre de la zona de reparto ("Gran Santiago"). */
  areaLabel: string;
}

export interface ShippingPolicy {
  currencyCode: string;
  baseShippingAmount: number;
  freeShippingThreshold: number;
  /** La suscripción incluye el despacho, sin monto mínimo. */
  subscriptionFreeShipping: boolean;
  /**
   * Zona de cobertura. `null` = el backend no la declara (versión anterior aún
   * desplegada): el checkout NO bloquea a nadie por su cuenta —el front consume,
   * no decide— y el candado sigue siendo del servidor. Por eso el backend se
   * despliega primero.
   */
  coverage: ShippingCoverage | null;
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
      coverage?: {
        regions?: string[];
        label?: string;
        comunas?: string[];
        area_label?: string;
      };
    };
  }>("/store/shipping-policy");
  const coverage = shipping_policy.coverage;
  cached = {
    currencyCode: shipping_policy.currency_code,
    baseShippingAmount: shipping_policy.base_shipping_amount,
    freeShippingThreshold: shipping_policy.free_shipping_threshold,
    // Ausente = backend viejo aún desplegado: no se anuncia un beneficio que ese
    // backend no aplicaría al cobrar.
    subscriptionFreeShipping: shipping_policy.subscription_free_shipping ?? false,
    // Misma regla, al revés: sin lista de regiones no se bloquea a nadie desde el
    // front (una cobertura inventada acá podría costar una venta que SÍ se cumple).
    coverage:
      coverage?.regions?.length && coverage.label
        ? {
            regions: coverage.regions,
            label: coverage.label,
            // Mismo criterio una capa más abajo: sin lista de comunas no se
            // restringe por comuna (backend anterior ⇒ solo valida región).
            comunas: coverage.comunas ?? [],
            areaLabel: coverage.area_label ?? coverage.label,
          }
        : null,
  };
  return cached;
}
