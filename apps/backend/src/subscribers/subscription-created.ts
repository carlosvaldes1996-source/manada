import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { SUBSCRIPTION_MODULE } from "../modules/subscription";
import SubscriptionModuleService from "../modules/subscription/service";
import { PET_MODULE } from "../modules/pet";

/**
 * Creación de la suscripción al CHECKOUT (D55 · Punto 1) — evento nativo `order.placed`.
 *
 * La intención de suscripción viaja en la metadata de la línea del carrito
 * (`is_subscription` + `frequency_weeks`, cableado en apps/web), que Medusa propaga
 * a `order.items[].metadata` al completar. Este subscriber lee esas líneas y crea
 * una fila `subscription` con el SNAPSHOT (variante/producto/cantidad/precio pactado/
 * dirección/`source_order_id`) + `next_delivery_date` derivada de la frecuencia.
 *
 * - **Pago manual (D24) en el Punto 1:** no se tokeniza ni se cobra (`payment_method_id`
 *   = null). El cobro recurrente real es un bloque posterior (D55).
 * - **Precio pactado = precio de la línea:** la línea de suscripción ya entra al
 *   carrito con el precio suscrito (custom price, ruta `subscription-items`), así que
 *   `agreed_unit_price = item.unit_price` — sin re-descontar (evita doble descuento).
 * - **Pago manual (D24) en el Punto 1:** no se tokeniza ni se cobra (`payment_method_id` = null).
 * - **Requiere cuenta:** una suscripción sin dueño sería ingestionable; las de invitado
 *   se omiten (no-op honesto), como en `food-purchased.ts`.
 * - Convive con `food-purchased.ts` y `order-placed-email.ts` (varios handlers por evento).
 */

/** metadata numérica: number nativo o string ("4"). */
function metaNumber(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

type OrderItem = {
  product_id?: string;
  variant_id?: string;
  title?: string;
  unit_price?: number;
  quantity?: number;
  metadata?: Record<string, unknown> | null;
};
type OrderAddress = {
  first_name?: string | null;
  last_name?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  country_code?: string | null;
};

export default async function subscriptionCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const subs = container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "currency_code",
      "customer_id",
      "items.product_id",
      "items.variant_id",
      "items.title",
      "items.unit_price",
      "items.quantity",
      "items.metadata",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.address_1",
      "shipping_address.address_2",
      "shipping_address.city",
      "shipping_address.province",
      "shipping_address.postal_code",
      "shipping_address.phone",
      "shipping_address.country_code",
    ],
    filters: { id: event.data.id },
  });
  if (!order) return;

  const items = (order.items ?? []) as OrderItem[];
  const subItems = items.filter((it) => it?.metadata?.is_subscription);
  if (subItems.length === 0) return;

  // La suscripción se gestiona desde la cuenta: la de invitado se omite (honesto).
  if (!order.customer_id) {
    console.log(
      `[suscripción] Orden #${order.display_id}: línea de suscripción en compra de invitado (sin cuenta) → omitida.`,
    );
    return;
  }

  // Idempotencia: si el evento ya se procesó para esta orden, no duplicar.
  const already = await subs.listSubscriptions({ source_order_id: order.id });
  if (already.length > 0) return;

  // Snapshot de la dirección de entrega (autónoma; no puntero a customer_address).
  const addr = order.shipping_address as OrderAddress | null;
  const shippingSnapshot = addr
    ? {
        first_name: addr.first_name ?? null,
        last_name: addr.last_name ?? null,
        address_1: addr.address_1 ?? null,
        address_2: addr.address_2 ?? null,
        city: addr.city ?? null,
        province: addr.province ?? null,
        postal_code: addr.postal_code ?? null,
        phone: addr.phone ?? null,
        country_code: addr.country_code ?? null,
      }
    : null;

  // Mascotas del cliente (para el link OPCIONAL pet↔subscription: "el plan de {nombre}").
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["pets.id", "pets.current_food_id"],
    filters: { id: order.customer_id },
  });
  const ownPets = (customer?.pets ?? []) as { id: string; current_food_id: string | null }[];

  for (const it of subItems) {
    const weeks = metaNumber(it.metadata?.frequency_weeks) || 4;
    // La línea ya trae el precio suscrito (custom price) → ese es el pactado.
    const agreed = it.unit_price ?? 0;
    const next = new Date(Date.now() + weeks * 7 * 24 * 3600 * 1000);

    const sub = await subs.createSubscriptions({
      variant_id: it.variant_id,
      product_id: it.product_id,
      quantity: it.quantity ?? 1,
      frequency_weeks: weeks,
      next_delivery_date: next,
      status: "active",
      agreed_unit_price: agreed,
      currency_code: order.currency_code ?? "clp",
      shipping_address: shippingSnapshot,
      payment_method_id: null,
      source_order_id: order.id,
    });

    // Link DUEÑO (obligatorio): sin él la suscripción no aparecería en el GET.
    try {
      await link.create({
        [Modules.CUSTOMER]: { customer_id: order.customer_id },
        [SUBSCRIPTION_MODULE]: { subscription_id: sub.id },
      });
    } catch (e) {
      // Revertimos para no dejar una suscripción huérfana (invisible).
      await subs.deleteSubscriptions(sub.id);
      throw e;
    }

    // Link OPCIONAL a la mascota que come este producto (no bloquea si falla).
    const pet = ownPets.find((p) => p.current_food_id && p.current_food_id === it.product_id);
    if (pet) {
      try {
        await link.create({
          [PET_MODULE]: { pet_id: pet.id },
          [SUBSCRIPTION_MODULE]: { subscription_id: sub.id },
        });
      } catch (e) {
        console.warn(`[suscripción] No se pudo enlazar ${sub.id} a la mascota ${pet.id}:`, e);
      }
    }

    console.log(
      `[suscripción] Orden #${order.display_id}: creada ${sub.id} (${it.title ?? it.product_id}, cada ${weeks} sem, próxima ${next
        .toISOString()
        .slice(0, 10)}, $${agreed}).`,
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
