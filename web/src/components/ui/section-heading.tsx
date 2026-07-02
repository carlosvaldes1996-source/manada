import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Eyebrow en mayúsculas (categoría/contexto). */
  overline?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Enlace "ver todo" alineado a la derecha. */
  href?: string;
  linkLabel?: string;
  as?: "h2" | "h3";
}

/**
 * Encabezado de sección reutilizable: overline + título (Fraunces) + enlace
 * opcional "ver todo". Estandariza el ritmo de las cabeceras de Home/PLP/PDP.
 */
export function SectionHeading({
  overline,
  title,
  description,
  href,
  linkLabel = "Ver todo",
  as: Tag = "h2",
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)} {...props}>
      <div className="flex flex-col gap-1">
        {overline && <span className="overline text-text-brand">{overline}</span>}
        <Tag className={cn(Tag === "h2" ? "heading-2" : "heading-3", "text-text-primary")}>
          {title}
        </Tag>
        {description && <p className="body-m text-text-secondary">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-text-brand underline-offset-4 hover:underline"
        >
          {linkLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
