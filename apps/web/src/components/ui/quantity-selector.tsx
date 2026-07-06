"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  /** Etiqueta accesible del control (por defecto "Cantidad"). */
  label?: string;
  className?: string;
}

/**
 * Selector de cantidad (− valor +) para carrito y PDP.
 * Respeta min/max, expone aria-label en los botones y un live region en la cifra.
 */
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  disabled = false,
  size = "md",
  label = "Cantidad",
  className,
}: QuantitySelectorProps) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  const btn =
    "grid place-items-center text-text-primary transition-colors hover:bg-subtle disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]";
  const dim = size === "sm" ? "size-8" : "size-10";

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center overflow-hidden rounded-[var(--radius-pill)] border border-border-default",
        className,
      )}
    >
      <button type="button" className={cn(btn, dim)} onClick={dec} disabled={disabled || value <= min} aria-label="Disminuir cantidad">
        <Minus className="size-4" aria-hidden />
      </button>
      <span aria-live="polite" className={cn("price min-w-8 text-center text-[15px]", size === "sm" && "min-w-7 text-sm")}>
        {value}
      </span>
      <button type="button" className={cn(btn, dim)} onClick={inc} disabled={disabled || value >= max} aria-label="Aumentar cantidad">
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
