import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Una acción concreta por la mascota ("Reponer alimento", "Antiparasitario"…).
 * Sistema escalable: cuando existan servicios (veterinario, peluquería, paseos,
 * seguros), se agregan como entradas de este mismo tipo — la grilla no cambia.
 * Son ACCIONES, no categorías de e-commerce: cada una nombra qué hace por ella.
 */
export interface PetAction {
  key: string;
  label: string;
  /** Contexto corto y escaneable ("Farmacia", "Acana · 3 kg"). */
  hint?: string;
  icon: React.ReactNode;
  href?: string;
  onSelect?: () => void;
}

export interface PetActionGridProps {
  actions: PetAction[];
  className?: string;
}

const tileClass =
  "flex h-full w-full items-center gap-2.5 rounded-[var(--radius-lg)] border border-border-default bg-surface px-3.5 py-2.5 text-left shadow-sm transition-[transform,box-shadow] duration-[var(--duration-standard)] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]";

function TileContent({ action }: { action: PetAction }) {
  return (
    <>
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-text-brand"
      >
        {action.icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[14px] leading-snug font-semibold text-text-primary">
          {action.label}
        </span>
        {action.hint && (
          <span className="caption truncate text-text-secondary">{action.hint}</span>
        )}
      </span>
    </>
  );
}

/**
 * Grilla compacta de acciones sugeridas bajo el estado de la mascota — el
 * "¿qué puedo hacer ahora?" del centro de control. Tiles densos (ícono +
 * verbo + contexto), pensados para el primer viewport.
 */
export function PetActionGrid({ actions, className }: PetActionGridProps) {
  if (actions.length === 0) return null;
  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5", className)}>
      {actions.map((a) => (
        <li key={a.key}>
          {a.href ? (
            <Link href={a.href} className={tileClass}>
              <TileContent action={a} />
            </Link>
          ) : (
            <button type="button" onClick={a.onSelect} className={tileClass}>
              <TileContent action={a} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
