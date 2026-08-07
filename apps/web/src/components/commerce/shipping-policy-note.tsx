import { Truck } from "lucide-react";
import type { ShippingPolicy } from "@/lib/medusa";
import { oneTimeShippingLabel, subscriptionShippingLabel } from "@/lib/shipping-copy";
import { cn } from "@/lib/utils";

export interface ShippingPolicyNoteProps {
  policy: ShippingPolicy;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Nota de despacho de la ficha de producto (Fase 5 · Etapa B). Muestra la política
 * REAL venida del backend, con sus dos ramas separadas en dos líneas: el beneficio
 * de la suscripción arriba (es el que decide la compra) y el piso de la compra
 * única abajo. No promete fecha ni comuna —el despacho es manual y aún no se
 * calcula por comuna—; el costo exacto se confirma en el checkout.
 *
 * Fuente única de los montos: el backend (`getShippingPolicy`). Fuente única del
 * texto: `@/lib/shipping-copy`.
 */
export function ShippingPolicyNote({ policy, size = "sm", className }: ShippingPolicyNoteProps) {
  const subscription = subscriptionShippingLabel(policy);
  const oneTime = oneTimeShippingLabel(policy);

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-sm)] bg-subtle text-text-secondary",
        size === "sm" ? "px-2 py-1.5 text-[13px]" : "px-3 py-2.5 text-sm",
        className,
      )}
    >
      <Truck
        className={cn(
          "mt-0.5 shrink-0 text-text-brand",
          size === "sm" ? "size-4" : "size-5",
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      {subscription ? (
        <span className="flex flex-col gap-0.5">
          <strong className="font-semibold text-success-strong">{subscription}</strong>
          <span>En compra única: {oneTime}</span>
        </span>
      ) : (
        <span>
          Envío <strong className="font-semibold text-text-primary">{oneTime}</strong>
        </span>
      )}
    </div>
  );
}
