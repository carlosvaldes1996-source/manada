import { medusa } from "./client";

/**
 * Tarjetas guardadas del cliente — contrato `/store/payment-methods` (API.md §10).
 *
 * Todas las llamadas van autenticadas (el js-sdk adjunta el JWT de la sesión,
 * D26); el backend impone la propiedad. Este módulo es el único que conoce la
 * forma `StoreSavedCard` del backend; hacia la app siempre sale `SavedCardView`
 * (solo datos de presentación — el token vive en la pasarela, nunca aquí).
 */

interface StoreSavedCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

export interface SavedCardView {
  id: string;
  /** Franquicia legible: "Visa", "Mastercard", … */
  brandLabel: string;
  last4: string;
  /** Vencimiento "MM/AA". */
  expiry: string;
}

/** Ids de franquicia según Mercado Pago (`payment_method_id`) → etiqueta. */
const BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  debvisa: "Visa Débito",
  master: "Mastercard",
  mastercard: "Mastercard",
  debmaster: "Mastercard Débito",
  amex: "American Express",
  magna: "Magna",
  redcompra: "Redcompra",
};

function mapSavedCard(card: StoreSavedCard): SavedCardView {
  return {
    id: card.id,
    brandLabel: BRAND_LABELS[card.brand.toLowerCase()] ?? card.brand,
    last4: card.last4,
    expiry: `${String(card.exp_month).padStart(2, "0")}/${String(card.exp_year % 100).padStart(2, "0")}`,
  };
}

/** Tarjetas guardadas del cliente autenticado (más recientes primero). */
export async function listSavedCards(): Promise<SavedCardView[]> {
  const { payment_methods } = await medusa.client.fetch<{
    payment_methods: StoreSavedCard[];
  }>("/store/payment-methods");
  return payment_methods.map(mapSavedCard);
}

/** Elimina una tarjeta guardada (el backend revoca en la pasarela cuando aplique). */
export async function deleteSavedCard(id: string): Promise<void> {
  await medusa.client.fetch(`/store/payment-methods/${id}`, { method: "DELETE" });
}
