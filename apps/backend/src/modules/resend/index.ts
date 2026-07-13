import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import ResendNotificationProviderService from "./service"

/**
 * Provider de notificaciones Resend para Manada.
 *
 * Se registra en el Notification Module (ver `medusa-config.ts`). Expone el
 * servicio que renderiza y envía las plantillas de `./emails`.
 */
export default ModuleProvider(Modules.NOTIFICATION, {
  services: [ResendNotificationProviderService],
})

export { EmailTemplate } from "./emails"
