"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, PawPrint, Plus } from "lucide-react";
import { usePet } from "@/components/providers";
import { cn } from "@/lib/utils";
import { PetAvatar } from "./pet-avatar";

/**
 * Selector de mascota global (DESIGN_SYSTEM §11, UX.md §3). Vive en el header y
 * la mascota es "un lugar" (PET_EXPERIENCE_TARGET Bloque 1):
 * - 0 mascotas → invita a crear el perfil (→ /comenzar).
 * - 1 mascota → el pill (avatar + nombre) navega a su perfil (/cuenta/mascotas).
 *   Sin chevron ni menú.
 * - ≥2 mascotas → el pill navega al perfil de la activa; un chevron separado
 *   abre el menú (Radix) para cambiar la mascota activa o gestionar la manada.
 * - Móvil (<sm) → el nombre y el chevron se ocultan; el avatar solo navega.
 */
export function PetSwitcher() {
  const { pets, activePet, setActivePetId } = usePet();

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

  const hasMultiple = pets.length > 1;

  return (
    <div className="group/pill inline-flex items-stretch rounded-[var(--radius-pill)] border border-terracota-100 bg-brand-soft transition-colors hover:border-terracota-200">
      {/* Zona de navegación: avatar + nombre → perfil de la mascota activa. */}
      <Link
        href="/cuenta/mascotas"
        aria-label={`Ver perfil de ${activePet.name}`}
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] p-1 text-sm font-semibold text-text-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] sm:min-w-0 sm:justify-start",
          hasMultiple ? "sm:pr-1" : "sm:pr-3",
        )}
      >
        <PetAvatar
          pet={activePet}
          size="sm"
          className="transition-transform duration-[var(--duration-micro)] group-hover/pill:scale-105"
        />
        <span className="hidden max-w-24 truncate sm:inline">{activePet.name}</span>
      </Link>

      {/* Zona de menú (solo ≥2 mascotas, solo en ≥sm): chevron → Radix menu. */}
      {hasMultiple && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            aria-label={`Cambiar de mascota (activa: ${activePet.name})`}
            className="hidden min-h-11 items-center rounded-[var(--radius-pill)] py-1 pr-2.5 pl-0.5 text-text-secondary outline-none transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] data-[state=open]:text-text-primary sm:inline-flex"
          >
            <ChevronDown className="size-4" aria-hidden />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-[90] w-64 rounded-[var(--radius-md)] border border-border-default bg-surface p-1.5 shadow-md"
            >
              <DropdownMenu.Item asChild>
                <Link
                  href="/cuenta/mascotas"
                  className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-semibold text-text-brand outline-none data-[highlighted]:bg-brand-soft"
                >
                  <PetAvatar pet={activePet} size="sm" />
                  <span className="flex-1 truncate">Ver perfil de {activePet.name}</span>
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-border-default" />

              <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold tracking-[0.06em] text-text-muted uppercase">
                Cambiar de mascota
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
                  <PetAvatar pet={pet} size="sm" />
                  <span className="flex-1 truncate font-medium">{pet.name}</span>
                  {pet.id === activePet.id && <Check className="size-4 shrink-0" aria-hidden />}
                </DropdownMenu.Item>
              ))}

              <DropdownMenu.Separator className="my-1 h-px bg-border-default" />

              <DropdownMenu.Item asChild>
                <Link
                  href="/cuenta/mascotas"
                  className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-text-primary outline-none data-[highlighted]:bg-brand-soft"
                >
                  <PawPrint className="size-4" aria-hidden />
                  Gestionar mi manada
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href="/comenzar"
                  className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-semibold text-text-brand outline-none data-[highlighted]:bg-brand-soft"
                >
                  <Plus className="size-4" aria-hidden />
                  Agregar mascota
                </Link>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
}
