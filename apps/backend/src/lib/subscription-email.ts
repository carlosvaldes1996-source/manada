import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { MedusaContainer } from "@medusajs/framework/types";

/**
 * Resuelve, por id de suscripción, todo lo que necesitan los correos del ciclo
 * de vida (D57·R5) — FUENTE ÚNICA para los 5 subscribers de suscripción:
 * - `customer.email` / `first_name` vía el Module Link `customer↔subscription`.
 * - `product_title` con una query al producto (mismo patrón que `GET /store/subscriptions`).
 * - `pet_name` si el link OPCIONAL `pet↔subscription` resuelve ("el plan de {nombre}").
 *
 * Devuelve `null` cuando no hay a quién escribirle (suscripción inexistente o sin
 * dueño con email) → el subscriber hace no-op honesto, como el resto del sistema.
 */
export type SubscriptionEmailData = {
  email: string;
  first_name: string | null;
  pet_name: string | null;
  product_title: string;
  frequency_weeks: number;
  next_delivery_date: string | null;
  agreed_unit_price: number | null;
  quantity: number;
  /** Últimos 4 de la tarjeta enlazada (D59), para correos de renovación/fallo. */
  card_last4: string | null;
};

/** Los links `isList` pueden devolver el lado "uno" como objeto o arreglo; normaliza. */
function one<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}

export async function loadSubscriptionEmailData(
  container: MedusaContainer,
  id: string,
): Promise<SubscriptionEmailData | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [sub],
  } = await query.graph({
    entity: "subscription",
    fields: [
      "id",
      "product_id",
      "quantity",
      "frequency_weeks",
      "next_delivery_date",
      "agreed_unit_price",
      "payment_method_id",
      "customer.email",
      "customer.first_name",
      "pet.name",
    ],
    filters: { id },
  });

  if (!sub) return null;

  const customer = one(sub.customer as { email?: string; first_name?: string | null } | undefined);
  const email = customer?.email;
  if (!email) return null;

  const pet = one(sub.pet as { name?: string | null } | undefined);

  // Últimos 4 de la tarjeta enlazada (si hay), para "cobrado a tu tarjeta ····1234".
  let cardLast4: string | null = null;
  if (sub.payment_method_id) {
    const {
      data: [card],
    } = await query.graph({
      entity: "saved_card",
      fields: ["last4"],
      filters: { id: sub.payment_method_id as string },
    });
    if (card?.last4) cardLast4 = String(card.last4);
  }

  let productTitle = "tu suscripción";
  if (sub.product_id) {
    const {
      data: [product],
    } = await query.graph({
      entity: "product",
      fields: ["title"],
      filters: { id: sub.product_id },
    });
    if (product?.title) productTitle = product.title;
  }

  return {
    email,
    first_name: customer?.first_name ?? null,
    pet_name: pet?.name ?? null,
    product_title: productTitle,
    frequency_weeks: (sub.frequency_weeks as number) ?? 4,
    next_delivery_date: sub.next_delivery_date
      ? new Date(sub.next_delivery_date as string).toISOString()
      : null,
    agreed_unit_price: (sub.agreed_unit_price as number | null) ?? null,
    quantity: (sub.quantity as number) ?? 1,
    card_last4: cardLast4,
  };
}
