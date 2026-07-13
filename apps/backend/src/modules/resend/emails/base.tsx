/**
 * Layout y componentes comunes de los emails de Manada.
 *
 * Regla del sistema (mandato de Carlos): TODA plantilla se arma con estas piezas
 * — no se duplica markup ni estilos. El branding (logo, colores, tono, footer)
 * vive UNA sola vez aquí; cada email solo aporta su contenido.
 *
 * Responsive por construcción: `Container` fija 600px máx. y colapsa en móvil;
 * los estilos van inline (única forma fiable en clientes de correo).
 */
import * as React from "react"
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import { brand, storefrontUrl } from "./theme"

/* ----------------------------------------------------------------------------
 * Layout base — envuelve todos los emails (header + contenido + footer).
 * -------------------------------------------------------------------------- */
export function EmailLayout({
  preview,
  children,
}: {
  /** Texto de vista previa (preheader) que muestra la bandeja antes de abrir. */
  preview: string
  children: React.ReactNode
}) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header / logo */}
          <Section style={styles.header}>
            <Link href={storefrontUrl} style={styles.wordmark}>
              <span style={{ color: brand.color.terracota }}>🐾</span> Manada
            </Link>
          </Section>

          {/* Tarjeta de contenido */}
          <Section style={styles.card}>{children}</Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Manada · Cuidamos a quien más quieres 🐾
            </Text>
            <Text style={styles.footerText}>
              <Link href={storefrontUrl} style={styles.footerLink}>
                tumanada.cl
              </Link>
              {"  ·  "}
              <Link href={`${storefrontUrl}/cuenta`} style={styles.footerLink}>
                Mi cuenta
              </Link>
            </Text>
            <Text style={styles.footerFine}>
              Recibes este correo porque tienes actividad en Manada. Si no
              reconoces esta cuenta, puedes ignorar este mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

/* ----------------------------------------------------------------------------
 * Piezas de contenido reutilizables.
 * -------------------------------------------------------------------------- */

/** Título principal del email (serif de marca). */
export function Title({ children }: { children: React.ReactNode }) {
  return <Heading style={styles.title}>{children}</Heading>
}

/** Párrafo de cuerpo. `muted` para texto secundario. */
export function Paragraph({
  children,
  muted,
}: {
  children: React.ReactNode
  muted?: boolean
}) {
  return <Text style={muted ? styles.pMuted : styles.p}>{children}</Text>
}

/** Botón CTA de marca (tabla-safe vía padding + inline-block). */
export function Button({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ textAlign: "center", margin: "28px 0 8px" }}>
      <Link href={href} style={styles.button}>
        {children}
      </Link>
    </Section>
  )
}

/** Panel suave para resaltar un dato clave (código, enlace, aviso). */
export function Panel({ children }: { children: React.ReactNode }) {
  return <Section style={styles.panel}>{children}</Section>
}

/** Fila etiqueta → valor, para totales y datos de pedido. */
export function DataRow({
  label,
  value,
  strong,
}: {
  label: string
  value: React.ReactNode
  strong?: boolean
}) {
  return (
    <Section style={styles.rowWrap}>
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <tr>
            <td style={styles.rowLabel}>{label}</td>
            <td style={strong ? styles.rowValueStrong : styles.rowValue}>{value}</td>
          </tr>
        </tbody>
      </table>
    </Section>
  )
}

/** Divisor de marca. */
export function Divider() {
  return <Hr style={styles.hr} />
}

/* ----------------------------------------------------------------------------
 * Estilos (inline).
 * -------------------------------------------------------------------------- */
const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: brand.color.canvas,
    margin: 0,
    padding: "24px 0",
    fontFamily: brand.font.body,
    WebkitTextSizeAdjust: "100%",
  },
  container: {
    maxWidth: brand.maxWidth,
    width: "100%",
    margin: "0 auto",
    padding: "0 16px",
  },
  header: {
    padding: "8px 4px 16px",
    textAlign: "center",
  },
  wordmark: {
    fontFamily: brand.font.display,
    fontSize: "26px",
    fontWeight: 600,
    color: brand.color.ink,
    textDecoration: "none",
    letterSpacing: "0.2px",
  },
  card: {
    backgroundColor: brand.color.surface,
    borderRadius: brand.radius,
    border: `1px solid ${brand.color.border}`,
    padding: "32px 28px",
  },
  title: {
    fontFamily: brand.font.display,
    fontSize: "24px",
    lineHeight: "1.25",
    fontWeight: 600,
    color: brand.color.pino,
    margin: "0 0 12px",
  },
  p: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: brand.color.body,
    margin: "0 0 16px",
  },
  pMuted: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: brand.color.muted,
    margin: "0 0 16px",
  },
  button: {
    backgroundColor: brand.color.terracota,
    color: brand.color.white,
    fontSize: "16px",
    fontWeight: 600,
    textDecoration: "none",
    padding: "14px 28px",
    borderRadius: "10px",
    display: "inline-block",
  },
  panel: {
    backgroundColor: brand.color.terracotaSoft,
    borderRadius: "10px",
    padding: "16px 18px",
    margin: "8px 0 20px",
  },
  rowWrap: {
    margin: "0",
  },
  rowLabel: {
    fontSize: "14px",
    color: brand.color.muted,
    padding: "6px 0",
    textAlign: "left",
  },
  rowValue: {
    fontSize: "14px",
    color: brand.color.body,
    padding: "6px 0",
    textAlign: "right",
  },
  rowValueStrong: {
    fontSize: "16px",
    fontWeight: 700,
    color: brand.color.ink,
    padding: "8px 0",
    textAlign: "right",
  },
  hr: {
    borderColor: brand.color.border,
    margin: "20px 0",
  },
  footer: {
    padding: "20px 8px 8px",
    textAlign: "center",
  },
  footerText: {
    fontSize: "13px",
    lineHeight: "1.5",
    color: brand.color.muted,
    margin: "0 0 4px",
  },
  footerLink: {
    color: brand.color.terracotaDark,
    textDecoration: "none",
    fontWeight: 600,
  },
  footerFine: {
    fontSize: "11px",
    lineHeight: "1.5",
    color: brand.color.muted,
    margin: "12px 0 0",
  },
}
