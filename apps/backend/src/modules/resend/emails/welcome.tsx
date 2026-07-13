/**
 * Email · Bienvenida — se dispara con `customer.created` (solo cuentas reales).
 */
import * as React from "react"
import { EmailLayout, Title, Paragraph, Button } from "./base"
import { storefrontUrl } from "./theme"

export type WelcomeData = {
  first_name?: string | null
}

export const subject = (data: WelcomeData) =>
  data.first_name
    ? `Te damos la bienvenida a Manada, ${data.first_name} 🐾`
    : "Te damos la bienvenida a Manada 🐾"

export default function WelcomeEmail(data: WelcomeData) {
  const name = data.first_name?.trim()
  return (
    <EmailLayout preview="Bienvenido a Manada: conocemos a tu mascota como nadie.">
      <Title>{name ? `¡Hola, ${name}!` : "¡Hola!"}</Title>
      <Paragraph>
        Qué bueno tenerte en la manada. Manada no es una tienda más: conocemos a
        tu mascota como nadie y nos anticipamos a lo que necesita para que nunca
        le falte nada.
      </Paragraph>
      <Paragraph>
        El primer paso es contarnos sobre tu regalón. Con su perfil te armamos
        un plan a su medida y te avisamos justo cuando se le va a acabar la
        comida.
      </Paragraph>
      <Button href={`${storefrontUrl}/comenzar`}>Armar el perfil de mi mascota</Button>
      <Paragraph muted>
        ¿Prefieres mirar primero? Explora el catálogo en{" "}
        {storefrontUrl.replace(/^https?:\/\//, "")}.
      </Paragraph>
    </EmailLayout>
  )
}
