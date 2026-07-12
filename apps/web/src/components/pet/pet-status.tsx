import type { LifeStage, Pet } from "@/types";
import { Badge } from "@/components/ui/badge";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

export const STAGE_LABEL: Record<LifeStage, string> = {
  cachorro: "Cachorro",
  adulto: "Adulto",
  senior: "Senior",
};

export const SPECIES_LABEL: Record<Pet["species"], string> = {
  perro: "Perro",
  gato: "Gato",
  otro: "Otro",
};

export interface PetStatusProps {
  pet: Pet;
  /** Qué atributos mostrar (por defecto especie + etapa + peso). */
  show?: ("species" | "stage" | "weight" | "breed")[];
  className?: string;
}

/**
 * Fila de badges con los datos de la mascota (especie · etapa · peso · raza).
 * Resume el perfil de forma escaneable bajo el nombre.
 */
export function PetStatus({ pet, show = ["species", "stage", "weight"], className }: PetStatusProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {show.includes("species") && <Badge variant="neutral">{SPECIES_LABEL[pet.species]}</Badge>}
      {show.includes("stage") && <Badge variant="neutral">{STAGE_LABEL[pet.stage]}</Badge>}
      {show.includes("weight") && pet.weightKg != null && (
        <Badge variant="neutral">{pet.weightKg} kg</Badge>
      )}
      {show.includes("breed") && pet.breed && <Badge variant="neutral">{pet.breed}</Badge>}
      {pet.conditions && pet.conditions.length > 0 && (
        <Badge variant="info">{pluralize(pet.conditions.length, "condición", "condiciones")}</Badge>
      )}
    </div>
  );
}
