import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { AppProviders } from "@/components/providers";
import { SITE } from "@/config/site";
import "./globals.css";

/**
 * Tipografía del design system (DESIGN_SYSTEM §4).
 * - Fraunces: serif cálido para display/emoción y el nombre de la mascota.
 *   Se carga como variable font con el eje óptico (`opsz` 9–144): los
 *   titulares usan el corte display de alto contraste y el nombre de la
 *   mascota el corte de texto (U009; valores en globals.css §4).
 * - Hanken Grotesk: sans humanista para UI, cuerpo, datos y precios.
 * Ambas variables (variable fonts) → auto-hospedadas por next/font, sin
 * peticiones a Google en runtime (privacidad + performance, sin layout shift).
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#faf6f0", // Arena
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CL"
      className={`${fraunces.variable} ${hanken.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
