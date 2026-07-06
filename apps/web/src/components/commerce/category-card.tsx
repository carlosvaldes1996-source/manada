import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategoryCardProps {
  label: string;
  href: string;
  /** Ícono/emoji de la categoría (set custom a futuro, §5). */
  icon?: React.ReactNode;
  description?: string;
  /** Variante compacta (tile de Home) vs. destacada. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Acceso a una categoría (navegación por necesidad). Tile clicable con ícono,
 * etiqueta y descripción opcional. Hover eleva la sombra.
 */
export function CategoryCard({ label, href, icon, description, size = "md", className }: CategoryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-2 rounded-[var(--radius-lg)] border border-border-default bg-surface transition-[transform,box-shadow] duration-[var(--duration-standard)] hover:-translate-y-0.5 hover:shadow-md",
        size === "sm" ? "p-4" : "p-5",
        className,
      )}
    >
      {icon && (
        <span className={size === "sm" ? "text-2xl" : "text-3xl"} aria-hidden>
          {icon}
        </span>
      )}
      <span className="heading-4 text-text-primary">{label}</span>
      {description && <span className="flex-1 text-[13px] text-text-secondary">{description}</span>}
      <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold text-text-brand">
        Ver
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
