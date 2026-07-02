"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

/**
 * Grupo de radios accesible (Radix). Dos presentaciones:
 * - <Radio> simple (punto + label) para listas compactas.
 * - <RadioCard> tarjeta seleccionable (despacho, mascota, pago) — DESIGN_SYSTEM §11.
 */
export const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-2.5", className)} {...props} />
));
RadioGroup.displayName = "RadioGroup";

export interface RadioProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  label?: React.ReactNode;
}

const dot = (
  <RadioGroupPrimitive.Indicator className="flex size-full items-center justify-center after:block after:size-2.5 after:rounded-full after:bg-terracota-500" />
);

export const Radio = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  RadioProps
>(({ className, label, id, ...props }, ref) => {
  const reactId = React.useId();
  const radioId = id ?? reactId;
  const item = (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={radioId}
      className={cn(
        "size-5 shrink-0 rounded-full border border-border-strong bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] data-[state=checked]:border-terracota-500 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {dot}
    </RadioGroupPrimitive.Item>
  );
  if (!label) return item;
  return (
    <label htmlFor={radioId} className="flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary">
      {item}
      <span>{label}</span>
    </label>
  );
});
Radio.displayName = "Radio";

export interface RadioCardProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Contenido a la derecha (precio, badge, logo de pago). */
  aside?: React.ReactNode;
  icon?: React.ReactNode;
}

export const RadioCard = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  RadioCardProps
>(({ className, title, description, aside, icon, id, ...props }, ref) => {
  const reactId = React.useId();
  const cardId = id ?? reactId;
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={cardId}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md)] border border-border-default bg-surface p-3.5 text-left transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] data-[state=checked]:border-terracota-500 data-[state=checked]:bg-brand-soft disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="grid size-5 shrink-0 place-items-center rounded-full border border-border-strong bg-surface">
        {dot}
      </span>
      {icon && (
        <span className="text-xl text-text-secondary" aria-hidden>
          {icon}
        </span>
      )}
      <span className="flex flex-1 flex-col">
        <span className="text-[15px] font-semibold text-text-primary">{title}</span>
        {description && <span className="text-[13px] text-text-secondary">{description}</span>}
      </span>
      {aside && <span className="shrink-0 text-right">{aside}</span>}
    </RadioGroupPrimitive.Item>
  );
});
RadioCard.displayName = "RadioCard";
