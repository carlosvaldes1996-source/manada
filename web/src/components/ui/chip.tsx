"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onToggle"> {
  active?: boolean;
  onToggle?: (active: boolean) => void;
  /** Muestra un botón "×" para remover (chip de filtro aplicado). */
  removable?: boolean;
  onRemove?: () => void;
  icon?: React.ReactNode;
}

/**
 * Chip interactivo de filtro/selección (DESIGN_SYSTEM §11).
 * Activo: borde + fondo de marca. Reporta su estado con `aria-pressed`.
 * `removable` lo convierte en chip de filtro aplicado con acción de quitar.
 */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active = false, onToggle, removable, onRemove, icon, children, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={active}
        onClick={(e) => {
          onClick?.(e);
          onToggle?.(!active);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border bg-surface px-3.5 py-2 text-sm font-semibold transition-colors duration-[var(--duration-micro)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]",
          active
            ? "border-terracota-500 bg-brand-soft text-text-brand"
            : "border-border-default text-text-secondary hover:border-border-strong",
          className,
        )}
        {...props}
      >
        {icon && (
          <span className="inline-flex shrink-0" aria-hidden>
            {icon}
          </span>
        )}
        {children}
        {removable && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Quitar filtro"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="-mr-1 ml-0.5 inline-flex rounded-full p-0.5 hover:bg-terracota-100"
          >
            <X className="size-3.5" aria-hidden />
          </span>
        )}
      </button>
    );
  },
);
Chip.displayName = "Chip";
