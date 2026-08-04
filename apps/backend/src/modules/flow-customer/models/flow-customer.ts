import { model } from "@medusajs/framework/utils";

/**
 * Cliente de Manada dentro de Flow (D70, Etapa 1) — el VÍNCULO 1:1 entre un
 * `customer` de Medusa y su `customerId` (`cus_…`) en Flow.
 *
 * ── Por qué existe una tabla propia y no una columna en `saved_card` ──────────
 * Un Customer de Flow es del CLIENTE, no de una tarjeta: es la bóveda contra la
 * que Flow guarda (como máximo) UNA tarjeta y contra la que se cobra. Colgarlo de
 * `saved_card` tenía tres consecuencias reales:
 *
 *  1. El vínculo solo nacía cuando el cliente COMPLETABA el registro de tarjeta.
 *     Quien abandonaba en la página de Flow no dejaba rastro → el siguiente intento
 *     creaba OTRO `cus_…`. Cada checkout abandonado filtraba un cliente en Flow.
 *  2. Flow NO permite buscar un cliente por `externalId` (`customer/list` solo
 *     filtra por nombre), así que un `cus_…` perdido no se puede recuperar por API.
 *     El vínculo local es la única fuente de verdad → merece una fila propia y una
 *     restricción UNIQUE, no un campo opcional en una tabla de tarjetas.
 *  3. `saved_card` modela "N tarjetas por cliente" (herencia de Mercado Pago, §10);
 *     Flow modela "1 tarjeta por cliente". Mezclarlos hacía ambiguo el "un hecho,
 *     un dueño".
 *
 * ── Reparto de dominios ───────────────────────────────────────────────────────
 * Aquí vive solo lo que es del CLIENTE en Flow (identidad + capacidad de cobro).
 * La PRESENTACIÓN de la tarjeta (marca, últimos 4) sigue siendo de `saved_card`
 * (§10) y no se duplica aquí.
 */
const FlowCustomer = model.define("flow_customer", {
  id: model.id({ prefix: "flowcus" }).primaryKey(),
  /**
   * `customer.id` de Medusa. ÚNICO: es la garantía dura de que jamás existan dos
   * clientes de Flow para el mismo cliente de Manada. Como Flow no ofrece
   * "crear si no existe", esta restricción es la idempotencia real.
   */
  customer_id: model.text().unique(),
  /** `customerId` de Flow (`cus_…`). Único: dos clientes no comparten bóveda. */
  flow_customer_id: model.text().unique(),
  /**
   * Espejo de `status` de Flow: `'1'` activo · `'0'` eliminado. Se guarda como
   * TEXTO porque el spec oficial lo declara string. Si Flow lo reporta `'0'`, el
   * vínculo está muerto y hay que recrear el cliente.
   */
  status: model.text().default("1"),
  /**
   * Espejo de `pay_mode` de Flow: `'auto'` (tiene tarjeta, se puede cobrar
   * server-to-server) · `'manual'` (sin tarjeta utilizable). Es la respuesta
   * AUTORITATIVA a "¿puedo cobrarle?", mejor que inferirla de tener marca/últimos 4.
   * Null mientras no hayamos leído un objeto Customer de Flow.
   */
  pay_mode: model.text().nullable(),
  /** `registerDate` de Flow: cuándo registró su tarjeta. Null si aún no registró. */
  register_date: model.dateTime().nullable(),
  /** Última vez que se reconcilió esta fila contra Flow (`customer/get`). */
  last_synced_at: model.dateTime().nullable(),
});

export default FlowCustomer;
