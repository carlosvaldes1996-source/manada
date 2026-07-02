import { cn } from "@/lib/utils";

const tones = {
  miel: "bg-miel-500",
  brand: "bg-terracota-500",
  success: "bg-[var(--success)]",
  pino: "bg-pino-500",
} as const;

export interface ProgressProps {
  /** Valor 0–100. */
  value: number;
  tone?: keyof typeof tones;
  size?: "sm" | "md";
  /** Etiqueta accesible (p. ej. "Perfil de Toby completo al 75%"). */
  label?: string;
  className?: string;
}

/**
 * Barra de progreso (completitud de perfil, free-shipping, días de comida).
 * Expone role="progressbar" + aria-valuenow para lectores de pantalla.
 */
export function Progress({ value, tone = "miel", size = "md", label, className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "w-full overflow-hidden rounded-[var(--radius-pill)] bg-muted",
        size === "sm" ? "h-1.5" : "h-2",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-[var(--radius-pill)] transition-[width] duration-[var(--duration-standard)]", tones[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
