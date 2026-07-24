/**
 * Email · Plan Manada activo — evento de dominio `subscription.created` (D57·R5).
 *
 * NO repite la compra (de eso se encarga `order-placed`): su foco es explicar
 * cómo funciona el Plan Manada y cómo gestionarlo. Honesto: aún no hay cobro ni
 * despacho automático (no existe scheduler — D55).
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, Panel, DataRow, Button } from "./base"
import { formatCLP, formatDate, frequencyLabel, storefrontUrl } from "./theme"

export type SubscriptionCreatedData = {
  first_name?: string | null
  pet_name?: string | null
  product_title: string
  frequency_weeks: number
  next_delivery_date?: string | null
  agreed_unit_price?: number | null
}

export const subject = (_data: SubscriptionCreatedData) => "Tu Plan Manada está activo 🐾"

export default function SubscriptionCreatedEmail(data: SubscriptionCreatedData) {
  const name = data.first_name?.trim()
  const who = data.pet_name?.trim() || "tu compañero"
  return (
    <EmailLayout preview={`Tu Plan Manada para ${data.product_title} quedó activo.`}>
      <Title>{name ? `¡Tu Plan Manada está activo, ${name}!` : "¡Tu Plan Manada está activo!"}</Title>
      <Paragraph>
        Desde ahora cuidamos que a {who} no le falte su {data.product_title}. Tu plan queda
        guardado con tu precio de suscripción y tú tienes el control.
      </Paragraph>

      <Panel>
        <DataRow label="Producto" value={data.product_title} />
        <DataRow label="Frecuencia" value={frequencyLabel(data.frequency_weeks)} />
        {typeof data.agreed_unit_price === "number" && (
          <DataRow label="Precio por entrega" value={formatCLP(data.agreed_unit_price)} />
        )}
        {data.next_delivery_date && (
          <DataRow label="Próxima entrega estimada" value={formatDate(data.next_delivery_date)} />
        )}
      </Panel>

      <Paragraph>
        Desde tu cuenta puedes <strong>cambiar la frecuencia</strong>, <strong>saltar un envío</strong>,{" "}
        <strong>pausar</strong> o <strong>cancelar</strong> tu plan cuando quieras, sin costo.
      </Paragraph>

      <Button href={`${storefrontUrl}/cuenta`}>Gestionar mi plan</Button>

      <Paragraph muted>
        Todavía no hacemos cobros automáticos: cada entrega la confirmas tú, sin sorpresas.
      </Paragraph>
    </EmailLayout>
  )
}
