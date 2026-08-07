import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  FREE_SHIPPING_THRESHOLD,
  BASE_SHIPPING_AMOUNT,
} from "../../../lib/shipping";

/**
 * Política de envío pública (Fase 5 · Etapa B) — `GET /store/shipping-policy`.
 *
 * Expone la regla única de envío para que el frontend la CONSUMA sin duplicarla:
 * costo base, umbral de envío gratis y si la suscripción incluye el despacho.
 * Las dos ramas del "gratis" las aplican promociones automáticas nativas en el
 * checkout (la orden real queda con envío $0); esta ruta solo informa los valores
 * para la UI (barra de envío gratis, PDP, carrito, checkout).
 *
 * `subscription_free_shipping` es una CONSTANTE de política, no un cálculo sobre
 * el carrito: dice que la suscripción incluye despacho, y por eso puede anunciarse
 * en superficies que no tienen carrito (landing, PDP, /despacho). Quién cumple hoy
 * la condición lo decide el backend al cobrar.
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    shipping_policy: {
      currency_code: "clp",
      base_shipping_amount: BASE_SHIPPING_AMOUNT,
      free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
      subscription_free_shipping: true,
    },
  });
}
