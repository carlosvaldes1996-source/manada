import { Truck } from "lucide-react";
import { formatCLP } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface FreeShippingBarProps {
  /** Subtotal actual del carrito (CLP). */
  subtotal: number;
  /** Umbral para envío gratis (CLP). */
  threshold: number;
  className?: string;
}

/**
 * Barra de progreso hacia el envío gratis (carrito/drawer). Motiva a sumar sin
 * presionar: cuando se alcanza, celebra en verde éxito. Honesta con el monto.
 */
export function FreeShippingBar({ subtotal, threshold, className }: FreeShippingBarProps) {
  const reached = subtotal >= threshold;
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[var(--radius-md)] p-3 text-[13px] font-medium",
        reached ? "bg-success-soft text-success-strong" : "bg-subtle text-text-secondary",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        <Truck className="size-4 shrink-0" aria-hidden />
        {reached ? (
          <span>¡Tienes envío gratis! 🎉</span>
        ) : (
          <span>
            Te faltan <strong className="text-text-primary">{formatCLP(remaining)}</strong> para envío gratis
          </span>
        )}
      </span>
      <Progress value={pct} tone={reached ? "success" : "brand"} size="sm" label="Progreso hacia envío gratis" />
    </div>
  );
}
