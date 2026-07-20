"use client";

import { Chip } from "@/components/ui/chip";
import type { ProductVariant } from "@/types";

export interface VariantSelectorProps {
  variants: ProductVariant[];
  /** ID de la variante actualmente elegida. */
  selectedId?: string;
  onSelect: (id: string) => void;
  label?: string;
  className?: string;
}

/**
 * Selector de formato/talla de la PDP. Un chip por variante disponible; si el
 * producto tiene una sola no se renderiza (no hay nada que elegir). Las
 * variantes agotadas se muestran deshabilitadas — honestidad de stock (UX.md §1).
 */
export function VariantSelector({
  variants,
  selectedId,
  onSelect,
  label = "Elige el formato",
  className,
}: VariantSelectorProps) {
  if (variants.length <= 1) return null;

  return (
    <div className={className}>
      <p className="mb-2 text-[13px] font-semibold text-text-secondary">{label}</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const soldOut = v.stock <= 0;
          return (
            <Chip
              key={v.id}
              active={v.id === selectedId}
              disabled={soldOut}
              onClick={() => onSelect(v.id)}
            >
              {soldOut ? `${v.format} · agotado` : v.format}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
