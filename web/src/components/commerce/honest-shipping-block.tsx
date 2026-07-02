import { Truck } from "lucide-react";
import { formatDeliveryDate, formatShippingCost } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface HonestShippingBlockProps {
  date: Date;
  cost: number;
  comuna: string;
  /** Compacto (dentro de ProductCard) vs. completo (PDP). */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Bloque de despacho honesto (UX.md §1, DESIGN_SYSTEM §8 honestidad): fecha y
 * costo REALES, siempre visibles, nunca en letra chica. Tono cálido del sistema
 * (no azul frío). Aparece en la ProductCard y en la ficha — la transparencia es
 * parte del diferenciador.
 */
export function HonestShippingBlock({ date, cost, comuna, size = "sm", className }: HonestShippingBlockProps) {
  const free = cost === 0;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-sm)] bg-subtle text-text-secondary",
        size === "sm" ? "px-2 py-1.5 text-[13px]" : "px-3 py-2.5 text-sm",
        className,
      )}
    >
      <Truck
        className={cn("shrink-0 text-text-brand", size === "sm" ? "size-4" : "size-5")}
        strokeWidth={1.75}
        aria-hidden
      />
      <span>
        Llega <strong className="font-semibold text-text-primary">{formatDeliveryDate(date)}</strong> a {comuna} ·{" "}
        <strong className={cn("font-semibold", free ? "text-success-strong" : "text-text-primary")}>
          {formatShippingCost(cost)}
        </strong>
      </span>
    </div>
  );
}
