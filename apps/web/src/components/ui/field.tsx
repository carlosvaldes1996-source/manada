import * as React from "react";
import { cn } from "@/lib/utils";

export interface FieldProps {
  label?: React.ReactNode;
  /** Texto de ayuda bajo el control (se oculta si hay error). */
  hint?: React.ReactNode;
  /** Mensaje de error — se anuncia con role="alert". */
  error?: React.ReactNode;
  required?: boolean;
  /** id del control, para enlazar la <label>. */
  htmlFor?: string;
  hintId?: string;
  errorId?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Envoltura de campo de formulario: label + control + hint/error.
 * Estandariza el espaciado y el cableado de accesibilidad (label↔control,
 * aria-describedby, role="alert"). Los controles (Input/Select/…) la usan
 * internamente; también sirve para envolver controles a medida.
 */
export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  hintId,
  errorId,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-semibold text-text-secondary">
          {label}
          {required && (
            <span className="ml-0.5 text-[var(--error)]" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-[13px] font-medium text-error-strong">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-[13px] text-text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** Clases compartidas por los controles de formulario (input/select/textarea). */
export const controlClasses =
  "w-full rounded-[var(--radius-md)] border border-border-default bg-surface px-3.5 py-3 text-[15px] text-text-primary transition-colors placeholder:text-text-muted hover:border-border-strong focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-terracota-100 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-[var(--error)] aria-[invalid=true]:ring-[var(--error-soft)]";
