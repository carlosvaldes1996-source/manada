import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { AppProviders } from "@/components/providers";
import {
  GoogleTagManager,
  GoogleTagManagerNoScript,
} from "@/components/analytics/google-tag-manager";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationLd, websiteLd } from "@/lib/structured-data";
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
  // OJO: NO se declara `alternates.canonical` aquí. En el App Router el canonical
  // se HEREDA a las páginas hijas; si el layout raíz lo fija a "/", cada página sin
  // canonical propio (nosotros, ayuda, …) se auto-declara duplicado de la home y no
  // se indexa. Cada página indexable declara SU canonical (home incluida). (D48)
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  // Deja indexar el sitio; las páginas privadas/transaccionales se excluyen en
  // `robots.ts` (crawl) y con `robots: { index: false }` puntual donde importa.
  robots: { index: true, follow: true },
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
        <JsonLd data={[organizationLd(), websiteLd()]} />
        <GoogleTagManagerNoScript />
        <AppProviders>{children}</AppProviders>
        <GoogleTagManager />
      </body>
    </html>
  );
}
