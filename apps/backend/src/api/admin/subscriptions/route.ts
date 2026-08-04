import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SUBSCRIPTION_MODULE } from "../../../modules/subscription";
import type SubscriptionModuleService from "../../../modules/subscription/service";
import { PAYMENT_METHOD_MODULE } from "../../../modules/payment-method";
import type PaymentMethodModuleService from "../../../modules/payment-method/service";
import { listDueSubscriptions } from "../../../lib/subscription-charge";

/**
 * `GET /admin/subscriptions` — panel operativo del cobro recurrente (D59).
 *
 * Existe porque el 2º cobro se dispara A MANO en el MVP (ver
 * `src/jobs/charge-due-subscriptions.ts`): el operador necesita ver a QUIÉN le va a
 * cobrar, CUÁNTO y CON QUÉ TARJETA **antes** de apretar el botón. Solo lectura; el
 * cobro vive en `POST /admin/subscriptions/:id/charge`.
 *
 * `is_due` no se recalcula aquí: se deriva de `listDueSubscriptions`, el MISMO
 * criterio que usa el scheduler. Si el panel dice "vencida", el motor coincide.
 *
 * `chargeable` responde la pregunta operativa completa: ¿este botón va a cobrar de
 * verdad? Falso si no está vencida, si el estado no admite cobro, o si no hay tarjeta
 * tokenizada (suscripción legada de D55/D56) — el caso esquina que hay que evitar.
 *
 * Las rutas `/admin/*` quedan autenticadas por Medusa automáticamente.
 */

type SubRow = {
  id: string;
  variant_id: string;
  product_id: string;
  quantity: number;
  frequency_weeks: number;
  next_delivery_date: string;
  status: string;
  agreed_unit_price: number;
  currency_code: string;
  payment_method_id: string | null;
  last_charged_at: string | null;
  failed_charge_count: number;
  last_charge_error: string | null;
  next_charge_attempt_at: string | null;
  created_at: string;
};

type CustomerRow = {
  id: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const subsService = req.scope.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE);
  const cards = req.scope.resolve<PaymentMethodModuleService>(PAYMENT_METHOD_MODULE);

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;

  const filters = statusFilter ? { status: statusFilter } : {};
  const [subscriptions, count] = (await subsService.listAndCountSubscriptions(filters, {
    skip: offset,
    take: limit,
    order: { next_delivery_date: "ASC" },
  })) as unknown as [SubRow[], number];

  // Vencidas según el criterio del scheduler (fuente única), no una regla paralela.
  const dueIds = new Set((await listDueSubscriptions(req.scope)).map((d) => d.id));

  // Dueño de cada suscripción vía el Module Link Customer↔Subscription, recorrido
  // DESDE la suscripción (mismo traversal que usa el motor de cobro): así se filtra
  // por los ids de esta página en vez de traer clientes y cruzarlos después.
  const ownerBySub = new Map<string, { id: string; email: string; name: string | null }>();
  const ids = subscriptions.map((s) => s.id);
  if (ids.length > 0) {
    const { data: withOwner } = await query.graph({
      entity: "subscription",
      fields: ["id", "customer.id", "customer.email", "customer.first_name", "customer.last_name"],
      filters: { id: ids },
    });
    for (const row of (withOwner ?? []) as { id: string; customer?: CustomerRow | CustomerRow[] }[]) {
      // El lado "uno" de un link puede llegar como objeto o como arreglo.
      const c = Array.isArray(row.customer) ? row.customer[0] : row.customer;
      if (!c?.id) continue;
      const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || null;
      ownerBySub.set(row.id, { id: c.id, email: c.email ?? "", name });
    }
  }

  // Producto (presentación) y tarjeta enlazada (marca/últimos 4), por lote.
  const productIds = [...new Set(subscriptions.map((s) => s.product_id).filter(Boolean))];
  const productById = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title"],
      filters: { id: productIds },
    });
    for (const p of (products ?? []) as { id: string; title?: string }[]) {
      productById.set(p.id, p.title ?? p.id);
    }
  }

  const cardIds = [...new Set(subscriptions.map((s) => s.payment_method_id).filter(Boolean))] as string[];
  const cardById = new Map<string, { brand: string; last4: string }>();
  if (cardIds.length > 0) {
    for (const c of await cards.listSavedCards({ id: cardIds })) {
      cardById.set(c.id, { brand: c.brand, last4: c.last4 });
    }
  }

  const rows = subscriptions.map((s) => {
    const card = s.payment_method_id ? cardById.get(s.payment_method_id) ?? null : null;
    const isDue = dueIds.has(s.id);
    return {
      id: s.id,
      status: s.status,
      product_title: productById.get(s.product_id) ?? s.product_id,
      quantity: s.quantity,
      frequency_weeks: s.frequency_weeks,
      next_delivery_date: s.next_delivery_date,
      amount: Math.round((s.agreed_unit_price ?? 0) * (s.quantity ?? 1)),
      currency_code: s.currency_code,
      customer: ownerBySub.get(s.id) ?? null,
      card,
      is_due: isDue,
      /** El botón "Cobrar ahora" solo cobra de verdad si esto es true. */
      chargeable: isDue && Boolean(card) && (s.status === "active" || s.status === "past_due"),
      last_charged_at: s.last_charged_at,
      failed_charge_count: s.failed_charge_count,
      last_charge_error: s.last_charge_error,
      next_charge_attempt_at: s.next_charge_attempt_at,
      created_at: s.created_at,
    };
  });

  res.json({ subscriptions: rows, count, limit, offset, due_total: dueIds.size });
}
