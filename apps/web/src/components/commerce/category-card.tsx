import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryCardProps {
  label: string;
  href: string;
  /** Ícono/emoji de la categoría (fallback cuando no hay foto, §5). */
  icon?: React.ReactNode;
  /**
   * Ícono-foto de la categoría (diseño actual): se renderiza como tile con
   * `bg-cover`. Si la imagen falta, degrada al color cálido de marca sin romper.
   * Tiene prioridad sobre `icon`.
   */
  imageUrl?: string;
  description?: string;
  /** Variante compacta (tile de Home) vs. destacada. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Acceso a una categoría (navegación por necesidad). Tile clicable con ícono,
 * etiqueta y descripción opcional. Hover eleva la sombra.
 */
export function CategoryCard({ label, href, icon, imageUrl, description, size = "md", className }: CategoryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-2 rounded-[var(--radius-lg)] border border-border-default bg-surface transition-[transform,box-shadow] duration-[var(--duration-standard)] hover:-translate-y-0.5 hover:shadow-md",
        size === "sm" ? "p-4" : "p-5",
        className,
      )}
    >
      {imageUrl ? (
        <span
          className={cn(
            "block overflow-hidden rounded-[var(--radius-md)] bg-brand-soft bg-cover bg-center",
            size === "sm" ? "size-12" : "size-14",
          )}
          style={{ backgroundImage: `url('${imageUrl}')` }}
          aria-hidden
        />
      ) : icon ? (
        <span className={size === "sm" ? "text-2xl" : "text-3xl"} aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="heading-4 text-text-primary">{label}</span>
      {description && <span className="flex-1 text-[13px] text-text-secondary">{description}</span>}
      <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-text-brand">
        Ver
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
