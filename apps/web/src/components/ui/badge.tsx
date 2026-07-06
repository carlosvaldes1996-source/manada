import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Etiqueta de estado, pequeña y no interactiva (DESIGN_SYSTEM §11).
 * Cada variante mapea a un estado semántico. Las señales nunca se comunican
 * solo por color: se acompañan de ícono/texto (a11y §13).
 */
export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[13px] font-semibold leading-none",
  {
    variants: {
      variant: {
        neutral: "bg-subtle text-text-secondary",
        subscribe: "bg-accent-soft text-subscribe-strong",
        success: "bg-success-soft text-success-strong",
        urgency: "bg-urgency-soft text-urgency-strong",
        info: "bg-info-soft text-info-strong",
        error: "bg-error-soft text-error-strong",
        brand: "bg-brand-soft text-text-brand",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

export function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon && (
        <span className="-ml-0.5 inline-flex shrink-0" aria-hidden>
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
