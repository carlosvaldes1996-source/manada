import type { Pet } from "@/types";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PetAvatar } from "./pet-avatar";
import { PetStatus } from "./pet-status";

export interface PetProfileHeaderProps {
  pet: Pet;
  /** Acciones a la derecha (editar perfil, agregar foto). */
  action?: React.ReactNode;
  /**
   * Reemplaza el retrato estático (p. ej. `PetPhotoUploader`, que convierte el
   * avatar en la zona de subida — B4). Sin slot, retrato de solo lectura.
   */
  avatarSlot?: React.ReactNode;
  className?: string;
}

/**
 * Hero del perfil de mascota — retrato editorial, calidad de la landing
 * (PET_EXPERIENCE §1.2). La mascota es el héroe: retrato grande con anillo
 * terracota, nombre en Fraunces (`pet-name`, text-brand) y su estado. La barra
 * de completitud recuerda que "lo que sabemos nos deja cuidarlo mejor" (UX.md §3).
 * Vive sobre `brand-soft` con `radius-xl` para anclar la página.
 */
export function PetProfileHeader({ pet, action, avatarSlot, className }: PetProfileHeaderProps) {
  const completeness = pet.completeness ?? 0;
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-terracota-100 bg-brand-soft p-6 sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
        {avatarSlot ?? <PetAvatar pet={pet} size="xl" className="ring-4 ring-terracota-100" />}
        <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
          <h1 className="heading-1 pet-name text-text-brand">{pet.name}</h1>
          <PetStatus pet={pet} show={["species", "stage", "weight", "breed"]} />
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="mt-6 flex flex-col gap-1.5">
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
