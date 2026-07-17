"use client";

/**
 * PREVIEW DE DISEÑO de la card "Plan Manada" (D48). OCULTA por defecto en la PDP
 * (gate `SHOW_PLAN_MANADA_PREVIEW=false` en product-view.tsx).
 *
 * Suscripciones apagadas (D29, SUBSCRIPTIONS_ENABLED=false): esta card es SOLO
 * una maqueta de diseño para evaluar la PDP. No tiene lógica de suscripción, no
 * toca backend/carrito/checkout, y su CTA es inerte ("Próximamente"). Los números
 * de ahorro son un placeholder de demo, no un cálculo real del backend. Se
 * mantiene como material para el bloque de suscripción futuro.
 */

import { CalendarCheck, Check } from "lucide-react";
import { Stack, Row } from "@/components/ui/stack";
import { formatCLP } from "@/lib/format";
import type { Product } from "@/types";

/** Descuento de DEMO, solo para la maqueta (no viene del backend). */
const DEMO_DISCOUNT_PCT = 12;

export function PlanManadaPreview({ product }: { product: Product }) {
  const base = product.price.current;
  const subPrice = Math.round(base * (1 - DEMO_DISCOUNT_PCT / 100));
  const savings = base - subPrice;

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
          <span className="price text-2xl text-terracota-600">{formatCLP(subPrice)}</span>
        </Row>

        <Stack gap={2}>
          {[
            "Envío automático antes que se acabe",
            `Ahorras ${formatCLP(savings)} por saco`,
            "Modifica o cancela con un click",
          ].map((line) => (
            <Row key={line} gap={2} align="center" className="text-[15px] text-text-secondary">
              <Check className="size-4 shrink-0 text-terracota-600" aria-hidden />
              {line}
            </Row>
          ))}
        </Stack>

        {/* CTA inerte: suscripciones aún apagadas (D29). No ejecuta nada. */}
        <button
          type="button"
          aria-disabled="true"
          title="Próximamente"
          onClick={(e) => e.preventDefault()}
          className="inline-flex h-[52px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-terracota-500 px-7 text-base font-semibold text-white"
        >
          Suscribirme (Ahorra {DEMO_DISCOUNT_PCT}%)
        </button>
        <p className="text-center text-[13px] text-text-muted">
          Próximamente — vista previa del diseño, aún no disponible.
        </p>
      </Stack>
    </div>
  );
}
