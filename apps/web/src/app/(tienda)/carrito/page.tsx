"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, ShoppingBag } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CartItem,
  FreeShippingBar,
  OrderSummary,
  ProductRail,
  ShippingPolicyNote,
} from "@/components/commerce";
import { useCart, usePet } from "@/components/providers";
import { effectiveSubscriptionPrice } from "@/lib/format";
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
  const { items, updateQuantity, removeItem, isLoading, isSyncing } = useCart();
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

  const subscriptionLines = items.filter((i) => i.subscriptionWeeks);
  const oneTimeLines = items.filter((i) => !i.subscriptionWeeks);

  // Las DOS ramas de la política, en el mismo orden en que las evalúa el backend
  // (promociones `ENVIO_GRATIS_SUSCRIPCION` y `ENVIO_GRATIS_30K`): con suscripción
  // el despacho va incluido sin monto mínimo; si no, decide el umbral. El cobro
  // definitivo lo confirma el checkout con las opciones reales de Medusa.
  const includedBySubscription = Boolean(policy?.subscriptionFreeShipping) && subscriptionLines.length > 0;
  const shippingCost = policy
    ? includedBySubscription || paySubtotal >= policy.freeShippingThreshold
      ? 0
      : policy.baseShippingAmount
    : undefined;

  const related = catalog
    .filter(
      (p) =>
        !items.some((i) => i.product.id === p.id) &&
        (!activePet || p.species.includes(activePet.species)),
    )
    .slice(0, 6);

  // Sin líneas hay DOS estados distintos y solo uno es "vacío": mientras se hidrata
  // el carrito persistido (`isLoading`) o mientras un alta viaja al backend
  // (`isSyncing`, p. ej. al llegar desde la recomendación) todavía no sabemos qué
  // hay. Anunciar "tu carrito está vacío" ahí es decir algo falso durante un par de
  // segundos: se muestra el esqueleto de las líneas que están por aparecer.
  if (items.length === 0 && (isLoading || isSyncing)) {
    return <CartSkeleton />;
  }

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
                      key={line.lineId}
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
                      key={line.lineId}
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
            {policy && (
              <FreeShippingBar
                subtotal={paySubtotal}
                threshold={policy.freeShippingThreshold}
                includedBySubscription={includedBySubscription}
              />
            )}
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

            {/* Reaseguro de confianza (vale para todo carrito, clave en la 1ª compra).
                Misma nota que la ficha de producto: la regla se cuenta una sola vez
                y con las mismas palabras en todo el sitio. */}
            {policy && <ShippingPolicyNote policy={policy} size="md" />}
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

/**
 * Carrito aún desconocido: mismo esqueleto que la página real (una línea + el
 * resumen) para que al llegar el dato no se mueva nada. Un placeholder cálido,
 * nunca un mensaje que afirme lo que todavía no sabemos.
 */
function CartSkeleton() {
  return (
    <Section spacing="md">
      <Stack gap={6}>
        <h1 className="heading-1 text-text-primary">Tu carrito</h1>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <Stack gap={3}>
            <Skeleton shape="text" className="w-40" />
            <Row
              gap={4}
              align="start"
              className="rounded-[var(--radius-lg)] border border-border-default bg-surface p-4"
            >
              <Skeleton className="size-20 shrink-0" />
              <Stack gap={2} className="min-w-0 flex-1">
                <Skeleton shape="text" className="w-1/4" />
                <Skeleton shape="text" className="w-3/4" />
                <Skeleton shape="text" className="mt-1 h-6 w-1/3" />
              </Stack>
            </Row>
          </Stack>
          <Stack gap={4}>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-44 w-full" />
          </Stack>
        </div>
      </Stack>
    </Section>
  );
}
