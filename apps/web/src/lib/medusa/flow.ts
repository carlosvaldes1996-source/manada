import { medusa } from "./client";

/**
 * Pago con Flow (D58) — capa delgada sobre la ruta propia del backend
 * (`POST /store/carts/:id/flow-payment`, API.md §14).
 *
 * Devuelve la URL del checkout de Flow a la que redirigir. La orden NO se crea
 * aquí: nace cuando Flow confirma el pago (webhook `urlConfirmation` +
 * `payment/getStatus`). El monto lo calcula el backend (total del carrito): el
 * front nunca envía importes ni ve las llaves de Flow.
 */
export async function createFlowPayment(cartId: string): Promise<{ url: string }> {
  const res = await medusa.client.fetch<{ url: string }>(
    `/store/carts/${cartId}/flow-payment`,
    { method: "POST", body: {} },
  );
  if (!res?.url) throw new Error("No se pudo iniciar el pago con Flow.");
  return { url: res.url };
}
