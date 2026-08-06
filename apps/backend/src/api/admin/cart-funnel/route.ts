import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { CART_FUNNEL_MODULE } from "../../../modules/cart-funnel";
import type CartFunnelModuleService from "../../../modules/cart-funnel/service";
import { FUNNEL_STAGES } from "../../../modules/cart-funnel/models/cart-funnel";

/**
 * `GET /admin/cart-funnel` (D78) — el panel que hace visible lo que pasa ANTES de
 * la Order. Solo lectura.
 *
 * Existe porque el Admin de Medusa v2 **no tiene sección de carritos**: sus rutas
 * son `/orders`, `/customers`, `/promotions` y ninguna más. Un carrito abandonado
 * nunca fue visible, ni antes ni después de D75; el dato estaba en la base y no
 * había por dónde mirarlo.
 *
 * Reparto de responsabilidades, igual que en el proyector (D75):
 *  - La **lista** se sirve del snapshot de `cart_funnel` (etapa, totales, último
 *    movimiento). Es lo que permite ordenar y paginar sin tocar el carrito: los
 *    totales del Cart son columnas CALCULADAS y no se pueden consultar en SQL.
 *  - El **contenido** (qué productos hay) se lee EN VIVO del carrito, por lote y
 *    solo para las filas de la página. El Cart sigue siendo el único dueño de eso;
 *    aquí no se copia nada.
 *
 * `abandonado` se DERIVA aquí, no se almacena (§11.3): `stage != 'paid'` y sin
 * actividad desde hace N horas. Por eso cambiar la definición de negocio es cambiar
 * un parámetro de esta consulta, no reprocesar la tabla.
 *
 * Las rutas `/admin/*` quedan autenticadas por Medusa automáticamente.
 */

/** Ventana por defecto para considerar muerto un carrito (horas). */
const DEFAULT_ABANDONED_HOURS = 24;

type FunnelRow = {
  id: string;
  cart_id: string;
  visitor_id: string | null;
  customer_id: string | null;
  email: string | null;
  stage: string;
  activated_at: string | null;
  identified_at: string | null;
  checkout_started_at: string | null;
  payment_pending_at: string | null;
  paid_at: string | null;
  last_activity_at: string;
  payment_attempts: number;
  last_payment_status: string | null;
  items_count: number;
  units_count: number;
  total: number;
  currency_code: string;
  has_subscription: boolean;
  promo_codes: string[] | null;
  order_id: string | null;
  order_display_id: number | null;
  utm_source: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_path: string | null;
  device_type: string | null;
  pet_species: string | null;
  pet_stage: string | null;
  created_at: string;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const funnel = req.scope.resolve<CartFunnelModuleService>(CART_FUNNEL_MODULE);

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const stage = typeof req.query.stage === "string" && FUNNEL_STAGES.includes(req.query.stage as never)
    ? req.query.stage
    : undefined;
  const abandonedHours = Number(req.query.abandoned_hours) || DEFAULT_ABANDONED_HOURS;
  const onlyAbandoned = req.query.abandoned === "true";
  const withItemsOnly = req.query.with_items !== "false";

  const cutoff = new Date(Date.now() - abandonedHours * 3600 * 1000);

  const filters: Record<string, unknown> = {};
  if (stage) filters.stage = stage;
  // "Abandonado" = derivado, nunca almacenado.
  if (onlyAbandoned) {
    filters.stage = { $ne: "paid" };
    filters.last_activity_at = { $lt: cutoff };
  }
  // Por defecto se ocultan los carritos que nunca recibieron un producto: existen
  // porque el frontend crea el carrito en una petición y agrega la línea en la
  // siguiente, así que un carrito sin `activated_at` es ruido, no intención.
  if (withItemsOnly) filters.activated_at = { $ne: null };

  const [rows, count] = (await funnel.listAndCountCartFunnels(filters, {
    skip: offset,
    take: limit,
    order: { last_activity_at: "DESC" },
  })) as unknown as [FunnelRow[], number];

  // Contenido EN VIVO del carrito (el snapshot no guarda líneas, por diseño).
  const cartIds = rows.map((r) => r.cart_id);
  const itemsByCart = new Map<string, { title: string; quantity: number }[]>();
  if (cartIds.length > 0) {
    try {
      const { data: carts } = await query.graph({
        entity: "cart",
        fields: ["id", "items.title", "items.product_title", "items.quantity"],
        filters: { id: cartIds },
      });
      for (const c of (carts ?? []) as {
        id: string;
        items?: { title?: string; product_title?: string; quantity?: number }[];
      }[]) {
        itemsByCart.set(
          c.id,
          (c.items ?? []).map((i) => ({
            title: i.product_title || i.title || "—",
            quantity: i.quantity ?? 0,
          })),
        );
      }
    } catch {
      // Si el carrito ya no se puede leer, la fila igual sirve: el snapshot basta.
    }
  }

  // Dueño (cliente con cuenta) de las filas de esta página.
  const customerIds = [...new Set(rows.map((r) => r.customer_id).filter(Boolean))] as string[];
  const customerById = new Map<string, { id: string; email: string; name: string | null }>();
  if (customerIds.length > 0) {
    try {
      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "email", "first_name", "last_name"],
        filters: { id: customerIds },
      });
      for (const c of (customers ?? []) as {
        id: string;
        email?: string;
        first_name?: string | null;
        last_name?: string | null;
      }[]) {
        const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || null;
        customerById.set(c.id, { id: c.id, email: c.email ?? "", name });
      }
    } catch {
      // Sin nombre del cliente la fila sigue siendo útil (queda el email del carrito).
    }
  }

  const now = Date.now();
  const list = rows.map((r) => {
    const lastActivity = new Date(r.last_activity_at).getTime();
    const bornAt = new Date(r.activated_at ?? r.created_at).getTime();
    return {
      ...r,
      customer: r.customer_id ? customerById.get(r.customer_id) ?? null : null,
      items: itemsByCart.get(r.cart_id) ?? [],
      /** Minutos entre el primer producto y el último movimiento. */
      alive_minutes: Math.max(0, Math.round((lastActivity - bornAt) / 60000)),
      /** Minutos desde el último movimiento (qué tan frío está). */
      idle_minutes: Math.max(0, Math.round((now - lastActivity) / 60000)),
      /** DERIVADO en lectura, no almacenado. */
      is_abandoned: r.stage !== "paid" && lastActivity < now - abandonedHours * 3600 * 1000,
    };
  });

  // Resumen del embudo — sobre TODO el universo, no sobre la página.
  const base = withItemsOnly ? { activated_at: { $ne: null } } : {};
  const byStage: Record<string, number> = {};
  for (const s of FUNNEL_STAGES) {
    byStage[s] = await funnel.listAndCountCartFunnels({ ...base, stage: s }, { take: 1 }).then(
      (r) => (r as unknown as [unknown[], number])[1],
    );
  }
  const totalCarts = Object.values(byStage).reduce((a, b) => a + b, 0);
  const converted = byStage.paid ?? 0;

  res.json({
    carts: list,
    count,
    limit,
    offset,
    summary: {
      by_stage: byStage,
      total: totalCarts,
      converted,
      conversion_rate: totalCarts > 0 ? Math.round((converted / totalCarts) * 1000) / 10 : 0,
      abandoned_hours: abandonedHours,
    },
  });
}
