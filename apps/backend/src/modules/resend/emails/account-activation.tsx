/**
 * Email · Activa tu cuenta — se dispara con `auth.password_reset` cuando el token
 * viene marcado `metadata.activation` (auto-provisión tras una compra de invitado,
 * obj 4). Reusa el mismo token de un solo uso que el reset; solo cambia el marco:
 * aquí NO es "recuperar" sino "definir tu contraseña por primera vez".
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, Button, Panel } from "./base"
import { brand } from "./theme"

export type AccountActivationData = {
  url: string
  first_name?: string | null
}

export const subject = (_data: AccountActivationData) => "Tu cuenta Manada está lista — define tu contraseña"

export default function AccountActivationEmail(data: AccountActivationData) {
  const name = data.first_name?.trim()
  return (
    <EmailLayout preview="Creamos tu cuenta Manada con tu compra. Define tu contraseña para entrar.">
      <Title>Tu cuenta ya está lista</Title>
      <Paragraph>
        {name ? `¡Gracias por tu compra, ${name}! ` : "¡Gracias por tu compra! "}
        Creamos tu cuenta Manada con el correo de tu pedido para que tengas todo en un
        solo lugar: tus pedidos, tus datos y el perfil de tu mascota. Define tu
        contraseña para entrar cuando quieras.
      </Paragraph>
      <Button href={data.url}>Definir mi contraseña</Button>
      <Panel>
        <Paragraph muted>
          Por seguridad, este enlace <strong style={{ color: brand.color.body }}>vence pronto</strong> y
          solo puede usarse una vez. Si vence, puedes pedir uno nuevo desde “Recuperar contraseña”.
        </Paragraph>
      </Panel>
      <Paragraph muted>
        Tu compra ya quedó asociada a este correo: encontrarás el pedido en tu cuenta
        apenas ingreses.
      </Paragraph>
    </EmailLayout>
  )
}
