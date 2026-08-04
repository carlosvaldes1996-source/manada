/**
 * Email · Dimos de baja tu plan — evento de dominio `subscription.ended_unpaid` (D59).
 *
 * Terminal del dunning: tras agotar los reintentos, la suscripción pasa a `unpaid`.
 * Tono amable, sin culpa: el plan quedó en pausa definitiva pero puede reactivarlo
 * cuando quiera (con su precio de suscripción intacto mientras el producto exista).
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, Button } from "./base"
import { storefrontUrl } from "./theme"

export type SubscriptionEndedUnpaidData = {
  first_name?: string | null
  pet_name?: string | null
  product_title: string
}

export const subject = (_data: SubscriptionEndedUnpaidData) => "Dimos de baja tu Plan Manada"

export default function SubscriptionEndedUnpaidEmail(data: SubscriptionEndedUnpaidData) {
  const name = data.first_name?.trim()
  const who = data.pet_name?.trim()
  return (
    <EmailLayout preview={`Tu Plan Manada de ${data.product_title} quedó dado de baja.`}>
      <Title>{name ? `Dimos de baja tu plan, ${name}` : "Dimos de baja tu plan"}</Title>
      <Paragraph>
        Después de varios intentos no logramos renovar tu plan de{" "}
        <strong>{data.product_title}</strong>, así que lo dimos de baja para no seguir intentando
        cobros. No te preocupes: no perdiste nada.
      </Paragraph>
      <Paragraph>
        Cuando quieras retomarlo{who ? ` para ${who}` : ""}, puedes volver a activarlo en un par de
        pasos. Aquí seguimos para cuidar a quien más quieres.
      </Paragraph>
      <Button href={`${storefrontUrl}/cuenta`}>Reactivar mi plan</Button>
    </EmailLayout>
  )
}
