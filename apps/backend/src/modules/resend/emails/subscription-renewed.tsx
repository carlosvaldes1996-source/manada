/**
 * Email · Renovación del Plan Manada — evento de dominio `subscription.renewed` (D59).
 *
 * Transaccional y honesto: el cliente FUE cobrado automáticamente, así que este
 * correo explica el porqué (no un genérico "gracias por tu compra") y reemplaza al
 * `order-placed` para las órdenes de renovación (guard en `order-placed-email.ts`).
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, Panel, DataRow, Button } from "./base"
import { formatCLP, formatDate, storefrontUrl } from "./theme"

export type SubscriptionRenewedData = {
  first_name?: string | null
  pet_name?: string | null
  product_title: string
  amount?: number | null
  card_last4?: string | null
  next_delivery_date?: string | null
}

export const subject = (_data: SubscriptionRenewedData) => "Renovamos tu Plan Manada 🐾"

export default function SubscriptionRenewedEmail(data: SubscriptionRenewedData) {
  const name = data.first_name?.trim()
  const who = data.pet_name?.trim()
  return (
    <EmailLayout preview={`Preparamos una nueva entrega de ${data.product_title}.`}>
      <Title>{name ? `Renovamos tu plan, ${name}` : "Renovamos tu plan"}</Title>
      <Paragraph>
        Como parte de tu Plan Manada, preparamos una nueva entrega de{" "}
        <strong>{data.product_title}</strong>
        {who ? ` para ${who}` : ""}. Tu pedido ya está en camino 🚚
      </Paragraph>

      <Panel>
        <DataRow label="Producto" value={data.product_title} />
        {typeof data.amount === "number" && (
          <DataRow
            label={data.card_last4 ? `Cobrado a tu tarjeta ····${data.card_last4}` : "Cobrado"}
            value={formatCLP(data.amount)}
          />
        )}
        {data.next_delivery_date && (
          <DataRow label="Próxima entrega estimada" value={formatDate(data.next_delivery_date)} />
        )}
      </Panel>

      <Paragraph muted>
        ¿Necesitas cambiar la frecuencia, saltar un envío o pausar tu plan? Lo gestionas cuando
        quieras desde tu cuenta, sin costo.
      </Paragraph>

      <Button href={`${storefrontUrl}/cuenta`}>Ver mi plan</Button>
    </EmailLayout>
  )
}
