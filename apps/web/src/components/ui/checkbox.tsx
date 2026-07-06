"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: React.ReactNode;
  /** Conteo/metadato a la derecha (filtros de catálogo). */
  meta?: React.ReactNode;
}

/**
 * Checkbox accesible (Radix). Soporta estado indeterminado (`checked="indeterminate"`).
 * Con `label` se renderiza como fila clicable completa (área táctil cómoda).
 */
export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, meta, id, ...props }, ref) => {
  const reactId = React.useId();
  const boxId = id ?? reactId;

  const box = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={boxId}
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-[6px] border border-border-strong bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] data-[state=checked]:border-terracota-500 data-[state=checked]:bg-terracota-500 data-[state=indeterminate]:border-terracota-500 data-[state=indeterminate]:bg-terracota-500 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-white">
        {props.checked === "indeterminate" ? (
          <Minus className="size-3.5" strokeWidth={3} aria-hidden />
        ) : (
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return box;
  return (
    <label
      htmlFor={boxId}
      className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-text-secondary"
    >
      {box}
      <span className="flex-1">{label}</span>
      {meta != null && <span className="text-[13px] text-text-muted">{meta}</span>}
    </label>
  );
});
Checkbox.displayName = "Checkbox";
