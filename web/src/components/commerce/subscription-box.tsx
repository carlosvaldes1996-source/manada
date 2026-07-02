"use client";

import { RefreshCw } from "lucide-react";
import type { Product } from "@/types";
import { formatCLP } from "@/lib/format";
import { useSubscription, SUBSCRIPTION_FREQUENCIES } from "@/hooks/use-subscription";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SubscriptionBoxProps {
  product: Product;
  /** Controlador externo opcional (para compartir estado con el CTA de la PDP). */
  controller?: ReturnType<typeof useSubscription>;
  className?: string;
}

/**
 * Caja de suscripción de la PDP (DESIGN_SYSTEM §11). Acento Miel. Permite
 * activar la entrega recurrente, elegir frecuencia y ver el ahorro. El estado
 * puede inyectarse desde la página para sincronizar el precio del CTA.
 */
export function SubscriptionBox({ product, controller, className }: SubscriptionBoxProps) {
  // Se permite llamar siempre al hook; si llega controller, se usa ese estado.
  const internal = useSubscription(product);
  const sub = controller ?? internal;

  if (!product.subscribable) return null;

  return (
    <div className={cn("rounded-[var(--radius-lg)] border-[1.5px] border-miel-400 bg-accent-soft p-4", className)}>
      <Switch
        checked={sub.isSubscribed}
        onCheckedChange={sub.setIsSubscribed}
        label={
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="size-4 text-miel-700" aria-hidden />
            Suscríbete y ahorra
          </span>
        }
        description={`Recibe ${product.name} automáticamente y ahorra ${sub.discountPct}% en cada entrega.`}
      />

      {sub.isSubscribed && (
        <div className="mt-4 flex flex-col gap-3 border-t border-miel-200 pt-4">
          <Select
            label="Frecuencia de entrega"
            options={SUBSCRIPTION_FREQUENCIES.map((f) => ({ value: String(f.weeks), label: f.label }))}
            value={String(sub.frequency)}
            onValueChange={(v) => sub.setFrequency(Number(v) as typeof sub.frequency)}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Precio suscrito</span>
            <span className="flex items-center gap-2">
              <Badge variant="subscribe">Ahorras {formatCLP(sub.savings)}</Badge>
              <span className="price text-lg text-text-primary">{formatCLP(sub.subscribedPrice)}</span>
            </span>
          </div>
          <p className="text-[13px] text-text-muted">Sin permanencia: pausa o cancela cuando quieras.</p>
        </div>
      )}
    </div>
  );
}
