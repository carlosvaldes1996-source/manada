import type { MedusaContainer } from "@medusajs/framework/types";
import { isFlowConfigured } from "../lib/flow";
import { sweepDueSubscriptions } from "../lib/subscription-charge";

/**
 * Scheduler de RENOVACIONES (D59) — barrido AUTOMÁTICO del cobro recurrente.
 *
 * **Apagado por defecto (MVP).** Mientras el volumen es bajo, el 2º cobro se dispara
 * A MANO desde el Admin (sección "Suscripciones" → "Cobrar ahora"), que pasa por el
 * MISMO motor con el mismo lock. Es una decisión de producto: con un puñado de
 * suscripciones, el riesgo de un caso esquina que le cobre a quien no corresponde
 * pesa más que la comodidad de automatizar. El operador ve a quién va a cobrar antes
 * de hacerlo.
 *
 * Para encender el barrido automático (cuando el volumen lo justifique):
 * `SUBSCRIPTION_CHARGES_ENABLED=true`. El flag es opt-in EXPLÍCITO — cualquier otro
 * valor (ausente, vacío, "false", "1") deja el barrido apagado, de modo que un deploy
 * nuevo jamás empieza a cobrar por sí solo.
 *
 * La selección de vencidas y el cobro viven en `lib/subscription-charge.ts`
 * (`sweepDueSubscriptions`), compartidos con el disparo manual: un solo criterio de
 * "vencida" y un solo camino de cobro, sin doble verdad.
 */

/** ¿Está encendido el barrido automático? Opt-in explícito con `true`. */
export function autoChargesEnabled(): boolean {
  return String(process.env.SUBSCRIPTION_CHARGES_ENABLED ?? "").trim().toLowerCase() === "true";
}

export default async function chargeDueSubscriptions(container: MedusaContainer) {
  if (!autoChargesEnabled()) {
    console.log(
      "[cobro] Barrido automático APAGADO (SUBSCRIPTION_CHARGES_ENABLED != true) → no-op. " +
        "El cobro recurrente se dispara a mano desde el Admin (Suscripciones).",
    );
    return;
  }
  if (!isFlowConfigured()) {
    console.log("[cobro] Flow no configurado (FLOW_API_KEY/SECRET) → scheduler no-op.");
    return;
  }

  const result = await sweepDueSubscriptions(container);
  const total = result.due + result.retries;
  if (total === 0) return;

  console.log(
    `[cobro] Barrido de ${total} suscripción(es) (${result.due} vencidas + ${result.retries} reintentos): ` +
      Object.entries(result.tally)
        .map(([k, v]) => `${k}=${v}`)
        .join(", "),
  );
}

export const config = {
  name: "charge-due-subscriptions",
  // Diario a las 12:00 UTC (~08:00–09:00 en Chile). Cobrar de día facilita reintentos
  // y soporte el mismo día si algo falla. Sin efecto mientras el flag esté apagado.
  schedule: "0 12 * * *",
};
