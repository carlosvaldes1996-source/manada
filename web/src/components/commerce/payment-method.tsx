"use client";

import { RadioGroup, RadioCard } from "@/components/ui/radio";
import { cn } from "@/lib/utils";

export interface PaymentOption {
  id: string;
  label: string;
  description?: string;
  /** Logo/ícono del medio (Webpay, tarjeta, etc.). */
  icon?: React.ReactNode;
}

export interface PaymentMethodProps {
  options: PaymentOption[];
  value?: string;
  onValueChange: (id: string) => void;
  className?: string;
}

/**
 * Selector de medio de pago (radio-cards). Los medios reales (Webpay, Mercado
 * Pago, transferencia) se conectan en Fase 4; aquí define la UI accesible.
 */
export function PaymentMethod({ options, value, onValueChange, className }: PaymentMethodProps) {
  return (
    <RadioGroup value={value} onValueChange={onValueChange} className={cn(className)} aria-label="Medio de pago">
      {options.map((opt) => (
        <RadioCard key={opt.id} value={opt.id} icon={opt.icon} title={opt.label} description={opt.description} />
      ))}
    </RadioGroup>
  );
}
