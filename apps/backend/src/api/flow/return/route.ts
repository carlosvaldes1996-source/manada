import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { settleFlowPayment, type SettleOutcome } from "../../../lib/flow-settle";

/**
 * `POST|GET /flow/return` (API.md §14, D58) — retorno del NAVEGADOR desde Flow
 * (`urlReturn`). Flow hace un POST form-encoded con el `token`. Verifica el estado
 * (reusando `settleFlowPayment`, idempotente → completa la orden si aún no lo hizo
 * el webhook) y redirige al storefront con el estado real.
 *
 * Nunca se asume éxito por el retorno: el estado sale de `payment/getStatus`. El
 * navegador termina en `/checkout/confirmacion?estado=…&orden=…`.
 */

/** Mapa estado interno → parámetro de la confirmación del storefront. */
const ESTADO: Record<SettleOutcome, string> = {
  paid: "exito",
  rejected: "rechazado",
  canceled: "cancelado",
  pending: "pendiente",
  not_found: "error",
};

async function handleReturn(req: MedusaRequest, res: MedusaResponse) {
  const base = (process.env.STOREFRONT_URL || "http://localhost:3000").replace(/\/+$/, "");
  const confirmUrl = (params: string) => `${base}/checkout/confirmacion?${params}`;

  const body = req.body as { token?: string } | undefined;
  const query = req.query as { token?: string };
  const token = body?.token ?? query?.token;

  if (!token) {
    res.redirect(confirmUrl("estado=error"));
    return;
  }

  try {
    const result = await settleFlowPayment(req.scope, token);
    const estado = ESTADO[result.outcome];
    const orden = result.displayId ? `&orden=${result.displayId}` : "";
    res.redirect(confirmUrl(`estado=${estado}${orden}`));
  } catch (e) {
    console.error("[flow] Error procesando el retorno:", e);
    // El webhook puede confirmar igual; mostramos "pendiente" en vez de un error duro.
    res.redirect(confirmUrl("estado=pendiente"));
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  return handleReturn(req, res);
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return handleReturn(req, res);
}
