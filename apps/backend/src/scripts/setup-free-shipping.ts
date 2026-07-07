import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  FREE_SHIPPING_PROMO_CODE,
  FREE_SHIPPING_THRESHOLD,
} from "../lib/shipping";

/**
 * Promoción automática de ENVÍO GRATIS sobre el umbral (Fase 5 · Etapa B).
 *
 * Aplica la regla única de envío (definida en `src/lib/shipping.ts`) de forma
 * NATIVA: una promoción automática (`is_automatic`) que descuenta el 100% del
 * método de despacho cuando el subtotal del carrito (`item_total`) alcanza el
 * umbral. Así la ORDEN real queda con envío $0 cuando corresponde, sin ninguna
 * regla de negocio en el frontend.
 *
 * Idempotente: si la promoción ya existe (por código), no hace nada. Se ejecuta
 * con `pnpm --filter @manada/backend exec medusa exec ./src/scripts/setup-free-shipping.ts`
 * (o `npx medusa exec ...`). No requiere reseed.
 */
export default async function setupFreeShipping({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const promotionModuleService = container.resolve(Modules.PROMOTION);

  const existing = await promotionModuleService.listPromotions({
    code: FREE_SHIPPING_PROMO_CODE,
  });
  if (existing.length > 0) {
    logger.info(
      `[free-shipping] La promoción ${FREE_SHIPPING_PROMO_CODE} ya existe. Nada que hacer.`,
    );
    return;
  }

  await promotionModuleService.createPromotions({
    code: FREE_SHIPPING_PROMO_CODE,
    type: "standard",
    status: "active",
    is_automatic: true,
    application_method: {
      type: "percentage",
      target_type: "shipping_methods",
      allocation: "across",
      value: 100,
    },
    rules: [
      {
        attribute: "item_total",
        operator: "gte",
        values: [String(FREE_SHIPPING_THRESHOLD)],
      },
    ],
  });

  logger.info(
    `[free-shipping] Promoción automática ${FREE_SHIPPING_PROMO_CODE} creada: ` +
      `envío gratis cuando el subtotal ≥ ${FREE_SHIPPING_THRESHOLD} CLP.`,
  );
}
