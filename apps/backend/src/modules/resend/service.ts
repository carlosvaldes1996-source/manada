import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import { Logger, ProviderSendNotificationDTO } from "@medusajs/framework/types"
import { render } from "@react-email/render"
import { Resend } from "resend"
import { emailTemplates, EmailTemplateId } from "./emails"

type InjectedDependencies = { logger: Logger }

export type ResendOptions = {
  /** API key de Resend. Si falta, el provider entra en modo DEV (loguea, no envía). */
  api_key?: string
  /** Remitente por defecto, ej. "Manada <hola@tumanada.cl>". */
  from?: string
  /** Canales que sirve este provider (siempre ["email"]). */
  channels?: string[]
}

/**
 * Provider Resend para el Notification Module de Medusa.
 *
 * Renderiza plantillas de React Email (registro en `./emails`) y las envía por
 * Resend. Los subscribers solo llaman `createNotifications({ template, to, data })`;
 * toda la lógica de render/envío vive aquí (un solo dueño, sin duplicación).
 *
 * MVP-first (D22): sin `RESEND_API_KEY` el provider NO falla — loguea una vista
 * previa del correo (recipiente, asunto y, si aplica, el enlace). Así el flujo
 * de dev sigue como hoy (el enlace de reset se ve en consola) y producción se
 * activa solo con setear la env var, sin tocar código ni frontend.
 */
export default class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "resend"

  private readonly logger_: Logger
  private readonly options_: ResendOptions
  private readonly resend_: Resend | null

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super()
    this.logger_ = logger
    this.options_ = options
    this.resend_ = options.api_key ? new Resend(options.api_key) : null

    if (!this.resend_) {
      this.logger_.warn(
        "[resend] RESEND_API_KEY no configurada → modo DEV: los emails se loguean, no se envían.",
      )
    }
  }

  async send(notification: ProviderSendNotificationDTO) {
    if (!notification) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No se recibió información de notificación")
    }

    const template = emailTemplates[notification.template as EmailTemplateId]
    if (!template) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Plantilla de email desconocida: "${notification.template}"`,
      )
    }

    const data = (notification.data ?? {}) as Record<string, unknown>
    const subject = template.subject(data)
    const element = template.render(data)
    const from = notification.from || this.options_.from || "Manada <onboarding@resend.dev>"

    // Modo DEV — sin API key: loguear en vez de enviar.
    if (!this.resend_) {
      const preview =
        typeof data.url === "string" ? `\n  Enlace: ${data.url}` : ""
      this.logger_.info(
        `\n──────────── [email · DEV / no enviado] ────────────\n` +
          `  Plantilla: ${notification.template}\n` +
          `  Para: ${notification.to}\n` +
          `  Asunto: ${subject}${preview}\n` +
          `  (configura RESEND_API_KEY para enviar de verdad)\n` +
          `────────────────────────────────────────────────────`,
      )
      return {}
    }

    const html = await render(element)
    const text = await render(element, { plainText: true })

    const { data: sent, error } = await this.resend_.emails.send({
      from,
      to: notification.to,
      subject,
      html,
      text,
    })

    if (error) {
      this.logger_.error(`[resend] Error enviando "${notification.template}" a ${notification.to}: ${error.message}`)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, error.message)
    }

    return { id: sent?.id }
  }
}
