"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Plus } from "lucide-react";
import { usePet } from "@/components/providers";
import { cn } from "@/lib/utils";
import { PetAvatar, SPECIES_EMOJI } from "./pet-avatar";

/**
 * Selector de mascota global (DESIGN_SYSTEM §11, UX.md §3). Vive en el header;
 * cambiar de mascota re-personaliza toda la UI. Pill con avatar + nombre y un
 * menú (Radix) para alternar o agregar otra mascota. Si no hay mascota activa,
 * invita a crear el perfil.
 */
export function PetSwitcher() {
  const { pets, activePet, setActivePetId } = usePet();
  const router = useRouter();

  if (!activePet) {
    return (
      <Link
        href="/comenzar"
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-dashed border-terracota-200 bg-brand-soft px-3 py-1.5 text-sm font-semibold text-text-brand transition-colors hover:border-terracota-300"
      >
        <Plus className="size-4" aria-hidden />
        <span className="hidden sm:inline">Agregar mascota</span>
      </Link>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-terracota-100 bg-brand-soft py-1 pr-3 pl-1 text-sm font-semibold text-text-primary transition-colors hover:border-terracota-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]"
        aria-label={`Mascota activa: ${activePet.name}. Cambiar`}
      >
        <PetAvatar pet={activePet} size="sm" />
        <span className="hidden max-w-24 truncate sm:inline">{activePet.name}</span>
        <ChevronDown className="size-4 text-text-secondary" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[90] w-60 rounded-[var(--radius-md)] border border-border-default bg-surface p-1.5 shadow-md"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold tracking-[0.06em] text-text-muted uppercase">
            Tus mascotas
          </DropdownMenu.Label>
          {pets.map((pet) => (
            <DropdownMenu.Item
              key={pet.id}
              onSelect={() => setActivePetId(pet.id)}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 text-sm outline-none data-[highlighted]:bg-brand-soft",
                pet.id === activePet.id ? "text-text-brand" : "text-text-primary",
              )}
            >
              <span className="text-lg" aria-hidden>
                {SPECIES_EMOJI[pet.species]}
              </span>
              <span className="flex-1 font-medium">{pet.name}</span>
              {pet.id === activePet.id && <Check className="size-4" aria-hidden />}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-border-default" />
          <DropdownMenu.Item
            onSelect={() => router.push("/comenzar")}
            className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-semibold text-text-brand outline-none data-[highlighted]:bg-brand-soft"
          >
            <Plus className="size-4" aria-hidden />
            Agregar mascota
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
