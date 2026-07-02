"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

/**
 * Interruptor (Radix). "Encendido" = Miel, el color de la anticipación/
 * suscripción (DESIGN_SYSTEM §11). Con `label`/`description` arma una fila completa.
 */
export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, label, description, id, ...props }, ref) => {
  const reactId = React.useId();
  const switchId = id ?? reactId;

  const control = (
    <SwitchPrimitive.Root
      ref={ref}
      id={switchId}
      className={cn(
        "relative inline-flex h-7 w-[46px] shrink-0 items-center rounded-[var(--radius-pill)] bg-neutral-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] data-[state=checked]:bg-miel-500 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-[22px] translate-x-[3px] rounded-full bg-white shadow-xs transition-transform data-[state=checked]:translate-x-[21px]" />
    </SwitchPrimitive.Root>
  );

  if (!label && !description) return control;
  return (
    <label htmlFor={switchId} className="flex cursor-pointer items-center justify-between gap-4">
      <span className="flex flex-col">
        {label && <span className="text-[15px] font-semibold text-text-primary">{label}</span>}
        {description && <span className="text-[13px] text-text-secondary">{description}</span>}
      </span>
      {control}
    </label>
  );
});
Switch.displayName = "Switch";
