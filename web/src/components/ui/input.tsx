import * as React from "react";
import { cn } from "@/lib/utils";
import { Field, controlClasses } from "./field";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Adorno al inicio (ícono / "$"). */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Si `false`, no envuelve en <Field> (control desnudo para composición). */
  withField?: boolean;
}

/**
 * Campo de texto accesible. Con `label`/`hint`/`error` se auto-envuelve en
 * <Field> y cablea aria-describedby + aria-invalid. Soporta adornos leading/trailing.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, hint, error, leading, trailing, withField = true, id, required, ...props },
    ref,
  ) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    const control = (
      <div className="relative flex items-center">
        {leading && (
          <span className="pointer-events-none absolute left-3.5 text-text-muted" aria-hidden>
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(controlClasses, leading && "pl-10", trailing && "pr-10", className)}
          {...props}
        />
        {trailing && (
          <span className="absolute right-3.5 text-text-muted" aria-hidden>
            {trailing}
          </span>
        )}
      </div>
    );

    if (!withField) return control;
    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        htmlFor={inputId}
        hintId={hintId}
        errorId={errorId}
      >
        {control}
      </Field>
    );
  },
);
Input.displayName = "Input";
