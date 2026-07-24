import { z } from "@medusajs/deps/zod";

/**
 * Validación de `PATCH /store/subscriptions/:id` (API.md §13.2, D56·D). Body
 * PARCIAL: al menos un campo. Los enums espejan el modelo `subscription`
 * (DATABASE.md §9) y las frecuencias ofrecidas en el front.
 */
const frequency = z.union([z.literal(2), z.literal(4), z.literal(6), z.literal(8)]);
const status = z.enum(["active", "paused", "cancelled"]);

export const StoreUpdateSubscription = z
  .object({
    frequency_weeks: frequency.optional(),
    status: status.optional(),
    next_delivery_date: z.string().datetime().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "Debes enviar al menos un campo a actualizar.",
  });

export type StoreUpdateSubscriptionType = z.infer<typeof StoreUpdateSubscription>;
