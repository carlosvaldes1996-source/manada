import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { addToCartWorkflow, updateLineItemInCartWorkflow } from "@medusajs/core-flows";
import { StoreAddSubscriptionItemType } from "./validators";

/**
 * `POST /store/carts/:id/subscription-items` (API.md §13, D55) — agrega una línea
 * de SUSCRIPCIÓN al carrito **cobrando el precio suscrito desde la primera compra**.
 *
 * Por qué una ruta propia (no la Store `line-items`): la Store API no deja fijar
 * `unit_price` (seguridad), y una promoción estándar no puede leer la metadata de la
 * línea ni variar el % por producto. Esta ruta computa el descuento SERVER-SIDE
 * (fuente única: `product.metadata.subscription_discount_percentage`, igual que el
 * middleware) y lo fija como **precio custom** de la línea (`is_custom_price` → el
 * recálculo del carrito no lo pisa). La compra única sigue usando la ruta core
 * intacta: **cero blast-radius** sobre el flujo existente.
 *
 * La línea queda con `metadata: { is_subscription, frequency_weeks }`, que viaja a
 * la orden, donde `subscription-created.ts` crea la suscripción (snapshot del precio
 * de la línea ya con descuento).
 */

const CLP_ROUND_STEP = 10;
const roundCLP = (a: number) => Math.floor(a / CLP_ROUND_STEP) * CLP_ROUND_STEP;
function metaNumber(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

type CartLine = {
  id: string;
  variant_id?: string;
  product_id?: string;
  unit_price?: number;
  metadata?: Record<string, unknown> | null;
};

export async function POST(
  req: MedusaRequest<StoreAddSubscriptionItemType>,
  res: MedusaResponse,
) {
  const cartId = req.params.id;
  const { variant_id, quantity, frequency_weeks } = req.validatedBody;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // 1) Agrega la línea con la metadata de suscripción. El precio base (de la
  //    variante) lo resuelve el propio workflow con el contexto de precios del carrito.
  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id: cartId,
      items: [{ variant_id, quantity, metadata: { is_subscription: true, frequency_weeks } }],
    },
  });

  // 2) Ubica la línea de suscripción recién agregada y su precio base.
  const { data: cartRows } = await query.graph({
    entity: "cart",
    fields: ["id", "items.id", "items.variant_id", "items.product_id", "items.unit_price", "items.metadata"],
    filters: { id: cartId },
  });
  const items = (cartRows?.[0]?.items ?? []) as CartLine[];
  const line = items.find((i) => i.variant_id === variant_id && i.metadata?.is_subscription);
  if (!line) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "No se pudo ubicar la línea de suscripción recién creada.",
    );
  }

  // 3) Descuento del producto (metadata) — fuente única, autoritativa en el backend.
  const { data: productRows } = await query.graph({
    entity: "product",
    fields: ["id", "metadata"],
    filters: { id: line.product_id },
  });
  const pct = metaNumber(
    (productRows?.[0]?.metadata as Record<string, unknown> | null)?.subscription_discount_percentage,
  );

  // 4) Fija el precio suscrito como precio CUSTOM de la línea (cobrado desde la 1ra
  //    compra; is_custom_price evita que el recálculo del carrito lo revierta).
  if (pct > 0) {
    const discounted = roundCLP((line.unit_price ?? 0) * (1 - pct / 100));
    if (discounted > 0 && discounted !== line.unit_price) {
      await updateLineItemInCartWorkflow(req.scope).run({
        input: { cart_id: cartId, item_id: line.id, update: { unit_price: discounted } },
      });
    }
  }

  res.json({ cart: { id: cartId } });
}
