import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

/**
 * Recuperación de contraseña — entrega del token de reset (Fase 5 · Etapa A).
 *
 * Cuando el storefront llama `auth.resetPassword("customer", "emailpass", …)`,
 * Medusa emite el evento `auth.password_reset` con un token de un solo uso. Este
 * subscriber (capacidad NATIVA de Medusa) es el responsable de **entregar** ese
 * token al cliente.
 *
 * MVP-first (D22): la mensajería/email transaccional está diferida (sin proveedor
 * real todavía), así que aquí el token se **loguea** como enlace de recuperación
 * para poder operar y verificar el flujo en desarrollo. En producción, este mismo
 * subscriber se reemplaza por el envío del correo (Notification Module) SIN tocar
 * el frontend: el contrato (`/recuperar` → evento → `/recuperar/nueva?token=…`) ya
 * queda cerrado.
 */
export default async function passwordResetHandler({
  event,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  const { entity_id: email, token, actor_type } = event.data;

  // Solo clientes del storefront (ignora usuarios del Admin).
  if (actor_type !== "customer") return;

  const storefront = process.env.STOREFRONT_URL || "http://localhost:3000";
  const url = `${storefront}/recuperar/nueva?token=${token}&email=${encodeURIComponent(email)}`;

  console.log(
    `\n──────────── [recuperación de contraseña · DEV] ────────────\n` +
      `Cliente: ${email}\n` +
      `Enlace (válido una vez):\n${url}\n` +
      `En producción esto se envía por correo (email transaccional, diferido).\n` +
      `────────────────────────────────────────────────────────────\n`,
  );
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};
