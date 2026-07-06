import * as React from "react";
import { cn } from "@/lib/utils";
import { Field, controlClasses } from "./field";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  withField?: boolean;
}

/** Área de texto multilínea, misma API y a11y que <Input>. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, withField = true, id, required, rows = 4, ...props }, ref) => {
    const reactId = React.useId();
    const fieldId = id ?? reactId;
    const hintId = `${fieldId}-hint`;
    const errorId = `${fieldId}-error`;

    const control = (
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cn(controlClasses, "resize-y", className)}
        {...props}
      />
    );

    if (!withField) return control;
    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        htmlFor={fieldId}
        hintId={hintId}
        errorId={errorId}
      >
        {control}
      </Field>
    );
  },
);
Textarea.displayName = "Textarea";
