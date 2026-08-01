import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { EmailTemplate } from "../modules/resend";

/**
 * Recuperación de contraseña — entrega del token de reset (Fase 5 · Etapa A).
 *
 * Cuando el storefront llama `auth.resetPassword("customer", "emailpass", …)`,
 * Medusa emite el evento `auth.password_reset` con un token de un solo uso. Este
 * subscriber (capacidad NATIVA de Medusa) es el responsable de **entregar** ese
 * token al cliente.
 *
 * D45: la entrega ahora es el email transaccional real (Notification Module +
 * provider Resend). En dev sin `RESEND_API_KEY`, el provider loguea el correo
 * (incluido el enlace) en vez de enviarlo — mismo DX que antes, sin tocar el
 * frontend: el contrato (`/recuperar` → evento → `/recuperar/nueva?token=…`)
 * queda intacto.
 */
export default async function passwordResetHandler({
  event,
  container,
}: SubscriberArgs<{
  entity_id: string;
  token: string;
  actor_type: string;
  metadata?: Record<string, unknown> | null;
}>) {
  const { entity_id: email, token, actor_type, metadata } = event.data;

  // Solo clientes del storefront (ignora usuarios del Admin).
  if (actor_type !== "customer") return;

  const storefront = process.env.STOREFRONT_URL || "http://localhost:3000";
  const url = `${storefront}/recuperar/nueva?token=${token}&email=${encodeURIComponent(email)}`;

  // Mismo token de un solo uso, dos marcos: si viene de la auto-provisión de cuenta
  // (obj 4, `metadata.activation`) el correo es "Define tu contraseña"; si no, es el
  // reset de siempre. La ruta por defecto queda idéntica.
  const isActivation = Boolean(metadata?.activation);

  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  await notificationModuleService.createNotifications({
    to: email,
    channel: "email",
    template: isActivation ? EmailTemplate.AccountActivation : EmailTemplate.ResetPassword,
    data: { url, email, first_name: (metadata?.first_name as string | undefined) ?? undefined },
  });
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};
