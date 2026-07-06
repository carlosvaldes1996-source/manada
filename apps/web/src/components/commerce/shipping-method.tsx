"use client";

import { formatShippingCost } from "@/lib/format";
import { RadioGroup, RadioCard } from "@/components/ui/radio";
import { cn } from "@/lib/utils";

export interface ShippingOption {
  id: string;
  label: string;
  /** Detalle ("Llega mañana", "2–3 días hábiles"). */
  eta: string;
  cost: number;
  icon?: React.ReactNode;
}

export interface ShippingMethodProps {
  options: ShippingOption[];
  value?: string;
  onValueChange: (id: string) => void;
  className?: string;
}

/**
 * Selector de método de despacho (radio-cards). Costo y plazo siempre visibles
 * (honestidad). Envío gratis se muestra como tal, no oculto.
 */
export function ShippingMethod({ options, value, onValueChange, className }: ShippingMethodProps) {
  return (
    <RadioGroup value={value} onValueChange={onValueChange} className={cn(className)} aria-label="Método de despacho">
      {options.map((opt) => (
        <RadioCard
          key={opt.id}
          value={opt.id}
          icon={opt.icon}
          title={opt.label}
          description={opt.eta}
          aside={
            <span className={cn("price text-sm", opt.cost === 0 ? "text-success-strong" : "text-text-primary")}>
              {formatShippingCost(opt.cost)}
            </span>
          }
        />
      ))}
    </RadioGroup>
  );
}
