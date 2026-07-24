import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { settleFlowPayment } from "../../../lib/flow-settle";

/**
 * `POST /flow/confirmation` (API.md §14, D58) — webhook server-to-server de Flow
 * (`urlConfirmation`). Es la fuente autoritativa de la confirmación: Flow envía el
 * `token`, aquí se verifica con `payment/getStatus` y SOLO si el pago está pagado
 * se completa la orden (vía `settleFlowPayment`, idempotente).
 *
 * Ruta fuera de `/store` a propósito: Flow no envía publishable key. Es pública y
 * segura porque no confía en el payload: la verdad del pago se re-consulta a Flow
 * con la firma del comercio.
 *
 * Contrato con Flow: 200 = recibido; != 200 → Flow REINTENTA. Por eso devolvemos
 * 500 solo cuando el pago está confirmado pero la provisión de la orden falló
 * (queremos el reintento); estados no pagados / token desconocido responden 200.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as { token?: string } | undefined;
  const query = req.query as { token?: string };
  const token = body?.token ?? query?.token;

  if (!token) {
    res.status(400).send("missing token");
    return;
  }

  try {
    await settleFlowPayment(req.scope, token);
    res.status(200).send("OK");
  } catch (e) {
    console.error("[flow] Error procesando la confirmación:", e);
    // Pago confirmado pero la orden no se pudo crear → 500 para que Flow reintente.
    res.status(500).send("error");
  }
}
