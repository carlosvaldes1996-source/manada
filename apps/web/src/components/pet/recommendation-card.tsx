import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PetTag } from "./pet-tag";
import type { Pet } from "@/types";

export interface RecommendationCardProps {
  /** Eyebrow personalizado ("Recomendado para Toby"). */
  eyebrow?: string;
  /**
   * Mascota — da rostro al eyebrow (firma de personalización, §1.1). Si no se
   * pasa, cae al eyebrow con ícono Sparkles de siempre (no rompe nada).
   */
  pet?: Pet;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** "¿Por qué te lo recomendamos?" — transparencia del moat. */
  reason?: string;
  /** Media/visual a la izquierda (packshot, emoji). */
  media?: React.ReactNode;
  /** CTA (botón/enlace). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Tarjeta de recomendación personalizada (acento Miel = anticipación).
 * Explica el porqué de forma honesta (Popover), nunca una caja negra.
 * Genérica: sirve para producto sugerido, transición de fórmula o farmacia.
 */
export function RecommendationCard({
  eyebrow,
  pet,
  title,
  description,
  reason,
  media,
  action,
  className,
}: RecommendationCardProps) {
  return (
    <div
      className={cn(
        "flex gap-4 rounded-[var(--radius-lg)] border border-miel-200 bg-accent-soft p-4",
        className,
      )}
    >
      {media && (
        <div className="grid size-16 shrink-0 place-items-center rounded-[var(--radius-md)] bg-surface text-3xl" aria-hidden>
          {media}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {pet ? (
          <PetTag pet={pet} tone="miel" label={eyebrow ?? `Para ${pet.name}`} />
        ) : (
          <span className="overline inline-flex items-center gap-1 text-subscribe-strong">
            <Sparkles className="size-3.5" aria-hidden />
            {eyebrow ?? "Recomendado para ti"}
          </span>
        )}
        <h3 className="heading-4 text-text-primary">{title}</h3>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          {action}
          {reason && (
            <Popover>
              <PopoverTrigger className="text-[13px] font-semibold text-subscribe-strong underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]">
                ¿Por qué te lo recomendamos?
              </PopoverTrigger>
              <PopoverContent>{reason}</PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}
