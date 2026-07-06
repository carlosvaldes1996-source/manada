import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Pet } from "@/types";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { PetAvatar } from "./pet-avatar";
import { PetStatus } from "./pet-status";

export interface PetCardProps {
  pet: Pet;
  /** Destino al abrir el perfil. Si se omite, la tarjeta no es un enlace. */
  href?: string;
  /** Marca visualmente la mascota activa. */
  active?: boolean;
  className?: string;
}

/**
 * Tarjeta-resumen de una mascota para "Mis mascotas". Avatar + nombre + estado
 * + completitud. Clicable para abrir el perfil completo.
 */
export function PetCard({ pet, href, active, className }: PetCardProps) {
  const inner = (
    <>
      <PetAvatar pet={pet} size="lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="pet-name text-lg">{pet.name}</span>
        <PetStatus pet={pet} show={["species", "stage", "weight"]} />
        {pet.completeness != null && (
          <Progress value={pet.completeness} tone="miel" size="sm" label={`Perfil al ${pet.completeness}%`} className="mt-1 max-w-40" />
        )}
      </div>
      {href && <ChevronRight className="size-5 shrink-0 self-center text-text-muted" aria-hidden />}
    </>
  );

  const classes = cn(
    "flex items-start gap-4 rounded-[var(--radius-lg)] border bg-surface p-4 shadow-sm transition-[transform,box-shadow] duration-[var(--duration-standard)]",
    active ? "border-terracota-500 ring-1 ring-terracota-200" : "border-border-default",
    href && "hover:-translate-y-0.5 hover:shadow-md",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={`Ver perfil de ${pet.name}`}>
        {inner}
      </Link>
    );
  }
  return <div className={classes}>{inner}</div>;
}
