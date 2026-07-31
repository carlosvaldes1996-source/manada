"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, LogOut, Plus, User as UserIcon } from "lucide-react";
import { usePet, useSession } from "@/components/providers";
import { useAuthActions } from "@/hooks";
import { cn } from "@/lib/utils";
import { PetAvatar } from "./pet-avatar";

/**
 * Menú único de identidad del header (auditoría de navegación, 2026-07-31). Un
 * solo control de avatar que separa EXPLÍCITAMENTE las dos identidades que antes
 * se confundían (feedback de Carlos): la MASCOTA —cuyo perfil vive en
 * `/cuenta/mascotas`, único y canónico— y el HUMANO —cuya cuenta vive en
 * `/cuenta`—. Reemplaza al par anterior "PetSwitcher (nombre navegable) + ícono
 * de usuario suelto", que hacía leer el nombre de la mascota como "mi perfil".
 *
 * - **Trigger:** la CARA de la mascota activa (calidez de marca, B4) + chevron.
 *   *Sin nombre en la barra* (el nombre era justo lo que inducía la confusión);
 *   el nombre reaparece dentro del menú. Sin mascota, un avatar neutro (ícono de
 *   usuario) — el "Agregar mascota" pasa a ser la primera opción del menú.
 * - **Tu mascota:** ver su perfil (→ `/cuenta/mascotas`) · cambiar de mascota
 *   (solo ≥2) · agregar otra.
 * - **Tu cuenta:** Mi cuenta + Cerrar sesión (con sesión) · Ingresar + Crear
 *   cuenta (invitado).
 *
 * El logo sigue yendo a Inicio (`/`); la mascota, siempre a su perfil canónico.
 */
const ITEM = "flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 text-sm outline-none data-[highlighted]:bg-brand-soft";
const LABEL = "px-2 py-1.5 text-xs font-semibold tracking-[0.06em] text-text-muted uppercase";

export function AccountMenu() {
  const { pets, activePet, setActivePetId } = usePet();
  const { status } = useSession();
  const { logout } = useAuthActions();
  const router = useRouter();

  const authed = status === "authenticated";
  const hasMultiple = pets.length > 1;

  async function signOut() {
    await logout();
    router.push("/");
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={activePet ? `Tu cuenta y tu mascota (activa: ${activePet.name})` : "Tu cuenta"}
        className="group/pill inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-pill)] border border-terracota-100 bg-brand-soft py-1 pr-2.5 pl-1 text-text-primary outline-none transition-colors hover:border-terracota-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] data-[state=open]:border-terracota-200"
      >
        {activePet ? (
          <PetAvatar
            pet={activePet}
            size="sm"
            className="transition-transform duration-[var(--duration-micro)] group-hover/pill:scale-105"
          />
        ) : (
          <span className="grid size-7 place-items-center rounded-full bg-surface text-text-secondary">
            <UserIcon className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
        )}
        <ChevronDown className="size-4 text-text-secondary" aria-hidden />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[90] w-64 rounded-[var(--radius-md)] border border-border-default bg-surface p-1.5 shadow-md"
        >
          {/* ── Tu mascota (perfil canónico: /cuenta/mascotas) ── */}
          <DropdownMenu.Label className={LABEL}>Tu mascota</DropdownMenu.Label>

          {activePet ? (
            <>
              <DropdownMenu.Item asChild>
                <Link href="/cuenta/mascotas" className={cn(ITEM, "font-semibold text-text-brand")}>
                  <PetAvatar pet={activePet} size="sm" />
                  <span className="flex-1 truncate">Ver perfil de {activePet.name}</span>
                </Link>
              </DropdownMenu.Item>

              {hasMultiple && (
                <>
                  <DropdownMenu.Label className={cn(LABEL, "mt-1 normal-case tracking-normal text-text-muted")}>
                    Cambiar de mascota
                  </DropdownMenu.Label>
                  {pets.map((pet) => (
                    <DropdownMenu.Item
                      key={pet.id}
                      onSelect={() => setActivePetId(pet.id)}
                      className={cn(ITEM, pet.id === activePet.id ? "text-text-brand" : "text-text-primary")}
                    >
                      <PetAvatar pet={pet} size="sm" />
                      <span className="flex-1 truncate font-medium">{pet.name}</span>
                      {pet.id === activePet.id && <Check className="size-4 shrink-0" aria-hidden />}
                    </DropdownMenu.Item>
                  ))}
                </>
              )}

              <DropdownMenu.Item asChild>
                <Link href="/comenzar" className={cn(ITEM, "text-text-primary")}>
                  <Plus className="size-4" aria-hidden />
                  Agregar mascota
                </Link>
              </DropdownMenu.Item>
            </>
          ) : (
            <DropdownMenu.Item asChild>
              <Link href="/comenzar" className={cn(ITEM, "font-semibold text-text-brand")}>
                <Plus className="size-4" aria-hidden />
                Agregar mascota
              </Link>
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="my-1 h-px bg-border-default" />

          {/* ── Tu cuenta (el humano: /cuenta) ── */}
          <DropdownMenu.Label className={LABEL}>Tu cuenta</DropdownMenu.Label>
          {authed ? (
            <>
              <DropdownMenu.Item asChild>
                <Link href="/cuenta" className={cn(ITEM, "text-text-primary")}>
                  <UserIcon className="size-4" aria-hidden />
                  Mi cuenta
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => void signOut()} className={cn(ITEM, "text-text-primary")}>
                <LogOut className="size-4" aria-hidden />
                Cerrar sesión
              </DropdownMenu.Item>
            </>
          ) : (
            <>
              <DropdownMenu.Item asChild>
                <Link href="/ingresar" className={cn(ITEM, "text-text-primary")}>
                  <UserIcon className="size-4" aria-hidden />
                  Ingresar
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/crear-cuenta" className={cn(ITEM, "font-semibold text-text-brand")}>
                  <Plus className="size-4" aria-hidden />
                  Crear cuenta
                </Link>
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
