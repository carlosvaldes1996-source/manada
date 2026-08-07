"use client";

import Link from "next/link";
import { useCart } from "@/components/providers";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCLP } from "@/lib/format";
import type { ShippingPolicy } from "@/lib/medusa";
import { CartItem } from "./cart-item";
import { FreeShippingBar } from "./free-shipping-bar";

export interface CartDrawerProps {
  children: React.ReactNode;
  /**
   * Política de envío completa. Sin valor por defecto A PROPÓSITO: la regla la
   * define el backend (`GET /store/shipping-policy` → `getShippingPolicy()`) y
   * duplicarla aquí como constante la dejaría desincronizada en silencio el día
   * que cambie. Quien monte el drawer pasa la política.
   */
  policy: ShippingPolicy;
}

/**
 * Drawer lateral del carrito (DESIGN_SYSTEM §11) — se abre desde el botón de
 * carrito. Lista las líneas, muestra el progreso a envío gratis y el subtotal,
 * con CTA a checkout. Conectado al estado global del carrito.
 */
export function CartDrawer({ children, policy }: CartDrawerProps) {
  const { items, count, subtotal, updateQuantity, removeItem } = useCart();

  // Con una línea de suscripción el despacho va incluido: el umbral no aplica.
  const includedBySubscription =
    policy.subscriptionFreeShipping && items.some((i) => i.subscriptionWeeks);

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent
        side="right"
        title={`Tu carrito${count > 0 ? ` (${count})` : ""}`}
        footer={
          items.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Subtotal</span>
                <span className="price text-lg text-text-primary">{formatCLP(subtotal)}</span>
              </div>
              <DrawerClose asChild>
                <Button asChild block size="lg">
                  <Link href="/checkout">Ir a pagar</Link>
                </Button>
              </DrawerClose>
              <DrawerClose asChild>
                <Button asChild variant="ghost" block>
                  <Link href="/carrito">Ver carrito completo</Link>
                </Button>
              </DrawerClose>
            </div>
          ) : undefined
        }
      >
        {items.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="Tu carrito está vacío"
            description="Cuando agregues productos, aparecerán aquí."
            action={
              <DrawerClose asChild>
                <Button asChild>
                  <Link href="/categoria/todo">Explorar catálogo</Link>
                </Button>
              </DrawerClose>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            <FreeShippingBar
              subtotal={subtotal}
              threshold={policy.freeShippingThreshold}
              includedBySubscription={includedBySubscription}
            />
            <div>
              {items.map((line) => (
                <CartItem
                  key={line.lineId}
                  line={line}
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
