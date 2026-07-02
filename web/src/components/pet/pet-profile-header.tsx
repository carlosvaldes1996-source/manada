import type { Pet } from "@/types";
import { Progress } from "@/components/ui/progress";
import { PetAvatar } from "./pet-avatar";
import { PetStatus } from "./pet-status";

export interface PetProfileHeaderProps {
  pet: Pet;
  /** Acciones a la derecha (editar perfil, agregar foto). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Cabecera del perfil de mascota (la pantalla del moat). Avatar grande, nombre
 * como héroe (Fraunces), badges de estado y barra de completitud — "lo que
 * sabemos nos deja cuidarlo mejor" (UX.md §3).
 */
export function PetProfileHeader({ pet, action, className }: PetProfileHeaderProps) {
  const completeness = pet.completeness ?? 0;
  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <PetAvatar pet={pet} size="xl" />
        <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
          <h1 className="heading-1 pet-name">{pet.name}</h1>
          <PetStatus pet={pet} show={["species", "stage", "weight", "breed"]} />
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-semibold text-text-secondary">Perfil completo</span>
          <span className="price text-text-primary">{completeness}%</span>
        </div>
        <Progress value={completeness} tone="miel" label={`Perfil de ${pet.name} completo al ${completeness}%`} />
        {completeness < 100 && (
          <p className="text-[13px] text-text-muted">
            Mientras más sepamos de {pet.name}, mejor nos anticipamos a lo que necesita.
          </p>
        )}
      </div>
    </div>
  );
}
