import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RatingProps {
  /** Valor 0–5 (admite decimales para relleno parcial). */
  value: number;
  /** Nº de reseñas, opcional. */
  count?: number;
  size?: "sm" | "md";
  /** Oculta el número de reseñas y muestra solo estrellas. */
  hideCount?: boolean;
  className?: string;
}

/**
 * Valoración por estrellas (Miel) con relleno parcial y conteo.
 * El valor numérico se expone como texto accesible (no solo color/forma).
 */
export function Rating({ value, count, size = "sm", hideCount = false, className }: RatingProps) {
  const px = size === "sm" ? 14 : 18;
  const rounded = Math.round(value * 10) / 10;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-text-secondary", className)}
      aria-label={`${rounded} de 5${count != null ? `, ${count} reseñas` : ""}`}
    >
      <span className="inline-flex" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, value - i));
          return (
            <span key={i} className="relative inline-block" style={{ width: px, height: px }}>
              <Star size={px} className="absolute inset-0 text-miel-300" strokeWidth={1.75} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star size={px} className="fill-miel-500 text-miel-500" strokeWidth={1.75} />
              </span>
            </span>
          );
        })}
      </span>
      {!hideCount && count != null && (
        <span className={size === "sm" ? "text-[13px]" : "text-sm"}>
          {rounded.toFixed(1)} ({count})
        </span>
      )}
    </span>
  );
}
