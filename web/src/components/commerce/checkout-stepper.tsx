import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckoutStep {
  title: string;
  description?: string;
}

export interface CheckoutStepperProps {
  steps: CheckoutStep[];
  /** Índice del paso actual (0-based). Los previos se marcan completados. */
  current: number;
  /** Orientación: vertical (sidebar) u horizontal (top en una sola pantalla). */
  orientation?: "vertical" | "horizontal";
  className?: string;
}

/**
 * Indicador de progreso del checkout (DESIGN_SYSTEM §11 — 1 pantalla, progreso
 * en Pino, resumen siempre visible). Marca completados en verde éxito y el
 * actual en Pino. Comunica el paso por número + texto (no solo color).
 */
export function CheckoutStepper({ steps, current, orientation = "vertical", className }: CheckoutStepperProps) {
  return (
    <ol
      className={cn(orientation === "horizontal" ? "flex items-start" : "flex flex-col", className)}
      aria-label="Progreso del pedido"
    >
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const last = i === steps.length - 1;
        return (
          <li
            key={step.title}
            aria-current={active ? "step" : undefined}
            className={cn("flex gap-3", orientation === "horizontal" ? "flex-1 items-center" : "pb-6 last:pb-0")}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-bold",
                done && "bg-[var(--success)] text-white",
                active && "bg-pino-500 text-white",
                !done && !active && "bg-subtle text-text-muted",
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className={cn("flex flex-col", orientation === "horizontal" && "pr-2")}>
              <span className={cn("text-[15px] font-semibold", active || done ? "text-text-primary" : "text-text-muted")}>
                {step.title}
              </span>
              {step.description && orientation === "vertical" && (
                <span className="text-[13px] text-text-secondary">{step.description}</span>
              )}
            </span>
            {orientation === "horizontal" && !last && (
              <span className={cn("mx-2 h-px flex-1", done ? "bg-[var(--success)]" : "bg-border-default")} aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
