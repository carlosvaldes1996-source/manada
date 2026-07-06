import type { Pet, Species } from "@/types";
import { Avatar, type AvatarProps } from "@/components/ui/avatar";

/** Emoji por especie — placeholder cálido hasta tener foto real (§6). */
export const SPECIES_EMOJI: Record<Species, string> = {
  perro: "🐶",
  gato: "🐱",
  otro: "🐾",
};

export interface PetAvatarProps extends Omit<AvatarProps, "emoji" | "src" | "alt"> {
  pet: Pet;
}

/**
 * Avatar de mascota: usa su foto si existe; si no, el emoji de su especie sobre
 * el degradado cálido de marca. Atajo tipado sobre <Avatar>.
 */
export function PetAvatar({ pet, ...props }: PetAvatarProps) {
  return (
    <Avatar
      src={pet.avatarUrl}
      alt={pet.avatarUrl ? `Foto de ${pet.name}` : ""}
      emoji={pet.avatarUrl ? undefined : SPECIES_EMOJI[pet.species]}
      {...props}
    />
  );
}
