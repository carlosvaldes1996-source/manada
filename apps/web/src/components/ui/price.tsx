import { cn } from "@/lib/utils";
import { formatCLP } from "@/lib/format";

const sizes = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl",
} as const;

export interface PriceProps {
  /** Precio actual en CLP. */
  now: number;
  /** Precio anterior (tachado). Nunca en rojo de oferta (DESIGN_SYSTEM §3.6). */
  was?: number;
  size?: keyof typeof sizes;
  className?: string;
  /** Etiqueta accesible alternativa (por defecto deriva del monto). */
  "aria-label"?: string;
}

/**
 * Precio en CLP con cifras tabulares (Hanken 700).
 * El precio anterior se muestra tachado en `text-secondary`, no en rojo:
 * la marca no grita ofertas (§3.6).
 */
export function Price({ now, was, size = "md", className, ...props }: PriceProps) {
  const showCompare = was !== undefined && was > now;
  return (
    <span
      className={cn("inline-flex items-baseline gap-2", className)}
      aria-label={props["aria-label"] ?? `Precio ${formatCLP(now)}`}
    >
      <span className={cn("price text-text-primary", sizes[size])}>{formatCLP(now)}</span>
      {showCompare && (
        <span className="price text-sm font-medium text-text-secondary line-through">
          {formatCLP(was)}
        </span>
      )}
    </span>
  );
}
