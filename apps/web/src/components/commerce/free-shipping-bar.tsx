import { Truck } from "lucide-react";
import { formatCLP } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface FreeShippingBarProps {
  /** Subtotal actual del carrito (CLP). */
  subtotal: number;
  /** Umbral para envío gratis en compra única (CLP). */
  threshold: number;
  /**
   * El carrito trae una línea de suscripción Y la política incluye el despacho.
   * Cuando es `true`, el umbral deja de aplicar: mostrar el progreso hacia él
   * sería empujar a gastar más por un beneficio que el comprador YA tiene.
   */
  includedBySubscription?: boolean;
  className?: string;
}

/**
 * Estado del envío gratis en el carrito/drawer. Dos modos, según cuál de las dos
 * ramas de la política manda (ver `@/lib/shipping-copy`):
 *
 *  - Suscripción → el despacho ya está incluido: se confirma y no se pide nada más.
 *  - Compra única → progreso hacia el umbral. Motiva a sumar sin presionar y
 *    celebra en verde éxito al alcanzarlo.
 */
export function FreeShippingBar({
  subtotal,
  threshold,
  includedBySubscription = false,
  className,
}: FreeShippingBarProps) {
  const reached = includedBySubscription || subtotal >= threshold;
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
        {includedBySubscription ? (
          <span>Tu suscripción incluye el despacho 🎉</span>
        ) : reached ? (
          <span>¡Tienes envío gratis! 🎉</span>
        ) : (
          <span>
            Te faltan <strong className="text-text-primary">{formatCLP(remaining)}</strong> para envío gratis
          </span>
        )}
      </span>
      {!includedBySubscription && (
        <Progress value={pct} tone={reached ? "success" : "brand"} size="sm" label="Progreso hacia envío gratis" />
      )}
    </div>
  );
}
