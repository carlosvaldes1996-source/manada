"use client";

/**
 * Hoja de confirmación post-"Suscribirme" (D56 · Bloque B). Reemplaza el salto
 * inmediato al carrito: explica QUÉ se armó (producto, frecuencia, precio/entrega,
 * ahorro), que el 1er envío se activa al completar la compra, y el beneficio del
 * plan (pausa/cambia/cancela cuando quieras). Deja decidir: seguir viendo o ir al
 * carrito. Sin empujar al checkout.
 *
 * Reutiliza el <Dialog> existente (centrado, responsive: 92vw en móvil). El estado
 * y el alta al carrito los orquesta `SubscribeFlowProvider` (un único flujo para
 * PDP y catálogo); esta hoja es solo presentación.
 */

import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck, ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stack, Row } from "@/components/ui/stack";
import { effectiveSubscriptionPrice, formatCLP } from "@/lib/format";
import { SUBSCRIPTION_FREQUENCIES } from "@/hooks/use-subscription";
import type { Product, SubscriptionFrequencyWeeks } from "@/types";

export interface SubscribeConfirmDetails {
  product: Product;
  frequency: SubscriptionFrequencyWeeks;
}

export function SubscribeConfirmSheet({
  open,
  onOpenChange,
  details,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: SubscribeConfirmDetails | null;
}) {
  const router = useRouter();
  if (!details) return null;

  const { product, frequency } = details;
  const subPrice = effectiveSubscriptionPrice(product);
  const savings = product.price.current - subPrice;
  const freqLabel =
    SUBSCRIPTION_FREQUENCIES.find((f) => f.weeks === frequency)?.label ?? `Cada ${frequency} semanas`;

  function goToCart() {
    onOpenChange(false);
    router.push("/carrito");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-success-strong">
            <CheckCircle2 className="size-4" aria-hidden />
            Plan armado
          </span>
          <DialogTitle>Tu Plan Manada está listo</DialogTitle>
          <DialogDescription>
            Lo agregamos a tu carrito. Tu primer envío se activa al completar la compra.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface p-4">
          <Stack gap={3}>
            <Stack gap={1}>
              <span className="overline text-text-secondary">{product.brand.name}</span>
              <span className="text-[15px] font-semibold text-text-primary">
                {product.name}
                {product.format ? ` · ${product.format}` : ""}
              </span>
            </Stack>
            <div className="h-px bg-border-default" />
            <Row justify="between" align="center" gap={3}>
              <span className="text-sm text-text-secondary">Frecuencia</span>
              <span className="text-sm font-semibold text-text-primary">{freqLabel}</span>
            </Row>
            <Row justify="between" align="center" gap={3}>
              <span className="text-sm text-text-secondary">Precio por entrega</span>
              <Row gap={2} align="center">
                {savings > 0 && <Badge variant="subscribe">Ahorras {formatCLP(savings)}</Badge>}
                <span className="price text-lg text-text-primary">{formatCLP(subPrice)}</span>
              </Row>
            </Row>
          </Stack>
        </div>

        <p className="mt-4 inline-flex items-center gap-2 text-[13px] text-text-secondary">
          <ShieldCheck className="size-4 text-[var(--success)]" aria-hidden />
          Pausa, cambia o cancela cuando quieras, sin costo.
        </p>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Seguir viendo
          </Button>
          <Button onClick={goToCart} leadingIcon={<ShoppingBag className="size-4" aria-hidden />}>
            Ir al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
