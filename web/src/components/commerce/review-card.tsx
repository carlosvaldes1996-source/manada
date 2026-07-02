import { BadgeCheck } from "lucide-react";
import type { Review } from "@/lib/data/catalog";
import { Rating } from "@/components/ui/rating";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface ReviewCardProps {
  review: Review;
  className?: string;
}

const DATE_FMT = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric" });

/**
 * Tarjeta de reseña para la PDP. Autor + estrellas + compra verificada + texto.
 * Si el reseñador menciona a su mascota, se trata como acento cálido (Fraunces).
 */
export function ReviewCard({ review, className }: ReviewCardProps) {
  return (
    <article className={cn("flex flex-col gap-2 border-b border-border-default py-4 last:border-0", className)}>
      <div className="flex items-center gap-3">
        <Avatar initials={review.author.charAt(0)} size="md" />
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-semibold text-text-primary">{review.author}</span>
          <span className="text-[13px] text-text-muted">{DATE_FMT.format(review.date)}</span>
        </div>
        {review.verified && (
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-success-strong">
            <BadgeCheck className="size-4" aria-hidden />
            Compra verificada
          </span>
        )}
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
