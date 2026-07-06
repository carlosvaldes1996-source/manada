"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import type { CartItem as CartLine } from "@/types";
import { formatCLP, effectiveSubscriptionPrice } from "@/lib/format";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

export interface CartItemProps {
  line: CartLine;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  /** Compacto (drawer) vs. completo (página de carrito). */
  compact?: boolean;
  className?: string;
}

/** Precio unitario efectivo (usa el precio de suscripción del backend si la línea lo es). */
function unitPrice(line: CartLine): number {
  if (line.subscriptionWeeks) {
    return effectiveSubscriptionPrice(line.product);
  }
  return line.product.price.current;
}

/**
 * Línea de carrito: media + nombre/marca + (badge suscripción) + cantidad +
 * subtotal + eliminar. Reutilizable en la página de carrito y en el drawer.
 */
export function CartItem({ line, onQuantityChange, onRemove, compact = false, className }: CartItemProps) {
  const { product } = line;
  const unit = unitPrice(line);

  return (
    <div className={cn("flex gap-3 border-b border-border-default py-4 last:border-0", className)}>
      <div className={cn("grid shrink-0 place-items-center rounded-[var(--radius-md)] bg-canvas", compact ? "size-14 text-2xl" : "size-16 text-3xl")} aria-hidden>
        {product.imageUrl ?? "📦"}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="overline text-text-secondary">{product.brand.name}</p>
            <p className="truncate text-[15px] font-semibold text-text-primary">{product.name}</p>
            {product.format && <p className="text-[13px] text-text-muted">{product.format}</p>}
          </div>
          <IconButton label={`Quitar ${product.name}`} size="sm" onClick={() => onRemove(product.id)}>
            <Trash2 className="size-4" aria-hidden />
          </IconButton>
        </div>

        {line.subscriptionWeeks && (
          <Badge variant="subscribe" icon={<RefreshCw className="size-3.5" aria-hidden />}>
            Suscripción · cada {line.subscriptionWeeks} sem.
          </Badge>
        )}

        <div className="mt-1 flex items-center justify-between">
          <QuantitySelector
            value={line.quantity}
            onChange={(q) => onQuantityChange(product.id, q)}
            size="sm"
            label={`Cantidad de ${product.name}`}
          />
          <span className="price text-[15px] text-text-primary">{formatCLP(unit * line.quantity)}</span>
        </div>
      </div>
    </div>
  );
}
