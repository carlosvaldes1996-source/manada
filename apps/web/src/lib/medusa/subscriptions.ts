import type { SubscriptionFrequencyWeeks, SubscriptionStatus, SubscriptionView } from "@/types";
import { medusa } from "./client";
import { SUBSCRIPTION_FREQUENCIES } from "@/hooks/use-subscription";

/** Campos editables de la gestión del plan (D56·D). Espejo de `PATCH /store/subscriptions/:id`. */
export interface UpdateSubscriptionInput {
  frequency_weeks?: SubscriptionFrequencyWeeks;
  status?: SubscriptionStatus;
  /** ISO. Para "saltar"/reprogramar; el front la computa. */
  next_delivery_date?: string;
}

/**
 * Suscripciones del cliente — contrato `/store/subscriptions` (API.md §13, D55).
 *
 * Autenticado: el js-sdk adjunta el JWT de la sesión (D26) + la publishable key;
 * el backend impone la propiedad (un cliente solo ve sus suscripciones). Este
 * módulo es el único que conoce la forma `StoreSubscription` del backend; hacia la
 * app siempre sale el tipo de dominio `SubscriptionView`.
 *
 * Solo lectura en el Punto 1: la gestión (pausar/cancelar/cambiar) es un bloque
 * posterior; cuando exista se agregan sus mutaciones aquí, sin cambiar el mapper.
 */

interface StoreSubscription {
  id: string;
  product_id: string;
  product_title: string | null;
  variant_id: string | null;
  thumbnail: string | null;
  quantity: number;
  frequency_weeks: number;
  next_delivery_date: string | null;
  status: SubscriptionStatus;
  agreed_unit_price: number;
  currency_code: string;
}

function freqLabel(weeks: number): string {
  return SUBSCRIPTION_FREQUENCIES.find((f) => f.weeks === weeks)?.label ?? `Cada ${weeks} semanas`;
}

function mapSubscription(s: StoreSubscription): SubscriptionView {
  return {
    id: s.id,
    productId: s.product_id,
    productTitle: s.product_title ?? "Suscripción",
    variantId: s.variant_id ?? undefined,
    thumbnail: s.thumbnail ?? undefined,
    quantity: s.quantity,
    frequencyWeeks: s.frequency_weeks as SubscriptionFrequencyWeeks,
    frequencyLabel: freqLabel(s.frequency_weeks),
    nextDeliveryDate: s.next_delivery_date ? new Date(s.next_delivery_date) : undefined,
    status: s.status,
    agreedUnitPrice: s.agreed_unit_price,
    currencyCode: s.currency_code,
  };
}

export async function listMySubscriptions(): Promise<SubscriptionView[]> {
  const { subscriptions } = await medusa.client.fetch<{ subscriptions: StoreSubscription[] }>(
    "/store/subscriptions",
  );
  return subscriptions.map(mapSubscription);
}

/**
 * Actualiza el plan (gestión, D56·D): cambiar frecuencia, pausar/reanudar/cancelar
 * (status) o reprogramar/saltar (`next_delivery_date`). El llamador re-hidrata el
 * `SubscriptionProvider` tras la mutación.
 */
export async function updateMySubscription(
  id: string,
  changes: UpdateSubscriptionInput,
): Promise<void> {
  await medusa.client.fetch(`/store/subscriptions/${id}`, { method: "PATCH", body: changes });
}
