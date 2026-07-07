import { Truck } from "lucide-react";
import type { ShippingPolicy } from "@/lib/medusa";
import { formatCLP } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ShippingPolicyNoteProps {
  policy: ShippingPolicy;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Nota de despacho HONESTA (Fase 5 · Etapa B). Muestra la política real venida del
 * backend (costo base + envío gratis sobre el umbral), sin prometer fecha ni comuna
 * (el despacho es manual y aún no se calcula por comuna). Fuente única: el backend
 * (`getShippingPolicy`). Reemplaza al bloque con fecha/comuna simuladas.
 */
export function ShippingPolicyNote({ policy, size = "sm", className }: ShippingPolicyNoteProps) {
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
        Envío <strong className="font-semibold text-text-primary">{formatCLP(policy.baseShippingAmount)}</strong> ·{" "}
        <strong className="font-semibold text-success-strong">
          gratis sobre {formatCLP(policy.freeShippingThreshold)}
        </strong>
      </span>
    </div>
  );
}
