/**
 * Email · Pedido enviado — se dispara con `shipment.created`.
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, Panel, Button, DataRow } from "./base"
import { storefrontUrl } from "./theme"
import type { OrderAddress } from "./order-placed"

export type OrderShippedData = {
  display_id: number | string
  first_name?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
  shipping_address?: OrderAddress
}

export const subject = (data: OrderShippedData) =>
  `Tu pedido #${data.display_id} va en camino 🚚`

export default function OrderShippedEmail(data: OrderShippedData) {
  const name = data.first_name?.trim()
  const addr = data.shipping_address
  const addressLine = addr
    ? [addr.address_1, addr.city, addr.province].filter(Boolean).join(", ")
    : null
  const cta = data.tracking_url || `${storefrontUrl}/cuenta`

  return (
    <EmailLayout preview={`Tu pedido #${data.display_id} de Manada ya fue despachado.`}>
      <Title>¡Tu pedido va en camino{name ? `, ${name}` : ""}!</Title>
      <Paragraph>
        Buenas noticias: tu pedido <strong>#{data.display_id}</strong> ya salió
        de bodega rumbo a tu casa. 🐾
      </Paragraph>

      {data.tracking_number && (
        <Panel>
          <DataRow label="N.º de seguimiento" value={data.tracking_number} strong />
        </Panel>
      )}

      {addressLine && (
        <Paragraph muted>
          <strong>Envío a:</strong> {addressLine}
        </Paragraph>
      )}

      <Button href={cta}>
        {data.tracking_url ? "Seguir mi envío" : "Ver mi pedido"}
      </Button>
    </EmailLayout>
  )
}
