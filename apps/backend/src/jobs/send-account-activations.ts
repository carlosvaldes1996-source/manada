import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { provisionAccountForOrder, type ProvisionOutcome } from "../lib/account-provisioning";

/**
 * Activación de cuenta post-compra CON RETRASO (obj 4) — job programado.
 *
 * Por qué un job y no el evento `order.placed`: el email de "Define tu contraseña"
 * NO debe competir con la confirmación del pedido (Carlos) → se envía ~2h después.
 * Además el token de reset de Medusa VENCE a los 15 min, así que debe generarse al
 * ENVIARSE, no en la compra. Por eso todo (crear la cuenta + token + email) ocurre
 * aquí, recién cuando la orden supera el retraso.
 *
 * Selección: órdenes de INVITADO (customer sin `has_account`) con antigüedad ≥
 * `ACCOUNT_ACTIVATION_DELAY_MINUTES` (default 120), dentro de una ventana de
 * recuperación (`RECOVERY_HOURS`) para tolerar caídas del job. IDEMPOTENTE: una vez
 * provisionada, la cuenta queda con `has_account = true` y se omite en barridos
 * siguientes (además `provisionAccountForOrder` re-chequea por dentro); un lock por
 * cliente evita doble envío entre ejecuciones solapadas. NO BLOQUEANTE: un fallo se
 * registra y no detiene al resto ni afecta la orden.
 *
 * ⚠️ GATEADO por `AUTO_ACCOUNT_ENABLED=true` (OFF por defecto): toca la auth de
 * clientes → no corre en producción hasta validar E2E.
 *
 * Nota de escala: hoy escanea una ventana acotada de órdenes recientes (volumen bajo).
 * Si el volumen crece, migrar a una marca persistente de "activación pendiente"
 * (columna/tabla) en vez de reescanear por `created_at`.
 */

const DEFAULT_DELAY_MINUTES = 120; // "un par de horas" tras la compra
const RECOVERY_HOURS = 72; // ventana hacia atrás: recupera órdenes si el job estuvo caído
const MAX_PER_RUN = 500;

export default async function sendAccountActivations(container: MedusaContainer) {
  if (process.env.AUTO_ACCOUNT_ENABLED !== "true") return;

  const delayMinutes = Number(process.env.ACCOUNT_ACTIVATION_DELAY_MINUTES) || DEFAULT_DELAY_MINUTES;
  const now = Date.now();
  const eligibleBefore = new Date(now - delayMinutes * 60_000); // ≥ delay de antigüedad
  const notOlderThan = new Date(now - delayMinutes * 60_000 - RECOVERY_HOURS * 3_600_000);

  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const locking = container.resolve(Modules.LOCKING);

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "email",
      "customer_id",
      "created_at",
      "metadata",
      "customer.has_account",
      "shipping_address.first_name",
    ],
    filters: { created_at: { $gte: notOlderThan, $lte: eligibleBefore } },
    pagination: { take: MAX_PER_RUN, order: { created_at: "ASC" } },
  });

  const tally: Partial<Record<ProvisionOutcome, number>> = {};
  for (const order of orders ?? []) {
    if (!order?.email || !order.customer_id) continue;
    // Renovación (cobro recurrente): el cliente ya tiene cuenta → omitir.
    if ((order.metadata as Record<string, unknown> | null)?.is_renewal) continue;
    // Pre-filtro barato: si ya tiene cuenta, saltar (provision re-chequea igual).
    const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer;
    if ((customer as { has_account?: boolean } | undefined)?.has_account) continue;

    try {
      const outcome = await locking.execute(
        `account-activation:${order.customer_id}`,
        () =>
          provisionAccountForOrder(container, {
            email: order.email,
            customerId: order.customer_id,
            firstName: order.shipping_address?.first_name,
          }),
        { timeout: 30 },
      );
      tally[outcome] = (tally[outcome] ?? 0) + 1;
    } catch (e) {
      // Un fallo (p. ej. no se pudo tomar el lock) no frena al resto.
      console.error(`[cuenta] Error activando la cuenta de la orden ${order.id}:`, e);
    }
  }

  const provisioned = tally.provisioned ?? 0;
  if (provisioned > 0) {
    console.log(
      `[cuenta] Activaciones enviadas: ${Object.entries(tally)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`,
    );
  }
}

export const config = {
  name: "send-account-activations",
  // Cada 15 min: con el retraso por defecto (120 min) el email llega ~2h–2h15m
  // después de la compra, holgadamente separado de la confirmación del pedido.
  schedule: "*/15 * * * *",
};
