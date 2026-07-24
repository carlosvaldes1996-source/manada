/**
 * Email · Plan cancelado — evento de dominio `subscription.cancelled` (D57·R5).
 * Cálido y sin culpa: confirma la cancelación y deja la puerta abierta.
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, Button } from "./base"
import { storefrontUrl } from "./theme"

export type SubscriptionCancelledData = {
  first_name?: string | null
  product_title: string
}

export const subject = (_data: SubscriptionCancelledData) => "Cancelamos tu Plan Manada"

export default function SubscriptionCancelledEmail(data: SubscriptionCancelledData) {
  const name = data.first_name?.trim()
  return (
    <EmailLayout preview={`Cancelamos tu Plan Manada para ${data.product_title}.`}>
      <Title>Cancelamos tu plan{name ? `, ${name}` : ""}</Title>
      <Paragraph>
        Listo: cancelamos tu plan de {data.product_title}. No se generarán más envíos.
      </Paragraph>
      <Paragraph muted>
        Gracias por confiar en Manada para cuidar a quien más quieres. Cuando quieras, volver a
        suscribirte toma un momento.
      </Paragraph>
      <Button href={storefrontUrl}>Volver a la tienda</Button>
    </EmailLayout>
  )
}
