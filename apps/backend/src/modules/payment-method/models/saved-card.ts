import { model } from "@medusajs/framework/utils";

/**
 * Tarjeta guardada del cliente (API.md §10) — REFERENCIA, nunca la tarjeta.
 *
 * Aquí solo viven datos de PRESENTACIÓN (franquicia, últimos 4) y los punteros a
 * la pasarela. El PAN/CVV no se almacenan JAMÁS: la tarjeta la custodia Flow, que
 * la tokeniza en su propio sitio (`customer/register`) y nos devuelve únicamente
 * con qué mostrarla.
 *
 * `customer_id` es campo plano indexado (mismo rationale que `pet`,
 * DATABASE.md §8): el único patrón de consulta es "las tarjetas de este cliente".
 *
 * ── Ajuste a la realidad de Flow (D70) ────────────────────────────────────────
 * El modelo nació con la forma de Mercado Pago (D25 G4), que nunca se integró. La
 * doc oficial de Flow obliga a corregir tres supuestos:
 *
 *  1. **Flow no devuelve vencimiento.** Ni el objeto Customer ni `RegisterResult`
 *     traen mes/año de expiración. `exp_month`/`exp_year` pasan a NULLABLE: antes se
 *     escribía `0`/`0`, un dato inventado que cualquier lógica de "tarjeta por
 *     vencer" habría creído.
 *  2. **Flow guarda UNA tarjeta por cliente.** Registrar otra reemplaza la anterior.
 *     La tabla sigue admitiendo N filas por cliente (herencia de MP), pero con Flow
 *     el upsert mantiene una sola viva por `gateway_customer_id`.
 *  3. **El `gateway` por omisión ya no es `mercadopago`** sino `flow`, la única
 *     pasarela real del proyecto.
 */
const SavedCard = model.define("saved_card", {
  id: model.id({ prefix: "card" }).primaryKey(),
  customer_id: model.text().index(),
  /** Pasarela dueña del token. Hoy siempre `flow` (D58/D59). */
  gateway: model.text().default("flow"),
  /**
   * `customerId` de Flow (`cus_…`) — la referencia COBRABLE.
   *
   * ⚠️ Copia denormalizada: desde D70 el dueño del vínculo cliente↔Flow es la tabla
   * `flow_customer` (una fila por cliente, con UNIQUE). Este campo se conserva
   * porque el cobro recurrente lo lee desde `subscription.payment_method_id` →
   * `saved_card`; unificar ambos caminos es trabajo de la etapa de cobros, no de la
   * Etapa 1 (Customers). Mientras convivan, `flow_customer` manda.
   */
  gateway_customer_id: model.text().nullable(),
  /**
   * Id de tarjeta en la pasarela. Con Flow queda SIEMPRE null: su API no expone un
   * identificador de tarjeta (se cobra contra el `customerId`). Se mantiene por si
   * entra una pasarela que sí lo tenga.
   */
  gateway_card_id: model.text().nullable(),
  /** Franquicia según la pasarela: "Visa" | "Mastercard" | … (`creditCardType`). */
  brand: model.text(),
  last4: model.text(),
  /** Null con Flow: su API no devuelve la fecha de vencimiento. */
  exp_month: model.number().nullable(),
  exp_year: model.number().nullable(),
});

export default SavedCard;
