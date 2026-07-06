import { CheckCircle2, RefreshCw, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDeliveryDate, formatShippingCost } from "@/lib/format";

/**
 * Badges de e-commerce — átomos especializados sobre <Badge> con la semántica
 * correcta de la marca. Cada uno acompaña color con ícono + texto (a11y §13).
 */

export interface StockBadgeProps {
  stock: number;
  /** Umbral bajo el cual se muestra "quedan pocas" (urgencia honesta). */
  lowThreshold?: number;
}

/** Disponibilidad: agotado / pocas unidades / en stock. */
export function StockBadge({ stock, lowThreshold = 5 }: StockBadgeProps) {
  if (stock <= 0) return <Badge variant="error">Agotado</Badge>;
  if (stock <= lowThreshold)
    return <Badge variant="urgency">¡Quedan {stock}!</Badge>;
  return (
    <Badge variant="success" icon={<CheckCircle2 className="size-3.5" aria-hidden />}>
      En stock
    </Badge>
  );
}

export interface DiscountBadgeProps {
  /** % de descuento (entero positivo). */
  percent: number;
}

/** Descuento porcentual — sobrio, sin gritar (la marca no es de ofertas, §3.6). */
export function DiscountBadge({ percent }: DiscountBadgeProps) {
  if (percent <= 0) return null;
  return <Badge variant="brand">−{percent}%</Badge>;
}

export interface ShippingBadgeProps {
  date?: Date;
  cost?: number;
  comuna?: string;
}

/**
 * Despacho honesto en formato compacto (badge). Para el bloque completo y
 * siempre-visible de la PDP usar <HonestShippingBlock>.
 */
export function ShippingBadge({ date, cost, comuna }: ShippingBadgeProps) {
  const parts: string[] = [];
  if (date) parts.push(`Llega ${formatDeliveryDate(date)}`);
  if (comuna) parts.push(`a ${comuna}`);
  const label = parts.join(" ") || "Despacho a domicilio";
  return (
    <Badge variant="info" icon={<Truck className="size-3.5" aria-hidden />}>
      {label}
      {cost != null && ` · ${formatShippingCost(cost)}`}
    </Badge>
  );
}

export interface SubscriptionBadgeProps {
  /** % de ahorro al suscribirse. */
  discount?: number;
}

/** Sello "Suscríbete y ahorra" (acento Miel — el color de la anticipación). */
export function SubscriptionBadge({ discount }: SubscriptionBadgeProps) {
  return (
    <Badge variant="subscribe" icon={<RefreshCw className="size-3.5" aria-hidden />}>
      {discount ? `Suscríbete y ahorra ${discount}%` : "Suscribible"}
    </Badge>
  );
}
