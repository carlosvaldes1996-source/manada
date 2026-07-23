import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * `GET /store/subscriptions` (API.md §13) — suscripciones del cliente autenticado.
 *
 * Propiedad idéntica a `/store/pets` (§9) y `/store/payment-methods` (§10): la
 * relación Customer↔Subscription vive en un **Module Link** (`src/links/
 * customer-subscription.ts`), resuelta por `query.graph` (`customer.subscriptions`).
 * La autenticación se aplica en `src/api/middlewares.ts`.
 *
 * No hay POST: la suscripción **nace server-side** en el subscriber de `order.placed`
 * (`subscription-created.ts`) — se crea al checkout, no desde un formulario. La
 * gestión (pausar/cancelar/cambiar) es un bloque posterior (D55).
 *
 * Se enriquece cada fila con título + thumbnail del producto (presentación, no
 * almacenado) para que el storefront la muestre sin un segundo request.
 */

interface SubRow {
  id: string;
  product_id: string;
  created_at: string;
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data } = await query.graph({
    entity: "customer",
    fields: ["subscriptions.*"],
    filters: { id: req.auth_context.actor_id },
  });

  const subscriptions = ((data?.[0]?.subscriptions ?? []) as SubRow[])
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Augment de presentación: título + thumbnail del producto (no se almacena).
  const productIds = [...new Set(subscriptions.map((s) => s.product_id).filter(Boolean))];
  const infoById = new Map<string, { title?: string; thumbnail?: string | null }>();
  if (productIds.length > 0) {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "thumbnail"],
      filters: { id: productIds },
    });
    for (const p of (products ?? []) as { id: string; title?: string; thumbnail?: string | null }[]) {
      infoById.set(p.id, { title: p.title, thumbnail: p.thumbnail });
    }
  }

  const enriched = subscriptions.map((s) => ({
    ...s,
    product_title: infoById.get(s.product_id)?.title ?? null,
    thumbnail: infoById.get(s.product_id)?.thumbnail ?? null,
  }));

  res.json({ subscriptions: enriched });
}
