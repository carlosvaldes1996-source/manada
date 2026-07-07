"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, ShoppingBag, Truck } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CartItem,
  FreeShippingBar,
  OrderSummary,
  ProductRail,
} from "@/components/commerce";
import { useCart, usePet } from "@/components/providers";
import { effectiveSubscriptionPrice, formatCLP } from "@/lib/format";
import { getShippingPolicy, listProducts, type ShippingPolicy } from "@/lib/medusa";
import type { Product } from "@/types";

/**
 * Carrito.
 *
 * Decisiones de IA (AUDIT_UI_UX):
 * - U042: la barra de envío gratis usa el subtotal real del carrito.
 * - U050: el ahorro por suscripción se celebra (verde, línea propia).
 * - U051: las líneas se agrupan en "Se repite" vs "Compra única".
 * - U052: un ÚNICO bloque de cross-sell, al final y discreto, RELEVANTE a la
 *   mascota activa (no ofrecer comida de gato a un dueño de perro).
 *
 * Etapa B: envío desde la política REAL del backend (una sola regla, sin duplicar)
 * y cross-sell con productos REALES del catálogo (Store API).
 */
export default function CarritoPage() {
  const { items, updateQuantity, removeItem } = useCart();
  const { activePet } = usePet();
  const router = useRouter();

  const [policy, setPolicy] = useState<ShippingPolicy | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);

  // Política de envío (fuente única = backend) + catálogo real para el cross-sell.
  useEffect(() => {
    let active = true;
    Promise.all([getShippingPolicy(), listProducts({ limit: 24 })])
      .then(([p, products]) => {
        if (!active) return;
        setPolicy(p);
        setCatalog(products);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Precio efectivo (con descuento de suscripción del backend) y ahorro por línea.
  const effective = (i: (typeof items)[number]) =>
    i.subscriptionWeeks ? effectiveSubscriptionPrice(i.product) : i.product.price.current;

  const regularSubtotal = items.reduce((s, i) => s + i.product.price.current * i.quantity, 0);
  const savings = items.reduce((s, i) => s + (i.product.price.current - effective(i)) * i.quantity, 0);
  const paySubtotal = regularSubtotal - savings;
  // Estimación coherente con el backend: gratis sobre el umbral, si no el costo base.
  // El cobro definitivo lo confirma el checkout con las opciones reales de Medusa.
  const shippingCost = policy ? (paySubtotal >= policy.freeShippingThreshold ? 0 : policy.baseShippingAmount) : undefined;

  const subscriptionLines = items.filter((i) => i.subscriptionWeeks);
  const oneTimeLines = items.filter((i) => !i.subscriptionWeeks);

  const related = catalog
    .filter(
      (p) =>
        !items.some((i) => i.product.id === p.id) &&
        (!activePet || p.species.includes(activePet.species)),
    )
    .slice(0, 6);

  if (items.length === 0) {
    return (
      <Section spacing="lg">
        <EmptyState
          icon={<span className="text-5xl">🛍️</span>}
          title="Tu carrito está vacío"
          description="Cuando agregues productos, los verás aquí. Nosotros te avisamos antes de que se acaben."
          action={
            <Button asChild>
              <Link href="/categoria/todo">Ir a la tienda</Link>
            </Button>
          }
        />
      </Section>
    );
  }

  return (
    <Section spacing="md">
      <Stack gap={6}>
        <h1 className="heading-1 text-text-primary">Tu carrito</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <Stack gap={6}>
            {/* Líneas recurrentes (U051) */}
            {subscriptionLines.length > 0 && (
              <Stack gap={3}>
                <Row gap={2}>
                  <Badge variant="subscribe">
                    <RefreshCw className="size-3.5" aria-hidden />
                    Se repite automáticamente
                  </Badge>
                </Row>
                <Stack gap={3}>
                  {subscriptionLines.map((line) => (
                    <CartItem
                      key={line.product.id}
                      line={line}
                      onQuantityChange={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </Stack>
              </Stack>
            )}

            {/* Líneas de compra única (U051) */}
            {oneTimeLines.length > 0 && (
              <Stack gap={3}>
                <Row gap={2}>
                  <Badge variant="neutral">
                    <ShoppingBag className="size-3.5" aria-hidden />
                    Compra única
                  </Badge>
                </Row>
                <Stack gap={3}>
                  {oneTimeLines.map((line) => (
                    <CartItem
                      key={line.product.id}
                      line={line}
                      onQuantityChange={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>

          {/* Resumen + envío gratis */}
          <Stack gap={4}>
            {policy && <FreeShippingBar subtotal={paySubtotal} threshold={policy.freeShippingThreshold} />}
            <OrderSummary
              subtotal={regularSubtotal}
              savings={savings}
              shipping={shippingCost}
              note="Los precios incluyen IVA. El costo final de despacho lo confirmas al pagar."
            >
              <Button block size="lg" onClick={() => router.push("/checkout")}>
                Ir a pagar
              </Button>
              <Button variant="ghost" block asChild>
                <Link href="/categoria/todo">Seguir comprando</Link>
              </Button>
            </OrderSummary>

            {/* Reaseguros de confianza (vale para todo carrito, clave en la 1ª compra) */}
            <Stack gap={2} className="rounded-[var(--radius-md)] border border-border-default bg-surface p-4 text-[13px] text-text-secondary">
              <Row gap={2} align="start">
                <Truck className="mt-0.5 size-4 shrink-0 text-text-brand" aria-hidden />
                Despacho honesto: ves el costo real antes de pagar y es gratis sobre {policy ? formatCLP(policy.freeShippingThreshold) : "cierto monto"}.
              </Row>
              <Row gap={2} align="start">
                <RefreshCw className="mt-0.5 size-4 shrink-0 text-miel-700" aria-hidden />
                Las suscripciones no tienen permanencia: pausa o cancela cuando quieras.
              </Row>
            </Stack>
          </Stack>
        </div>

        {/* Cross-sell único y discreto (U052) */}
        {related.length > 0 && (
          <ProductRail
            overline="Quizás falta algo"
            title="Completa tu pedido"
            products={related}
          />
        )}
      </Stack>
    </Section>
  );
}
