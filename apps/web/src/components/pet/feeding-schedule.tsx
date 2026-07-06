import type { Pet } from "@/types";
import { Utensils } from "lucide-react";
import { dailyRationGrams } from "@/lib/anticipation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FeedingScheduleProps {
  pet: Pet;
  /** Nº de comidas al día (reparte la ración diaria). */
  mealsPerDay?: number;
  className?: string;
}

/**
 * Plan de alimentación calculado a partir del peso y la etapa de la mascota
 * (motor de anticipación). Muestra la ración diaria y por comida — un dato útil
 * que refuerza "te conoce". Requiere peso; si falta, invita a completarlo.
 */
export function FeedingSchedule({ pet, mealsPerDay = 2, className }: FeedingScheduleProps) {
  if (pet.weightKg == null) {
    return (
      <Card className={cn("flex items-center gap-3 text-sm text-text-secondary", className)}>
        <Utensils className="size-5 shrink-0 text-text-muted" aria-hidden />
        Cuéntanos el peso de {pet.name} para calcular su ración diaria.
      </Card>
    );
  }

  const perDay = dailyRationGrams(pet.weightKg, pet.stage);
  const perMeal = Math.round(perDay / mealsPerDay);

  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-miel-700" aria-hidden>
          <Utensils className="size-4" />
        </span>
        <h3 className="heading-4 text-text-primary">Plan de alimentación</h3>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-[var(--radius-md)] bg-subtle p-3">
          <dt className="text-[13px] text-text-secondary">Ración diaria</dt>
          <dd className="price text-xl text-text-primary">{perDay} g</dd>
        </div>
        <div className="rounded-[var(--radius-md)] bg-subtle p-3">
          <dt className="text-[13px] text-text-secondary">Por comida ({mealsPerDay}×)</dt>
          <dd className="price text-xl text-text-primary">{perMeal} g</dd>
        </div>
      </dl>
      <p className="text-[13px] text-text-muted">
        Estimación referencial según peso ({pet.weightKg} kg) y etapa. Ajusta con tu veterinario.
      </p>
    </Card>
  );
}
