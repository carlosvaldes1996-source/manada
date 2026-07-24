/**
 * Email · Plan pausado — evento de dominio `subscription.paused` (D57·R5).
 * Factual y sin fricción: dice qué pasó e invita a reanudar cuando quiera.
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, Button } from "./base"
import { storefrontUrl } from "./theme"

export type SubscriptionPausedData = {
  first_name?: string | null
  product_title: string
}

export const subject = (_data: SubscriptionPausedData) => "Pausaste tu Plan Manada"

export default function SubscriptionPausedEmail(data: SubscriptionPausedData) {
  const name = data.first_name?.trim()
  return (
    <EmailLayout preview={`Tu Plan Manada para ${data.product_title} quedó en pausa.`}>
      <Title>Pausamos tu plan{name ? `, ${name}` : ""}</Title>
      <Paragraph>
        Tu plan de {data.product_title} quedó <strong>en pausa</strong>. No recibirás envíos hasta
        que lo reanudes.
      </Paragraph>
      <Paragraph muted>
        Cuando quieras retomarlo, está a un clic en tu cuenta — sin costo y sin perder tu precio de
        suscripción.
      </Paragraph>
      <Button href={`${storefrontUrl}/cuenta`}>Reanudar mi plan</Button>
    </EmailLayout>
  )
}
