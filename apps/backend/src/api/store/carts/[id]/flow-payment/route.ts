import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import {
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
  refreshPaymentCollectionForCartWorkflow,
} from "@medusajs/core-flows";
import { FLOW_PAYMENT_MODULE } from "../../../../../modules/flow-payment";
import type FlowPaymentModuleService from "../../../../../modules/flow-payment/service";
import { createFlowPayment, getFlowConfig } from "../../../../../lib/flow";

/**
 * `POST /store/carts/:id/flow-payment` (API.md §14, D58) — crea la orden de pago
 * en Flow para el carrito y devuelve la URL a la que redirigir al checkout de Flow.
 *
 * NO completa el carrito ni crea la orden: eso ocurre recién cuando Flow confirma
 * el pago (webhook `urlConfirmation` → `settleFlowPayment`). Aquí solo:
 *  1) Asegura payment collection + sesión del proveedor interno `pp_system_default`
 *     (vehículo de Medusa para poder completar el carrito luego; Flow es la pasarela real).
 *  2) Crea el pago en Flow (`payment/create`, firmado) por el TOTAL del carrito
 *     (server-side, autoritativo — nunca se confía en un monto del cliente).
 *  3) Persiste el registro `flow_payment` (eje de la idempotencia).
 *
 * Guest checkout permitido (sin auth de cliente), igual que la ruta core de
 * line-items; la publishable key la impone el middleware global de `/store`.
 */

/** Proveedor interno de Medusa para materializar la orden (no visible al usuario). */
const INTERNAL_PAYMENT_PROVIDER = "pp_system_default";

/**
 * Ventana para REUSAR un intento `pending`: solo si es reciente. Evita devolver
 * una URL de Flow ya expirada (que dejaría al usuario atrapado en un loop de
 * reintentos sobre la misma orden muerta). Pasada la ventana, se crea una nueva.
 */
const REUSE_WINDOW_MS = 55 * 60 * 1000;

type CartGraph = {
  id: string;
  email?: string | null;
  currency_code?: string | null;
  completed_at?: string | null;
  total?: number | null;
  metadata?: Record<string, unknown> | null;
  items?: { id: string }[];
  payment_collection?: { id: string } | null;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const flowService = req.scope.resolve<FlowPaymentModuleService>(FLOW_PAYMENT_MODULE);
  const config = getFlowConfig(); // lanza claro si faltan las llaves de Flow

  // IMPORTANTE: Medusa calcula `total` a partir de las relaciones CARGADAS (ver
  // `cartFieldsForRefreshSteps` de core-flows). Si solo se pide `items.id`, el
  // subtotal de productos sale 0 y `total` queda = solo el envío. Por eso cargamos
  // el precio de las líneas + métodos de envío + ajustes (promos, ej. envío gratis)
  // para que `total` sea el REAL que se cobrará (= el total de la orden).
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "currency_code",
      "completed_at",
      "total",
      "metadata",
      "items.*",
      "items.adjustments.*",
      "items.tax_lines.*",
      "shipping_methods.*",
      "shipping_methods.adjustments.*",
      "shipping_methods.tax_lines.*",
      "payment_collection.id",
    ],
    filters: { id: cartId },
  });
  const cart = carts?.[0] as CartGraph | undefined;

  if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Carrito no encontrado.");
  if (cart.completed_at) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Este carrito ya fue completado.");
  }
  if (!cart.items || cart.items.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "El carrito está vacío.");
  }
  if (!cart.email) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Falta el correo del comprador.");
  }

  const amount = Math.round(Number(cart.total ?? 0));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "El total del carrito no es válido.");
  }

  // Reuso: si ya hay un intento PENDING RECIENTE del mismo carrito y monto, reusamos
  // su URL (evita crear una segunda orden en Flow y un posible doble cobro al
  // reintentar). Solo dentro de la ventana de frescura (URL de Flow aún válida).
  const now = Date.now();
  const pending = await flowService.listFlowPayments({ cart_id: cartId, status: "pending" });
  const reusable = pending.find((p) => {
    const createdAt = (p as { created_at?: string | Date }).created_at;
    const ageOk = createdAt ? now - new Date(createdAt).getTime() < REUSE_WINDOW_MS : false;
    return p.amount === amount && Boolean(p.redirect_url) && ageOk;
  });
  if (reusable?.redirect_url) {
    res.json({ url: reusable.redirect_url });
    return;
  }

  // (1) Asegura payment collection con el monto ACTUAL del carrito + una sesión del
  //     proveedor interno. Si la colección viene de un intento previo, la
  //     refrescamos (sincroniza el monto al total actual y borra sesiones obsoletas)
  //     por si el carrito cambió entremedio — así el pago autorizado nunca queda por
  //     un monto viejo. `createPaymentSessionsWorkflow` borra cualquier sesión previa
  //     (no soporta pagos divididos) y crea una nueva con el monto ya sincronizado.
  let paymentCollectionId = cart.payment_collection?.id;
  if (!paymentCollectionId) {
    const { result } = await createPaymentCollectionForCartWorkflow(req.scope).run({
      input: { cart_id: cartId },
    });
    paymentCollectionId = result.id;
  } else {
    await refreshPaymentCollectionForCartWorkflow(req.scope).run({ input: { cart_id: cartId } });
  }
  await createPaymentSessionsWorkflow(req.scope).run({
    input: { payment_collection_id: paymentCollectionId, provider_id: INTERNAL_PAYMENT_PROVIDER },
  });

  // (2) Crea el pago en Flow. `commerceOrder` único (cola del carrito + ms + sufijo
  //     aleatorio) para que dos clicks casi simultáneos no colisionen en Flow. Flow
  //     LIMITA `commerceOrder` a 45 caracteres: usamos solo la cola del id del
  //     carrito (parte más distintiva, para trazabilidad) y clampeamos por seguridad.
  //     La conciliación real es por `token`/registro `flow_payment`, no por este string.
  const rand = Math.random().toString(36).slice(2, 6);
  const cartTail = cartId.replace(/^cart_/, "").slice(-8);
  const commerceOrder = `MANADA-${cartTail}-${Date.now().toString(36)}${rand}`.slice(0, 45);
  const backendUrl = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "");
  const rut = typeof cart.metadata?.rut === "string" ? (cart.metadata.rut as string) : undefined;

  const flow = await createFlowPayment(
    {
      commerceOrder,
      subject: "Compra en Manada",
      amount,
      email: cart.email,
      urlConfirmation: `${backendUrl}/flow/confirmation`,
      urlReturn: `${backendUrl}/flow/return`,
      currency: "CLP",
      paymentMethod: 9, // el usuario elige el medio en el checkout de Flow
      optional: rut ? { rut } : undefined,
    },
    config,
  );

  // (3) Persiste el intento (eje de la idempotencia; el settle lo busca por token).
  await flowService.createFlowPayments({
    cart_id: cartId,
    commerce_order: commerceOrder,
    token: flow.token,
    flow_order: flow.flowOrder ? String(flow.flowOrder) : null,
    redirect_url: flow.redirectUrl,
    amount,
    currency_code: (cart.currency_code ?? "clp").toLowerCase(),
    status: "pending",
    payment_collection_id: paymentCollectionId,
  });

  res.json({ url: flow.redirectUrl });
}
