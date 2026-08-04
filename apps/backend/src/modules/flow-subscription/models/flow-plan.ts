import { model } from "@medusajs/framework/utils";

/**
 * Registro local de un **Plan** creado en Flow (D71).
 *
 * ── Qué es un plan y qué NO es ────────────────────────────────────────────────
 * En Flow un Plan es una TARIFA RECURRENTE: `amount` + `currency` + `interval` +
 * `interval_count`. No tiene producto, SKU ni cantidad. Por eso este registro NO
 * apunta a un `variant_id` de Manada: un mismo plan sirve a CUALQUIER producto que
 * se cobre al mismo precio y con la misma cadencia.
 *
 * Ese detalle es lo que evita la explosión combinatoria. Si el plan se modelara por
 * variante, con ~172 variantes × 4 frecuencias harían falta cientos de planes. Al
 * modelarlo por ECONOMÍA (precio × cadencia), el número de planes crece con los
 * puntos de precio distintos realmente suscritos, no con el catálogo, y se comparte
 * entre clientes.
 *
 * ── Idempotencia ──────────────────────────────────────────────────────────────
 * A diferencia de `customerId`, el `planId` lo elige el comercio. Se deriva
 * determinísticamente de (moneda, monto, intervalo, cuenta) — ver `lib/flow-plan.ts` —,
 * así que el mismo precio+cadencia SIEMPRE produce el mismo `plan_id` y no puede
 * haber duplicados. El UNIQUE local lo sella.
 *
 * ── Por qué se guarda el monto ────────────────────────────────────────────────
 * `plans/edit` no permite cambiar el precio de un plan con suscriptores. El monto
 * de esta fila es, entonces, INMUTABLE en la práctica: se conserva para poder
 * decidir sin ir a la red si un precio nuevo exige crear otro plan.
 */
const FlowPlan = model.define("flow_plan", {
  id: model.id({ prefix: "flowplan" }).primaryKey(),
  /** El `planId` en Flow — elegido por nosotros y determinista. */
  plan_id: model.text().unique(),
  /** Monto del plan (CLP entero). Inmutable una vez que hay suscriptores. */
  amount: model.number(),
  currency_code: model.text().default("clp"),
  /** `interval` de Flow: 1 diario · 2 semanal · 3 mensual · 4 anual. */
  interval: model.number(),
  /** Multiplicador: `interval=2` + `interval_count=4` = cada 4 semanas. */
  interval_count: model.number(),
  /** Espejo de `status` de Flow: 1 activo · 0 eliminado. */
  status: model.number().default(1),
  last_synced_at: model.dateTime().nullable(),
});

export default FlowPlan;
