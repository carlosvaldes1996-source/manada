import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { registerFlowCard, getFlowConfig, flowErrorMessage } from "../../../../../lib/flow";
import { ensureFlowCustomer } from "../../../../../lib/flow-customer";

/**
 * `POST /store/carts/:id/subscription-payment` (API.md §14, D59) — inicia la 1ª
 * compra de una SUSCRIPCIÓN: tokeniza la tarjeta del cliente en Flow y devuelve la
 * URL a la que redirigir para ingresarla.
 *
 * A diferencia del pago único (`/store/carts/:id/flow-payment`, redirección que solo
 * cobra), aquí se REGISTRA la tarjeta (Modelo A) para poder cobrar las renovaciones
 * server-to-server. Por eso REQUIERE cuenta (no se puede tokenizar a un invitado):
 * la auth de cliente se impone en `src/api/middlewares.ts`.
 *
 * No cobra ni crea la orden aquí: eso ocurre en `/flow/register-return` cuando Flow
 * devuelve el navegador con el token del registro (→ `settleSubscriptionRegistration`).
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  getFlowConfig(); // lanza claro si faltan las llaves de Flow

  // Cliente autenticado (dueño de la tarjeta y de la futura suscripción).
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name"],
    filters: { id: req.auth_context.actor_id },
  });
  if (!customer?.email) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Necesitas una cuenta para suscribirte.");
  }

  // Carrito con al menos una línea de suscripción.
  const {
    data: [cart],
  } = await query.graph({
    entity: "cart",
    fields: ["id", "completed_at", "items.id", "items.metadata"],
    filters: { id: cartId },
  });
  if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Carrito no encontrado.");
  if (cart.completed_at) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Este carrito ya fue completado.");
  }
  const items = (cart.items ?? []) as { id: string; metadata?: Record<string, unknown> | null }[];
  const hasSubscription = items.some((it) => it.metadata?.is_subscription);
  if (!hasSubscription) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "El carrito no tiene una línea de suscripción. Usa el pago único.",
    );
  }

  // Reusa el cliente Flow del cliente (o lo crea) y registra la tarjeta. Igual que en
  // el pago único: un rechazo de Flow (correo inválido, etc.) se traduce a un mensaje
  // accionable en vez de un 500 opaco; el detalle técnico queda en los logs.
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();
  const backendUrl = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "");

  let redirectUrl: string;
  try {
    const flowCustomerId = await ensureFlowCustomer(req.scope, {
      customerId: customer.id,
      name,
      email: customer.email,
    });
    ({ redirectUrl } = await registerFlowCard(
      { customerId: flowCustomerId, urlReturn: `${backendUrl}/flow/register-return?cart=${cartId}` },
      getFlowConfig(),
    ));
  } catch (e) {
    console.error(`[flow] No se pudo iniciar la suscripción del carrito ${cartId}:`, e);
    throw new MedusaError(MedusaError.Types.INVALID_DATA, flowErrorMessage(e));
  }

  res.json({ url: redirectUrl });
}
