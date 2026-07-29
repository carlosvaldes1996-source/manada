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

/**
 * Pago de la 1ª compra de una SUSCRIPCIÓN (D59) — contrato
 * `POST /store/carts/:id/subscription-payment` (API.md §14). A diferencia del pago
 * único, TOKENIZA la tarjeta (Modelo A de Flow) para poder cobrar las renovaciones.
 * Requiere sesión (no se tokeniza a un invitado). Devuelve la URL de Flow para
 * ingresar la tarjeta; el cobro + la orden se concilian en `/flow/register-return`.
 */
export async function createSubscriptionPayment(cartId: string): Promise<{ url: string }> {
  const res = await medusa.client.fetch<{ url: string }>(
    `/store/carts/${cartId}/subscription-payment`,
    { method: "POST", body: {} },
  );
  if (!res?.url) throw new Error("No se pudo iniciar la suscripción con Flow.");
  return { url: res.url };
}
