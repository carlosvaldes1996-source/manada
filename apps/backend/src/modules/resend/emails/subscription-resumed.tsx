/**
 * Email · Plan reanudado — evento de dominio `subscription.resumed` (D57·R5).
 * Mismo tono tranquilizador que el momento de éxito in-sheet (R3): "sigue en marcha".
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, Panel, DataRow, Button } from "./base"
import { formatDate, frequencyLabel, storefrontUrl } from "./theme"

export type SubscriptionResumedData = {
  first_name?: string | null
  product_title: string
  frequency_weeks: number
  next_delivery_date?: string | null
}

export const subject = (_data: SubscriptionResumedData) => "Tu Plan Manada sigue en marcha"

export default function SubscriptionResumedEmail(data: SubscriptionResumedData) {
  const name = data.first_name?.trim()
  return (
    <EmailLayout preview={`Reactivaste tu Plan Manada para ${data.product_title}.`}>
      <Title>¡Tu plan sigue en marcha{name ? `, ${name}` : ""}!</Title>
      <Paragraph>
        Reactivaste tu plan de {data.product_title}. Todo queda como lo tenías.
      </Paragraph>

      <Panel>
        <DataRow label="Frecuencia" value={frequencyLabel(data.frequency_weeks)} />
        {data.next_delivery_date && (
          <DataRow label="Próxima entrega estimada" value={formatDate(data.next_delivery_date)} />
        )}
      </Panel>

      <Paragraph muted>
        Lo gestionas cuando quieras desde tu cuenta: frecuencia, saltar un envío, pausar o cancelar.
      </Paragraph>
      <Button href={`${storefrontUrl}/cuenta`}>Ver mi plan</Button>
    </EmailLayout>
  )
}
