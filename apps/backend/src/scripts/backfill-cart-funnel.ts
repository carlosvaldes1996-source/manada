import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { projectCartFunnel } from "../lib/cart-funnel-projection";
import { CART_FUNNEL_MODULE } from "../modules/cart-funnel";
import type CartFunnelModuleService from "../modules/cart-funnel/service";
import { CART_FUNNEL_PROJECTION_VERSION } from "../modules/cart-funnel/models/cart-funnel";

/**
 * Backfill de la proyección del funnel (D75) sobre los carritos ya existentes.
 *
 * Esto es lo que hace que la solución **no arranque ciega**: los carritos de
 * producción llevan meses acumulando información que nadie ha consultado (fecha de
 * creación, líneas incluidas las eliminadas, email, despacho, intentos de pago,
 * conversión). Una pasada de este script la vuelve toda consultable.
 *
 * Usa el MISMO proyector que los subscribers — no hay una segunda implementación
 * que pueda desincronizarse. La única diferencia es deliberada: **NO se pasa
 * `observedAt`**, así que `last_activity_at` se deriva puramente de los datos. Si se
 * estampara `Date.now()`, todos los carritos históricos quedarían marcados con la
 * fecha de hoy y se destruiría justo el dato que se quiere recuperar.
 *
 * Idempotente y reanudable: proyectar dos veces el mismo carrito da el mismo
 * resultado, así que se puede cortar y volver a correr sin consecuencias.
 *
 * Uso:
 *   npx medusa exec ./src/scripts/backfill-cart-funnel.ts
 *   FUNNEL_BACKFILL_LIMIT=500 npx medusa exec ./src/scripts/backfill-cart-funnel.ts
 *   FUNNEL_BACKFILL_ONLY_STALE=true npx medusa exec ./src/scripts/backfill-cart-funnel.ts
 *
 * `FUNNEL_BACKFILL_ONLY_STALE` re-proyecta solo las filas con
 * `projection_version` anterior a la actual: es el mecanismo que hace barato
 * agregar un campo mañana sin migrar datos a mano.
 */

const BATCH_SIZE = 200;

export default async function backfillCartFunnel({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const funnelService = container.resolve<CartFunnelModuleService>(CART_FUNNEL_MODULE);
  const cartModule = container.resolve(Modules.CART) as {
    listCarts: (
      filters: Record<string, unknown>,
      config?: Record<string, unknown>,
    ) => Promise<{ id: string }[]>;
  };

  const limit = Number(process.env.FUNNEL_BACKFILL_LIMIT ?? 0) || Infinity;
  const onlyStale = process.env.FUNNEL_BACKFILL_ONLY_STALE === "true";

  // Modo "solo obsoletas": se re-proyectan las filas calculadas con una versión
  // anterior del proyector, en vez de barrer todos los carritos.
  let targetCartIds: string[] | null = null;
  if (onlyStale) {
    const stale = await funnelService.listCartFunnels(
      { projection_version: { $lt: CART_FUNNEL_PROJECTION_VERSION } },
      { take: 100000 },
    );
    targetCartIds = stale.map((row) => row.cart_id as string);
    logger.info(
      `[funnel] Backfill selectivo: ${targetCartIds.length} filas por debajo de la versión ${CART_FUNNEL_PROJECTION_VERSION}.`,
    );
  }

  let offset = 0;
  let processed = 0;
  let failed = 0;

  for (;;) {
    if (processed >= limit) break;

    let cartIds: string[];
    if (targetCartIds) {
      cartIds = targetCartIds.slice(offset, offset + BATCH_SIZE);
    } else {
      const carts = await cartModule.listCarts(
        {},
        { take: BATCH_SIZE, skip: offset, order: { created_at: "ASC" } },
      );
      cartIds = carts.map((c) => c.id);
    }

    if (cartIds.length === 0) break;

    for (const cartId of cartIds) {
      if (processed >= limit) break;
      try {
        // Sin `observedAt`: el histórico se deriva de los datos, no de "ahora".
        await projectCartFunnel(container, cartId);
      } catch (e) {
        failed += 1;
        logger.warn(`[funnel] Backfill falló para ${cartId}: ${e instanceof Error ? e.message : String(e)}`);
      }
      processed += 1;
    }

    offset += cartIds.length;
    logger.info(`[funnel] Backfill: ${processed} carritos proyectados…`);

    if (cartIds.length < BATCH_SIZE) break;
  }

  logger.info(
    `[funnel] Backfill terminado: ${processed} carritos proyectados, ${failed} con error.`,
  );
}
