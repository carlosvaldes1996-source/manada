/**
 * Email · Envío saltado — evento de dominio `subscription.skipped` (D57·R5).
 * Confirma la nueva fecha del próximo envío; el plan sigue igual.
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, Button } from "./base"
import { formatDate, storefrontUrl } from "./theme"

export type SubscriptionSkippedData = {
  first_name?: string | null
  product_title: string
  next_delivery_date?: string | null
}

export const subject = (_data: SubscriptionSkippedData) => "Movimos tu próximo envío"

export default function SubscriptionSkippedEmail(data: SubscriptionSkippedData) {
  const name = data.first_name?.trim()
  return (
    <EmailLayout preview={`Movimos tu próximo envío de ${data.product_title}.`}>
      <Title>Saltamos tu próximo envío{name ? `, ${name}` : ""}</Title>
      <Paragraph>
        {data.next_delivery_date
          ? <>Movimos el próximo envío de {data.product_title} al <strong>{formatDate(data.next_delivery_date)}</strong>.</>
          : <>Saltamos el próximo envío de {data.product_title}.</>}
      </Paragraph>
      <Paragraph muted>
        Tu plan sigue activo; el resto queda igual. Puedes ajustarlo cuando quieras desde tu cuenta.
      </Paragraph>
      <Button href={`${storefrontUrl}/cuenta`}>Ver mi plan</Button>
    </EmailLayout>
  )
}
