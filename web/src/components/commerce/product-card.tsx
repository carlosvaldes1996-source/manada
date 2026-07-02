"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCw, ShoppingBag } from "lucide-react";
import type { Product, ShippingEstimate } from "@/types";
import { discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers";
import { useToast } from "@/components/ui/toast";
import { DiscountBadge, SubscriptionBadge } from "./badges";
import { HonestShippingBlock } from "./honest-shipping-block";

export interface ProductCardProps {
  product: Product;
  /** Estimación de despacho honesto (siempre visible si se provee). */
  shipping?: ShippingEstimate;
  /** Muestra el CTA de suscripción junto a "Agregar" (si el producto la admite). */
  showSubscribe?: boolean;
  className?: string;
}

/**
 * Tarjeta de producto — unidad central del catálogo (DESIGN_SYSTEM §12.1).
 * Packshot sobre Arena · badge de suscripción · marca/nombre · rating · precio ·
 * despacho honesto · CTAs (Agregar + Suscribir). Conecta con el carrito y emite
 * un toast al agregar. El media es emoji placeholder hasta tener packshots.
 */
export function ProductCard({ product, shipping, showSubscribe = true, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const href = `/producto/${product.slug}`;
  const discount = discountPercent(product.price.current, product.price.compareAt);
  const soldOut = product.stock <= 0;

  function add(subscribe = false) {
    addItem(product, subscribe ? { subscriptionWeeks: 4 } : undefined);
    toast({
      title: subscribe ? `Suscripción iniciada` : `Agregado al carrito`,
      description: `${product.brand.name} · ${product.name}`,
      variant: "success",
      action: { label: "Ver carrito", onClick: () => (window.location.href = "/carrito") },
    });
  }

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface shadow-sm transition-[transform,box-shadow] duration-[var(--duration-standard)] hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <Link
        href={href}
        className="relative grid aspect-square place-items-center bg-gradient-to-b from-canvas to-subtle"
        aria-hidden
      >
        {/* Placeholder cálido (packshot real pendiente, U090): emoji grande con
            sombra de contacto para que no se vea como una caja vacía. */}
        <span className="text-[5.5rem] drop-shadow-[0_12px_16px_rgba(42,39,34,0.12)] transition-transform duration-[var(--duration-standard)] group-hover:scale-105">
          {product.imageUrl ?? "📦"}
        </span>
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {product.subscribable && <SubscriptionBadge discount={product.subscriptionDiscount} />}
          {discount > 0 && <DiscountBadge percent={discount} />}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="overline text-text-secondary">{product.brand.name}</span>
        <h3 className="text-[15px] leading-snug font-semibold text-text-primary">
          <Link href={href} className="hover:text-text-brand">
            {product.name}
          </Link>
          {product.format && <span className="font-normal text-text-secondary"> · {product.format}</span>}
        </h3>
        {product.rating && <Rating value={product.rating.value} count={product.rating.count} />}
        <Price now={product.price.current} was={product.price.compareAt} size="md" className="mt-0.5" />

        {shipping && <HonestShippingBlock date={shipping.date} cost={shipping.cost} comuna={shipping.comuna} className="mt-1" />}

        <div className="mt-auto flex gap-2 pt-3">
          <Button
            size="sm"
            block
            onClick={() => add(false)}
            disabled={soldOut}
            leadingIcon={<ShoppingBag className="size-4" aria-hidden />}
          >
            {soldOut ? "Agotado" : "Agregar"}
          </Button>
          {showSubscribe && product.subscribable && !soldOut && (
            <Button
              size="sm"
              variant="subscribe"
              aria-label="Suscribir"
              onClick={() => add(true)}
            >
              <RefreshCw className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
