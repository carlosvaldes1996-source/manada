/**
 * Email · Recuperar contraseña — se dispara con `auth.password_reset`.
 * El token de un solo uso llega ya resuelto como `url` desde el subscriber.
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, Button, Panel } from "./base"
import { brand } from "./theme"

export type ResetPasswordData = {
  url: string
  first_name?: string | null
}

export const subject = (_data: ResetPasswordData) => "Recupera tu contraseña de Manada"

export default function ResetPasswordEmail(data: ResetPasswordData) {
  const name = data.first_name?.trim()
  return (
    <EmailLayout preview="Restablece tu contraseña de Manada. El enlace vence pronto.">
      <Title>Recupera tu contraseña</Title>
      <Paragraph>
        {name ? `Hola, ${name}. ` : "Hola. "}
        Recibimos una solicitud para restablecer la contraseña de tu cuenta.
        Haz clic en el botón para crear una nueva.
      </Paragraph>
      <Button href={data.url}>Crear nueva contraseña</Button>
      <Panel>
        <Paragraph muted>
          Por seguridad, este enlace <strong style={{ color: brand.color.body }}>vence pronto</strong> y
          solo puede usarse una vez.
        </Paragraph>
      </Panel>
      <Paragraph muted>
        Si tú no pediste este cambio, ignora este correo: tu contraseña seguirá
        siendo la misma.
      </Paragraph>
    </EmailLayout>
  )
}
