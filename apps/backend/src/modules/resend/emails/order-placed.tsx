/**
 * Email · Compra realizada — se dispara con `order.placed`.
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, DataRow, Divider, Button } from "./base"
import { formatCLP, storefrontUrl } from "./theme"

export type OrderItem = {
  title: string
  quantity: number
  total?: number | null
}

export type OrderAddress = {
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  city?: string | null
  province?: string | null
} | null

export type OrderPlacedData = {
  display_id: number | string
  first_name?: string | null
  items: OrderItem[]
  total: number
  shipping_total?: number | null
  shipping_address?: OrderAddress
}

export const subject = (data: OrderPlacedData) =>
  `Recibimos tu pedido #${data.display_id} 🐾`

export default function OrderPlacedEmail(data: OrderPlacedData) {
  const name = data.first_name?.trim()
  const items = data.items ?? []
  const addr = data.shipping_address
  const addressLine = addr
    ? [addr.address_1, addr.city, addr.province].filter(Boolean).join(", ")
    : null

  return (
    <EmailLayout preview={`Confirmamos tu pedido #${data.display_id} en Manada.`}>
      <Title>¡Gracias por tu compra{name ? `, ${name}` : ""}!</Title>
      <Paragraph>
        Recibimos tu pedido <strong>#{data.display_id}</strong> y ya lo estamos
        preparando con cariño. Te avisaremos apenas vaya en camino.
      </Paragraph>

      <Divider />

      {items.map((item, i) => (
        <DataRow
          key={i}
          label={`${item.title}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`}
          value={formatCLP(item.total ?? 0)}
        />
      ))}

      {typeof data.shipping_total === "number" && (
        <DataRow label="Envío" value={data.shipping_total > 0 ? formatCLP(data.shipping_total) : "Gratis"} />
      )}

      <Divider />
      <DataRow label="Total" value={formatCLP(data.total)} strong />

      {addressLine && (
        <>
          <Divider />
          <Paragraph muted>
            <strong>Envío a:</strong> {addressLine}
          </Paragraph>
        </>
      )}

      <Button href={`${storefrontUrl}/cuenta`}>Ver mi pedido</Button>
    </EmailLayout>
  )
}
