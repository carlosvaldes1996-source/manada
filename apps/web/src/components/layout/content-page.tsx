import { Section } from "@/components/ui/section";

export interface ContentPageProps {
  title: string;
  lead?: React.ReactNode;
  /** Fecha de última actualización (para páginas legales). */
  updated?: string;
  children: React.ReactNode;
}

/**
 * Layout de páginas de contenido (legal, marca, ayuda). Ancho de lectura
 * cómodo y jerarquía tipográfica del sistema. Reutilizable para no duplicar
 * markup en cada página estática.
 */
export function ContentPage({ title, lead, updated, children }: ContentPageProps) {
  return (
    <Section spacing="md">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="heading-1 text-text-primary">{title}</h1>
          {lead && <p className="body-l text-text-secondary">{lead}</p>}
          {updated && <p className="text-[13px] text-text-muted">Última actualización: {updated}</p>}
        </div>
        {children}
      </div>
    </Section>
  );
}

/** Bloque con subtítulo + cuerpo, para componer páginas de contenido. */
export function ProseBlock({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="heading-3 text-text-primary">{heading}</h2>
      <div className="body-m flex flex-col gap-2 text-text-secondary">{children}</div>
    </section>
  );
}
