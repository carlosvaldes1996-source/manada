import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  settleSubscriptionRegistration,
  settleSubscriptionCardUpdate,
  type RegistrationOutcome,
} from "../../../lib/subscription-registration";

/**
 * `POST|GET /flow/register-return` (API.md §14, D59) — retorno del NAVEGADOR tras
 * tokenizar la tarjeta en Flow (`url_return` de `customer/register`). Flow reenvía el
 * `token` del registro; el `cart` o `sub` que originó el flujo viaja en el query que
 * armamos en `url_return` (Flow lo preserva).
 *
 * Dos modos, según el query:
 *  - `?cart=…` → 1ª compra suscrita: registra la tarjeta, cobra y completa la orden
 *    (`settleSubscriptionRegistration`, idempotente). Redirige a la confirmación.
 *  - `?sub=…`  → actualizar tarjeta (dunning): refresca la tarjeta y reintenta el
 *    cobro (`settleSubscriptionCardUpdate`). Redirige a `/cuenta`.
 *
 * Ruta fuera de `/store` a propósito (Flow no envía publishable key). Nunca asume
 * éxito por el retorno: el registro/cobro se verifican server-side contra Flow.
 */

const CONFIRM_ESTADO: Record<RegistrationOutcome, string> = {
  paid: "exito",
  register_failed: "tarjeta_rechazada",
  charge_failed: "cobro_rechazado",
  not_found: "error",
  invalid: "error",
};

async function handleReturn(req: MedusaRequest, res: MedusaResponse) {
  const base = (process.env.STOREFRONT_URL || "http://localhost:3000").replace(/\/+$/, "");
  const body = req.body as { token?: string } | undefined;
  const q = req.query as { token?: string; cart?: string; sub?: string };
  const token = body?.token ?? q.token;
  const cartId = q.cart;
  const subId = q.sub;

  // Actualización de tarjeta (dunning).
  if (subId) {
    const to = (params: string) => `${base}/cuenta?${params}`;
    if (!token) return res.redirect(to("tarjeta=error"));
    try {
      const result = await settleSubscriptionCardUpdate(req.scope, subId, token);
      const estado =
        result.outcome === "updated"
          ? result.charged
            ? "actualizada_cobrada"
            : "actualizada"
          : result.outcome === "register_failed"
            ? "rechazada"
            : "error";
      return res.redirect(to(`tarjeta=${estado}`));
    } catch (e) {
      console.error("[flow] Error actualizando la tarjeta de la suscripción:", e);
      return res.redirect(to("tarjeta=error"));
    }
  }

  // 1ª compra suscrita.
  const to = (params: string) => `${base}/checkout/confirmacion?${params}`;
  if (!token || !cartId) return res.redirect(to("estado=error"));
  try {
    const result = await settleSubscriptionRegistration(req.scope, cartId, token);
    const estado = CONFIRM_ESTADO[result.outcome];
    const orden = result.displayId ? `&orden=${result.displayId}` : "";
    return res.redirect(to(`estado=${estado}${orden}`));
  } catch (e) {
    console.error("[flow] Error procesando el registro de tarjeta / 1ª compra suscrita:", e);
    // El cobro pudo ocurrir; mostramos "pendiente" en vez de un error duro.
    return res.redirect(to("estado=pendiente"));
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  return handleReturn(req, res);
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return handleReturn(req, res);
}
