import { model } from "@medusajs/framework/utils";

/**
 * Tarjeta guardada del cliente (API.md §10) — REFERENCIA, nunca la tarjeta.
 *
 * Aquí solo viven datos de presentación (franquicia, últimos 4, vencimiento) y
 * los punteros a la pasarela (`gateway_*`). El PAN/CVV no se almacenan JAMÁS:
 * cuando Mercado Pago entre (fast-follow post-infra), el dueño del token es MP
 * y estas filas se crean server-side con su referencia (`gateway_card_id`).
 *
 * `customer_id` es campo plano indexado (mismo rationale que `pet`,
 * DATABASE.md §8): el único patrón de consulta es "las tarjetas de este cliente".
 */
const SavedCard = model.define("saved_card", {
  id: model.id({ prefix: "card" }).primaryKey(),
  customer_id: model.text().index(),
  /** Pasarela dueña del token. Hoy solo MP está en el horizonte (D25 G4). */
  gateway: model.text().default("mercadopago"),
  /** `customer.id` de Mercado Pago (se llena al integrar la pasarela). */
  gateway_customer_id: model.text().nullable(),
  /** `card.id` de Mercado Pago — la referencia cobrable (se llena al integrar). */
  gateway_card_id: model.text().nullable(),
  /** Franquicia según la pasarela: "visa" | "master" | "amex" | … */
  brand: model.text(),
  last4: model.text(),
  exp_month: model.number(),
  exp_year: model.number(),
});

export default SavedCard;
