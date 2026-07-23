"use client";

/**
 * Card "Plan Manada" (D48 diseño · D55 cableada) — el patrón ÚNICO de suscripción
 * en la PDP (D55 retira el `SubscriptionBox` toggle). Es la vía de compra
 * RECURRENTE: el usuario elige frecuencia y el CTA agrega la línea al carrito con
 * la metadata de suscripción (`is_subscription` + `frequency_weeks`), que viaja
 * hasta la orden, donde un subscriber crea la suscripción real (pago manual en el
 * Punto 1; el cobro recurrente es un bloque posterior).
 *
 * Los números (precio suscrito, ahorro, %) son REALES: `subscriptionPrice` lo
 * calcula el backend (middlewares.ts) y llega en el producto; el front no recalcula
 * el descuento. La "Compra única" vive aparte, bajo esta card.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Check, RefreshCw } from "lucide-react";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/components/providers";
import { SUBSCRIPTION_FREQUENCIES } from "@/hooks/use-subscription";
import { effectiveSubscriptionPrice, formatCLP } from "@/lib/format";
import type { Product, SubscriptionFrequencyWeeks } from "@/types";

export function PlanManadaCard({
  product,
  defaultFrequencyWeeks = 4,
}: {
  product: Product;
  /** Frecuencia natural sugerida (derivada de cuánto dura el saco). */
  defaultFrequencyWeeks?: SubscriptionFrequencyWeeks;
}) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [frequency, setFrequency] = useState<SubscriptionFrequencyWeeks>(defaultFrequencyWeeks);

  const base = product.price.current;
  const subPrice = effectiveSubscriptionPrice(product);
  const savings = base - subPrice;
  const discountPct = product.subscriptionDiscount ?? 0;

  const freqLabel =
    SUBSCRIPTION_FREQUENCIES.find((f) => f.weeks === frequency)?.label ?? `Cada ${frequency} semanas`;

  function subscribe() {
    addItem(product, { subscriptionWeeks: frequency });
    toast({
      title: "Suscripción agregada al carrito",
      description: `${product.name} · ${freqLabel.toLowerCase()}`,
      variant: "success",
      action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
    });
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
          onValueChange={(v) => setFrequency(Number(v) as SubscriptionFrequencyWeeks)}
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
