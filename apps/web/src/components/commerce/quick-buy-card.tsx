"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { useCart } from "@/components/providers";
import { useToast } from "@/components/ui/toast";
import { ProductImage } from "./product-image";

export interface QuickBuyCardProps {
  product: Product;
  className?: string;
}

/**
 * Fila de recompra rápida ("lo de siempre"): miniatura + nombre + precio +
 * Agregar, en una sola línea. Para productos que el usuario ya conoce — no
 * vende, repone: la compra queda a dos clics sin pasar por el catálogo.
 */
export function QuickBuyCard({ product, className }: QuickBuyCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const soldOut = product.stock <= 0;
  const href = `/producto/${product.slug}`;

  function add() {
    addItem(product);
    toast({
      title: "Agregado al carrito",
      description: `${product.brand.name} · ${product.name}`,
      variant: "success",
      action: { label: "Ver carrito", onClick: () => (window.location.href = "/carrito") },
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface p-3 pr-4 shadow-sm sm:max-w-xl",
        className,
      )}
    >
      <Link
        href={href}
        aria-hidden
        tabIndex={-1}
        className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] bg-gradient-to-b from-canvas to-subtle"
      >
        <ProductImage
          image={product.imageUrl}
          alt={`${product.brand.name} ${product.name}`}
          imgClassName="p-1"
          emojiClassName="text-3xl"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <span className="overline text-text-secondary">{product.brand.name}</span>
        <p className="truncate text-[15px] leading-snug font-semibold text-text-primary">
          <Link href={href} className="hover:text-text-brand">
            {product.name}
          </Link>
          {product.format && (
            <span className="font-normal text-text-secondary"> · {product.format}</span>
          )}
        </p>
        <Price now={product.price.current} was={product.price.compareAt} size="sm" />
      </div>
      <Button
        size="sm"
        onClick={add}
        disabled={soldOut}
        leadingIcon={<ShoppingBag className="size-4" aria-hidden />}
      >
        {soldOut ? "Agotado" : "Agregar"}
      </Button>
    </div>
  );
}
