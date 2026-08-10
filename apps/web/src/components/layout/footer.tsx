import Link from "next/link";
import { Truck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "./logo";
import { SITE } from "@/config/site";
import { coverageNote } from "@/lib/shipping-copy";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Comprar",
    links: [
      { label: "Perro", href: "/categoria/perro" },
      { label: "Gato", href: "/categoria/gato" },
      { label: "Farmacia", href: "/categoria/farmacia" },
      { label: "Suscripciones", href: "/anticipacion" },
    ],
  },
  {
    title: "Manada",
    links: [
      { label: "Nuestra historia", href: "/nosotros" },
      { label: "Cómo anticipamos", href: "/anticipacion" },
      { label: "Despacho y cobertura", href: "/despacho" },
      { label: "Ayuda", href: "/ayuda" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos", href: "/terminos" },
      { label: "Privacidad", href: "/privacidad" },
      { label: "Cambios y devoluciones", href: "/devoluciones" },
    ],
  },
];

/**
 * Pie de página de alto contraste (Pino/Carbón) — confianza y estructura.
 * Cierra cada página de tienda. No aparece en el flujo de checkout.
 */
export function Footer() {
  return (
    <footer className="mt-12 pt-2 bg-[var(--bg-inverse)] text-neutral-300">
      <Container className="grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo tone="inverse" />
          <p className="max-w-xs text-sm text-neutral-400">{SITE.messages.anticipation}.</p>
          {/* Cobertura: se dice en todas las pantallas, no solo al pagar. Enterarse
              de que no llegamos a tu región recién en el checkout es una promesa
              rota; acá es un dato que se tiene desde el principio. */}
          <Link
            href="/despacho"
            className="inline-flex items-start gap-2 text-sm text-neutral-300 transition-colors hover:text-white"
          >
            <Truck className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <span>{coverageNote()}</span>
          </Link>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h4 className="mb-3 text-sm font-semibold text-white">{col.title}</h4>
            <ul>
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block py-1 text-sm text-neutral-300 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-neutral-700">
        <Container className="flex flex-col items-center justify-between gap-2 py-4 text-[13px] text-neutral-400 sm:flex-row">
          <span>© {new Date().getFullYear()} {SITE.name} · {SITE.domain}</span>
          <span>Hecho en Chile con cariño 🐾</span>
        </Container>
      </div>
    </footer>
  );
}
