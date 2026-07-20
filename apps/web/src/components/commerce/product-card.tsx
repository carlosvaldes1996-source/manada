"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCw, ShoppingBag } from "lucide-react";
import type { Product } from "@/types";
import { discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Price } from "@/components/ui/price";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers";
import { useToast } from "@/components/ui/toast";
import { DiscountBadge, StockBadge, SubscriptionBadge } from "./badges";
import { ProductImage } from "./product-image";

export interface ProductCardProps {
  product: Product;
  /** Muestra el CTA de suscripción junto a "Agregar" (si el producto la admite). */
  showSubscribe?: boolean;
  className?: string;
}

/**
 * Tarjeta de producto — unidad central del catálogo (DESIGN_SYSTEM §12.1).
 * Packshot sobre Arena · badge de suscripción · marca/nombre · precio · CTAs
 * (Agregar + Suscribir). Conecta con el carrito y emite un toast al agregar.
 * El media es emoji placeholder hasta tener packshots.
 *
 * (Etapa B) No muestra fecha/costo de despacho por tarjeta —el envío es manual y
 * sin fecha por comuna todavía; la política honesta ("gratis sobre $X") vive en
 * la PDP y el carrito. Rating oculto hasta tener reseñas reales.
 */
export function ProductCard({ product, showSubscribe = true, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const href = `/producto/${product.slug}`;
  const discount = discountPercent(product.price.current, product.price.compareAt);
  const soldOut = product.stock <= 0;

  // Formatos: cuando hay más de uno, la tarjeta no fija un formato "por defecto"
  // (confunde: parece el único) — muestra "Varios formatos" y el precio "desde" el
  // más barato. `variants` viene ordenado ascendente por precio (map-product.ts).
  const variantCount = product.variants?.length ?? (product.format ? 1 : 0);
  const multiFormat = variantCount > 1;
  const fromPrice = multiFormat
    ? product.variants?.[0]?.price.current ?? product.price.current
    : product.price.current;

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
        "group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface shadow-sm transition-[transform,box-shadow] duration-[var(--duration-standard)] hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <Link
        href={href}
        className="relative grid aspect-square place-items-center bg-gradient-to-b from-canvas to-subtle"
        aria-hidden
      >
        {/* Foto real del Admin si existe; si no, emoji placeholder cálido (U090)
            con sombra de contacto para que no se vea como una caja vacía. La foto
            va normalizada (fill, sin padding): el encuadre uniforme lo da el
            packshot (`/api/packshot`), no un padding por card. */}
        <ProductImage
          image={product.imageUrl}
          alt={`${product.brand.name} ${product.name}`}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="transition-transform duration-[var(--duration-standard)] group-hover:scale-105"
          emojiClassName="text-[5.5rem] drop-shadow-[0_12px_16px_rgba(42,39,34,0.12)] transition-transform duration-[var(--duration-standard)] group-hover:scale-105"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {/* Stock en la tarjeta SOLO como urgencia honesta: "¡Quedan X!" (≤5) o
              "Agotado" (0). Con stock normal no se muestra nada (catálogo limpio). */}
          {product.stock <= 5 && <StockBadge stock={product.stock} />}
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
          {!multiFormat && product.format && (
            <span className="font-normal text-text-secondary"> · {product.format}</span>
          )}
        </h3>
        {multiFormat && (
          <span className="text-[13px] text-text-secondary">Varios formatos</span>
        )}
        <span className="mt-0.5 inline-flex items-baseline gap-1.5">
          {multiFormat && <span className="text-[13px] text-text-secondary">desde</span>}
          <Price
            now={fromPrice}
            was={multiFormat ? undefined : product.price.compareAt}
            size="md"
          />
        </span>

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
