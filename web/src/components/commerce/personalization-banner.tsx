import { SlidersHorizontal } from "lucide-react";
import type { Pet } from "@/types";
import { SPECIES_EMOJI } from "@/components/pet/pet-avatar";
import { cn } from "@/lib/utils";

export interface PersonalizationBannerProps {
  pet: Pet;
  /** Acción para limpiar/ajustar el filtro personalizado. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Aviso de catálogo personalizado ("Filtrado para Toby") en la PLP. Hace
 * visible que la marca conoce a la mascota y adapta lo que muestra (UX.md §3).
 */
export function PersonalizationBanner({ pet, action, className }: PersonalizationBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5 rounded-[var(--radius-md)] border border-terracota-100 bg-brand-soft px-4 py-3 text-sm",
        className,
      )}
    >
      <SlidersHorizontal className="size-4 shrink-0 text-text-brand" aria-hidden />
      <span className="text-text-primary">
        Filtrado para <span className="pet-name">{pet.name}</span> {SPECIES_EMOJI[pet.species]} ·{" "}
        <span className="text-text-secondary">{pet.stage}, {pet.weightKg ? `${pet.weightKg} kg` : "peso por completar"}</span>
      </span>
      {action && <span className="ml-auto">{action}</span>}
    </div>
  );
}
