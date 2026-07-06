"use client";

import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PetEditCardProps {
  label: string;
  /** Valor actual; si falta, la tarjeta entra en estado "vacío" (invitación). */
  value?: React.ReactNode;
  /** Texto guía cuando está vacío ("Cuéntanos su peso para calcular la ración"). */
  emptyHint?: string;
  onEdit?: () => void;
  className?: string;
}

/**
 * Tarjeta editable de un dato del perfil (peso, raza, condiciones…).
 * Dos estados: lleno (valor + "editar") y vacío (borde punteado + invitación
 * cálida a completar). Cada dato vacío es una oportunidad de conocer mejor.
 */
export function PetEditCard({ label, value, emptyHint, onEdit, className }: PetEditCardProps) {
  const empty = value == null || value === "";
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-[var(--radius-md)] border bg-surface p-4",
        empty ? "border-dashed border-terracota-200 bg-brand-soft" : "border-border-default",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-semibold tracking-[0.06em] text-text-muted uppercase">{label}</span>
        {empty ? (
          <span className="text-sm text-text-secondary">{emptyHint ?? "Sin completar"}</span>
        ) : (
          <span className="truncate text-base font-semibold text-text-primary">{value}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex shrink-0 items-center gap-1 rounded-md p-1.5 text-sm font-semibold text-text-brand hover:bg-terracota-50 focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
      >
        {empty ? <Plus className="size-4" aria-hidden /> : <Pencil className="size-3.5" aria-hidden />}
        {empty ? "Agregar" : "Editar"}
      </button>
    </div>
  );
}
