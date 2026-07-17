import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PET_MODULE } from "../modules/pet";
import PetModuleService from "../modules/pet/service";

/**
 * Anticipación anclada a la COMPRA (D35) — evento nativo `order.placed`.
 *
 * `food_assigned_at` es el reloj único del cálculo "cuándo se le acaba" y hasta
 * aquí quedaba estampado al AGREGAR al carrito (PATCH de `assignFood`, D34). El
 * saco real empieza a consumirse con la compra, no con el carrito: cuando una
 * orden confirmada incluye el alimento que una mascota del cliente tiene
 * asignado, este subscriber RE-ESTAMPA `food_assigned_at` a la fecha de la orden.
 *
 * Fuente única, sin estado duplicado: NO se guarda `pet_id` en las líneas del
 * carrito (sería un segundo lugar para el vínculo mascota↔alimento). El vínculo
 * vive SOLO en `pet.current_food_id`; la orden solo confirma la compra — se
 * matchean los `product_id` de la orden contra las mascotas del cliente.
 *
 * Invitados: la orden de invitado no tiene mascotas persistidas → no-op (al
 * registrarse, el push del PetProvider estampa una fecha fresca, D34-i4).
 */
export default async function foodPurchasedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const pets = container.resolve<PetModuleService>(PET_MODULE);

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "customer_id", "items.product_id"],
    filters: { id: event.data.id },
  });

  if (!order?.customer_id) return;

  const purchasedProductIds = new Set(
    (order.items ?? []).map((item) => item?.product_id).filter(Boolean),
  );
  if (purchasedProductIds.size === 0) return;

  // Mascotas del cliente vía el Module Link Customer↔Pet (traversal nativo).
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["pets.id", "pets.name", "pets.current_food_id"],
    filters: { id: order.customer_id },
  });
  const ownPets = (customer?.pets ?? []) as {
    id: string;
    name: string;
    current_food_id: string | null;
  }[];
  const matched = ownPets.filter(
    (p) => p.current_food_id && purchasedProductIds.has(p.current_food_id),
  );
  if (matched.length === 0) return;

  await pets.updatePets(matched.map((p) => ({ id: p.id, food_assigned_at: new Date() })));

  console.log(
    `[anticipación] Orden #${order.display_id}: reloj de reposición re-anclado a la compra para ${matched
      .map((p) => p.name)
      .join(", ")}.`,
  );
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
