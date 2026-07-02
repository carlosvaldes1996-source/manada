"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: React.ReactNode;
  /** Render del valor actual (p. ej. rango de precio formateado). */
  formatValue?: (value: number[]) => React.ReactNode;
}

/**
 * Slider accesible (Radix) — uno o dos thumbs (rango de precio en filtros).
 * Teclado y aria-valuetext incluidos. Pista en `bg-muted`, relleno Terracota.
 */
export const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, label, formatValue, value, defaultValue, ...props }, ref) => {
  const current = value ?? defaultValue ?? [0];
  const thumbs = current.length;

  return (
    <div className="flex flex-col gap-2.5">
      {(label || formatValue) && (
        <div className="flex items-center justify-between text-[13px]">
          {label && <span className="font-semibold text-text-secondary">{label}</span>}
          {formatValue && (
            <span className="price text-text-primary">{formatValue(current)}</span>
          )}
        </div>
      )}
      <SliderPrimitive.Root
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        className={cn("relative flex w-full touch-none items-center select-none py-1.5", className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full bg-terracota-500" />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbs }).map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className="block size-5 rounded-full border-2 border-terracota-500 bg-surface shadow-sm transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] hover:shadow-md"
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  );
});
Slider.displayName = "Slider";
