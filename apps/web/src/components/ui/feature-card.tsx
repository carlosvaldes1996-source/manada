import { cn } from "@/lib/utils";

const tiles = {
  brand: "bg-brand-soft text-text-brand",
  accent: "bg-accent-soft text-miel-700",
  pino: "bg-pino-50 text-pino-700",
} as const;

export interface FeatureCardProps {
  icon?: React.ReactNode;
  /** Eyebrow opcional (ej. "Paso 1"). */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Color del tile del ícono (qué pilar de marca refuerza). */
  tone?: keyof typeof tiles;
  className?: string;
}

/**
 * Tarjeta de propuesta de valor: tile de ícono + título (Fraunces) + texto.
 * Para "cómo funciona", diferenciadores de confianza y próximos pasos.
 * Presentacional (sin lógica) — el contenido lo pasa la pantalla.
 */
export function FeatureCard({ icon, eyebrow, title, description, tone = "brand", className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface p-5",
        className,
      )}
    >
      {icon && (
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)]", tiles[tone])} aria-hidden>
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-1">
        {eyebrow}
        <h3 className="heading-4 text-text-primary">{title}</h3>
        {description && <p className="body-s text-text-secondary">{description}</p>}
      </div>
    </div>
  );
}
