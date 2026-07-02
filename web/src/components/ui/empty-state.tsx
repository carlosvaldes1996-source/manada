import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Ilustración o ícono (emoji grande como placeholder, DESIGN_SYSTEM §7). */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** CTA(s) — el copy debe ser cálido y orientar a la acción (§12.5). */
  action?: React.ReactNode;
}

/**
 * Estado vacío cálido (carrito/búsqueda/sin mascotas). Centrado, con ilustración,
 * copy amable y una acción clara. Nunca un mensaje frío de "no hay datos".
 */
export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="grid size-16 place-items-center rounded-full bg-brand-soft text-4xl" aria-hidden>
          {icon}
        </div>
      )}
      <h3 className="heading-3 text-text-primary">{title}</h3>
      {description && <p className="body-m max-w-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}
