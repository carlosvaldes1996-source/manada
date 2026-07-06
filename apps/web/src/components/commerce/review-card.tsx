import { BadgeCheck } from "lucide-react";
import type { Review } from "@/lib/data/catalog";
import { Rating } from "@/components/ui/rating";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface ReviewCardProps {
  review: Review;
  /**
   * - "list" (por defecto): fila con separador inferior (para la PDP).
   * - "panel": card con borde/fondo en ≥md; en móvil sigue siendo lista con separadores.
   */
  variant?: "list" | "panel";
  className?: string;
}

const DATE_FMT = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric" });

const SHELL = {
  list: "border-b border-border-default py-4 last:border-0",
  panel:
    "border-b border-border-default py-5 last:border-b-0 md:rounded-[var(--radius-lg)] md:border md:border-border-default md:bg-surface md:px-5 md:last:border-b",
} as const;

/**
 * Tarjeta de reseña para la PDP. Autor + estrellas + compra verificada + texto.
 * Si el reseñador menciona a su mascota, se trata como acento cálido (Fraunces).
 */
export function ReviewCard({ review, variant = "list", className }: ReviewCardProps) {
  return (
    <article className={cn("flex flex-col gap-2", SHELL[variant], className)}>
      <div className="flex items-center gap-3">
        <Avatar initials={review.author.charAt(0)} size="md" />
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-semibold whitespace-nowrap text-text-primary">{review.author}</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-text-muted">{DATE_FMT.format(review.date)}</span>
            {review.verified && (
              <span className="inline-flex items-center gap-1 text-[13px] font-medium text-success-strong">
                <BadgeCheck className="size-4" aria-hidden />
                Compra verificada
              </span>
            )}
          </div>
        </div>
      </div>
      <Rating value={review.rating} hideCount size="sm" />
      {review.title && <h4 className="text-[15px] font-semibold text-text-primary">{review.title}</h4>}
      <p className="text-sm text-text-secondary">
        {review.body}
        {review.petName && <span className="pet-name"> — {review.petName}</span>}
      </p>
    </article>
  );
}
