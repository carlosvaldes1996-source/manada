import { Truck } from "lucide-react";
import { formatDeliveryDate, formatShippingCost } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DeliveryEstimateBlockProps {
  date: Date;
  cost: number;
  comuna: string;
  /** Compacto (dentro de ProductCard) vs. completo (PDP). */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Estimación de entrega: fecha y costo REALES para una comuna, siempre visibles y
 * nunca en letra chica (DESIGN_SYSTEM §8). Tono cálido del sistema (no azul frío).
 *
 * ⚠️ Hoy NO se usa en producción: el despacho es manual y todavía no se calcula por
 * comuna, así que las pantallas reales montan <ShippingPolicyNote>, que dice lo que
 * sí sabemos (la política de costo) sin prometer una fecha. Este bloque queda listo
 * para el día que exista el cálculo por comuna; vive en el styleguide mientras tanto.
 */
export function DeliveryEstimateBlock({
  date,
  cost,
  comuna,
  size = "sm",
  className,
}: DeliveryEstimateBlockProps) {
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
