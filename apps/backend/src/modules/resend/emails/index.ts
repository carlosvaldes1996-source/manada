/**
 * Registro central de plantillas de email.
 *
 * FUENTE ÚNICA de la relación `id de plantilla → asunto + componente`. Los
 * subscribers referencian `EmailTemplate.*` (sin strings mágicos) y el provider
 * Resend resuelve todo desde aquí. Para agregar un email nuevo: crear su `.tsx`
 * y añadir una entrada acá. Nada más.
 */
import * as React from "react"
import WelcomeEmail, { subject as welcomeSubject } from "./welcome"
import ResetPasswordEmail, { subject as resetSubject } from "./reset-password"
import OrderPlacedEmail, { subject as orderPlacedSubject } from "./order-placed"
import OrderShippedEmail, { subject as orderShippedSubject } from "./order-shipped"

/** IDs estables de plantilla (contrato entre subscribers y provider). */
export const EmailTemplate = {
  Welcome: "welcome",
  ResetPassword: "reset-password",
  OrderPlaced: "order-placed",
  OrderShipped: "order-shipped",
} as const

export type EmailTemplateId = (typeof EmailTemplate)[keyof typeof EmailTemplate]

type TemplateEntry = {
  subject: (data: any) => string
  render: (data: any) => React.ReactElement
}

export const emailTemplates: Record<EmailTemplateId, TemplateEntry> = {
  [EmailTemplate.Welcome]: {
    subject: welcomeSubject,
    render: (data) => React.createElement(WelcomeEmail, data),
  },
  [EmailTemplate.ResetPassword]: {
    subject: resetSubject,
    render: (data) => React.createElement(ResetPasswordEmail, data),
  },
  [EmailTemplate.OrderPlaced]: {
    subject: orderPlacedSubject,
    render: (data) => React.createElement(OrderPlacedEmail, data),
  },
  [EmailTemplate.OrderShipped]: {
    subject: orderShippedSubject,
    render: (data) => React.createElement(OrderShippedEmail, data),
  },
}
