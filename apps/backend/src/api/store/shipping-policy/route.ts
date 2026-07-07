import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  FREE_SHIPPING_THRESHOLD,
  BASE_SHIPPING_AMOUNT,
} from "../../../lib/shipping";

/**
 * Política de envío pública (Fase 5 · Etapa B) — `GET /store/shipping-policy`.
 *
 * Expone la regla única de envío para que el frontend la CONSUMA sin duplicarla:
 * costo base y umbral de envío gratis. El "gratis sobre el umbral" lo aplica una
 * promoción automática nativa en el checkout (la orden real queda con envío $0);
 * esta ruta solo informa los valores para la UI (barra de envío gratis, PDP, etc.).
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    shipping_policy: {
      currency_code: "clp",
      base_shipping_amount: BASE_SHIPPING_AMOUNT,
      free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    },
  });
}
