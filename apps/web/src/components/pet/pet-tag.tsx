import type { Pet } from "@/types";
import { cn } from "@/lib/utils";
import { PetAvatar } from "./pet-avatar";

/** Acento del texto: marca (terracota) o miel (anticipación / recomendación). */
const tones = {
  brand: "text-text-brand",
  miel: "text-subscribe-strong",
} as const;

export interface PetTagProps {
  pet: Pet;
  /** Texto del overline. Por defecto "Para {nombre}". */
  label?: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}

/**
 * Firma de personalización (PET_EXPERIENCE §1.1): overline con el ROSTRO de la
 * mascota — `[cara] PARA TOBY`. Con foto muestra su cara; sin foto, el emoji de
 * su especie (fallback idéntico a hoy → no rompe nada). Un componente, muchos
 * lugares: toda la personalización pasa a tener rostro.
 *
 * El avatar es decorativo (el nombre ya va en el texto) → `aria-hidden`, para no
 * duplicar "Foto de Toby · Para Toby" en lectores de pantalla.
 */
export function PetTag({ pet, label, tone = "brand", className }: PetTagProps) {
  return (
    <span className={cn("overline inline-flex items-center gap-1.5", tones[tone], className)}>
      <span aria-hidden className="inline-flex">
        <PetAvatar pet={pet} size="xs" />
      </span>
      {label ?? <>Para {pet.name}</>}
    </span>
  );
}
