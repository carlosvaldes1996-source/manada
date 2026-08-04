/**
 * Email · No pudimos cobrar — evento de dominio `subscription.payment_failed` (D59).
 *
 * Se envía cuando falla un cobro de renovación y la suscripción pasa a `past_due`
 * (aún con reintentos por delante). Claro y accionable: pide actualizar la tarjeta,
 * sin alarmismo. No promete nada automático más allá del reintento honesto.
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, Button } from "./base"
import { storefrontUrl } from "./theme"

export type SubscriptionPaymentFailedData = {
  first_name?: string | null
  pet_name?: string | null
  product_title: string
  card_last4?: string | null
}

export const subject = (_data: SubscriptionPaymentFailedData) =>
  "No pudimos renovar tu Plan Manada"

export default function SubscriptionPaymentFailedEmail(data: SubscriptionPaymentFailedData) {
  const name = data.first_name?.trim()
  const who = data.pet_name?.trim()
  return (
    <EmailLayout preview={`Revisa tu medio de pago para no interrumpir el plan de ${who || "tu compañero"}.`}>
      <Title>{name ? `Necesitamos tu ayuda, ${name}` : "Necesitamos tu ayuda"}</Title>
      <Paragraph>
        Intentamos renovar tu plan de <strong>{data.product_title}</strong>
        {data.card_last4 ? ` con tu tarjeta ····${data.card_last4}` : ""}, pero el cobro no se pudo
        completar. Puede pasar: una tarjeta vencida, sin cupo o un rechazo del banco.
      </Paragraph>
      <Paragraph>
        Actualiza tu medio de pago y retomamos la entrega{who ? ` de ${who}` : ""} sin que pierdas
        tu precio de suscripción. Lo reintentaremos un par de veces antes de dar de baja el plan.
      </Paragraph>
      <Button href={`${storefrontUrl}/cuenta`}>Actualizar mi tarjeta</Button>
      <Paragraph muted>Mientras tanto, tu plan queda en pausa para no dejar sin stock a nadie.</Paragraph>
    </EmailLayout>
  )
}
