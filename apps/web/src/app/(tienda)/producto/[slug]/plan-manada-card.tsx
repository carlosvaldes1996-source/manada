"use client";

/**
 * Card "Plan Manada" (D48 diseño · D55 cableada) — el patrón de suscripción en la
 * PDP. Es la vía de compra RECURRENTE: elegir frecuencia + suscribir.
 *
 * COMPONENTE CONTROLADO (Bloque A del rediseño de suscripción): NO tiene estado
 * propio. El formato (vía `product`) y la `frequency` viven en la PDP —una sola
 * fuente de verdad, igual que la compra única— así que al cambiar de formato TODO
 * se recalcula solo (precio suscrito, ahorro, %, y la frecuencia natural que
 * re-deriva la página). Esta card es puro render.
 *
 * Los números son REALES: `subscriptionPrice` lo calcula el backend
 * (middlewares.ts) y llega en el producto; el front no recalcula el descuento.
 */

import { CalendarCheck, Check, RefreshCw } from "lucide-react";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useSubscribeFlow } from "@/components/providers";
import { SUBSCRIPTION_FREQUENCIES } from "@/hooks/use-subscription";
import { effectiveSubscriptionPrice, formatCLP } from "@/lib/format";
import type { Product, SubscriptionFrequencyWeeks } from "@/types";

export function PlanManadaCard({
  product,
  frequency,
  onFrequencyChange,
}: {
  product: Product;
  /** Frecuencia elegida — la posee la PDP (fuente única, reactiva al formato). */
  frequency: SubscriptionFrequencyWeeks;
  onFrequencyChange: (weeks: SubscriptionFrequencyWeeks) => void;
}) {
  const subscribeFlow = useSubscribeFlow();

  // Todo derivado del `product` (= variante seleccionada): reactivo por definición.
  const base = product.price.current;
  const subPrice = effectiveSubscriptionPrice(product);
  const savings = base - subPrice;
  const discountPct = product.subscriptionDiscount ?? 0;

  function subscribe() {
    // Flujo único (D56 · Bloque B): agrega al carrito + abre la hoja de confirmación.
    subscribeFlow.start(product, frequency);
  }

  return (
    <div className="relative rounded-[var(--radius-xl)] border-[1.5px] border-terracota-400 bg-surface p-5 pt-6">
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-[var(--radius-pill)] bg-miel-400 px-3 py-1 text-[12px] font-semibold text-neutral-800 shadow-sm">
        Recomendado: Suscripción
      </span>

      <Stack gap={4}>
        <Row justify="between" align="center" gap={3} wrap>
          <Row gap={2} align="center">
            <CalendarCheck className="size-5 text-terracota-600" aria-hidden />
            <span className="text-lg font-semibold text-text-primary">Plan Manada</span>
          </Row>
          <Row gap={2} align="center">
            {savings > 0 && <Badge variant="subscribe">Ahorras {formatCLP(savings)}</Badge>}
            <span className="price text-2xl text-terracota-600">{formatCLP(subPrice)}</span>
          </Row>
        </Row>

        <Stack gap={2}>
          {[
            "Envío automático antes de que se le acabe",
            savings > 0 ? `Ahorras ${formatCLP(savings)} en cada entrega` : "Precio preferente en cada entrega",
            "Modifica o cancela cuando quieras, sin costo",
          ].map((line) => (
            <Row key={line} gap={2} align="center" className="text-[15px] text-text-secondary">
              <Check className="size-4 shrink-0 text-terracota-600" aria-hidden />
              {line}
            </Row>
          ))}
        </Stack>

        <Select
          label="Frecuencia de entrega"
          options={SUBSCRIPTION_FREQUENCIES.map((f) => ({ value: String(f.weeks), label: f.label }))}
          value={String(frequency)}
          onValueChange={(v) => onFrequencyChange(Number(v) as SubscriptionFrequencyWeeks)}
        />

        <Button
          size="lg"
          block
          onClick={subscribe}
          leadingIcon={<RefreshCw className="size-4" aria-hidden />}
        >
          {discountPct > 0 ? `Suscribirme (ahorra ${discountPct}%)` : "Suscribirme"}
        </Button>
      </Stack>
    </div>
  );
}
