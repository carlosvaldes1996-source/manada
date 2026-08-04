import { model } from "@medusajs/framework/utils";

/**
 * Espejo local de una **Subscription** de Flow (D71) — el vínculo con el `sus_…`.
 *
 * Igual que con el cliente (`flow_customer`, D70), el `subscriptionId` lo genera
 * Flow y es el único handle para operar (`get`/`cancel`/`changePlan`). Se persiste
 * aquí porque perderlo deja la suscripción viva y cobrando sin que podamos tocarla.
 * A diferencia del cliente, sí hay vía de rescate: `customer/getSubscriptions`
 * permite reencontrarlas por `customerId`.
 *
 * ── `subscription_id` es NULLABLE a propósito ─────────────────────────────────
 * Esta etapa deja la capa de integración TERMINADA pero **sin conectar** al módulo
 * `subscription` de Manada (decisión explícita del alcance). El campo existe ya para
 * que enlazar después sea un `update`, no una migración; queda `null` mientras la
 * suscripción de Flow no represente todavía a una de Manada.
 *
 * ── Los campos de reloj son ESPEJO, no fuente de verdad ───────────────────────
 * `period_end` / `next_invoice_date` los calcula Flow, que en este modelo es el
 * dueño de la cadencia. Se copian para poder mostrarlos y decidir sin ir a la red,
 * pero ante una discrepancia MANDA Flow (`syncFlowSubscription` los refresca).
 */
const FlowSubscription = model.define("flow_subscription", {
  id: model.id({ prefix: "flowsub" }).primaryKey(),
  /** `subscriptionId` de Flow (`sus_…`). */
  flow_subscription_id: model.text().unique(),
  /** `planId` con el que se creó (o al que se movió tras un `changePlan`). */
  flow_plan_id: model.text().index(),
  /** `customerId` de Flow (`cus_…`) dueño de la suscripción. */
  flow_customer_id: model.text().index(),
  /**
   * `subscription.id` de Manada. Null hasta que se conecte el flujo (ver arriba).
   * UNIQUE para que una suscripción de Manada no pueda quedar representada por dos
   * suscripciones de Flow (doble cobro).
   */
  // (UNIQUE sobre columna nullable: Postgres permite N filas con NULL, así que
  // conviven muchas suscripciones aún no enlazadas y a lo sumo una por cada
  // suscripción de Manada — exactamente lo que se quiere.)
  subscription_id: model.text().unique().nullable(),
  /** Espejo de `status`: 0 no iniciada · 1 activa · 2 trial · 4 cancelada. */
  status: model.number().default(0),
  /** Espejo de `morose`: 0 al día · 1 vencido · 2 pendiente no vencido. */
  morose: model.number().default(0),
  /** 1 = se cancelará al terminar el período vigente. */
  cancel_at_period_end: model.number().default(0),
  period_start: model.dateTime().nullable(),
  period_end: model.dateTime().nullable(),
  next_invoice_date: model.dateTime().nullable(),
  last_synced_at: model.dateTime().nullable(),
});

export default FlowSubscription;
