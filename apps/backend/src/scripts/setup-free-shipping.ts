import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  FREE_SHIPPING_PROMO_CODE,
  FREE_SHIPPING_THRESHOLD,
  SUBSCRIPTION_FREE_SHIPPING_PROMO_CODE,
} from "../lib/shipping";

/**
 * Promociones automáticas de ENVÍO GRATIS (Fase 5 · Etapa B).
 *
 * Aplican las DOS ramas de la regla única de envío (definida en
 * `src/lib/shipping.ts`) de forma NATIVA — cada una es una promoción automática
 * (`is_automatic`) que descuenta el 100% del método de despacho:
 *
 *   1. `ENVIO_GRATIS_30K`        → cuando el subtotal (`item_total`) alcanza el umbral.
 *   2. `ENVIO_GRATIS_SUSCRIPCION`→ cuando ALGUNA línea del carrito es de suscripción.
 *
 * Así la ORDEN real queda con envío $0 cuando corresponde, sin ninguna regla de
 * negocio en el frontend. Que ambas apliquen a la vez no cobra de menos: la
 * segunda no encuentra saldo que descontar (`applicableTotal` queda en 0) y no
 * genera ajuste.
 *
 * Sobre la regla de suscripción: el atributo `items.metadata.is_subscription`
 * se resuelve contra el carrito completo que Medusa pasa como contexto de la
 * promoción (`items.*` incluye `metadata`). El operador es `in` —no `eq`— a
 * propósito: `eq` exige que TODAS las líneas cumplan, y un carrito mixto
 * (suscripción + compra única) perdería el beneficio.
 *
 * Idempotente: cada promoción se crea solo si no existe (por código). Se ejecuta
 * con `pnpm --filter @manada/backend exec medusa exec ./src/scripts/setup-free-shipping.ts`
 * (o `npx medusa exec ...`). No requiere reseed.
 */
export default async function setupFreeShipping({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const promotionModuleService = container.resolve(Modules.PROMOTION);

  /** Descuento del 100% sobre el despacho — el cuerpo común de ambas promociones. */
  const freeShippingMethod = {
    type: "percentage" as const,
    target_type: "shipping_methods" as const,
    allocation: "across" as const,
    value: 100,
  };

  const existing = await promotionModuleService.listPromotions({
    code: [FREE_SHIPPING_PROMO_CODE, SUBSCRIPTION_FREE_SHIPPING_PROMO_CODE],
  });
  const already = new Set(existing.map((p) => p.code));

  if (already.has(FREE_SHIPPING_PROMO_CODE)) {
    logger.info(`[free-shipping] ${FREE_SHIPPING_PROMO_CODE} ya existe. Nada que hacer.`);
  } else {
    await promotionModuleService.createPromotions({
      code: FREE_SHIPPING_PROMO_CODE,
      type: "standard",
      status: "active",
      is_automatic: true,
      application_method: freeShippingMethod,
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

  if (already.has(SUBSCRIPTION_FREE_SHIPPING_PROMO_CODE)) {
    logger.info(
      `[free-shipping] ${SUBSCRIPTION_FREE_SHIPPING_PROMO_CODE} ya existe. Nada que hacer.`,
    );
  } else {
    await promotionModuleService.createPromotions({
      code: SUBSCRIPTION_FREE_SHIPPING_PROMO_CODE,
      type: "standard",
      status: "active",
      is_automatic: true,
      application_method: freeShippingMethod,
      rules: [
        {
          attribute: "items.metadata.is_subscription",
          operator: "in",
          values: ["true"],
        },
      ],
    });
    logger.info(
      `[free-shipping] Promoción automática ${SUBSCRIPTION_FREE_SHIPPING_PROMO_CODE} creada: ` +
        `envío gratis cuando el carrito trae una línea de suscripción, sin monto mínimo.`,
    );
  }
}
