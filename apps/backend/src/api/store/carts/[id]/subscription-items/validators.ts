import { z } from "@medusajs/deps/zod";

/**
 * Validación para `POST /store/carts/:id/subscription-items` (D55).
 * `frequency_weeks` espeja las frecuencias ofrecidas en el front
 * (`SUBSCRIPTION_FREQUENCIES`).
 */
export const StoreAddSubscriptionItem = z.object({
  variant_id: z.string().trim().min(1),
  quantity: z.number().int().positive().max(20).default(1),
  frequency_weeks: z.union([z.literal(2), z.literal(4), z.literal(6), z.literal(8)]),
});
export type StoreAddSubscriptionItemType = z.infer<typeof StoreAddSubscriptionItem>;
