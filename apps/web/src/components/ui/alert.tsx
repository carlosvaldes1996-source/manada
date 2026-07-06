import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Alerta inline contextual (dentro del flujo, no flotante como Toast).
 * Acompaña el color con ícono + texto (a11y §13: no comunicar solo por color).
 */
const alertVariants = cva(
  "flex gap-3 rounded-[var(--radius-md)] border p-4 text-sm",
  {
    variants: {
      variant: {
        info: "border-[var(--info)]/25 bg-info-soft text-info-strong",
        success: "border-[var(--success)]/25 bg-success-soft text-success-strong",
        urgency: "border-[var(--urgency)]/25 bg-urgency-soft text-urgency-strong",
        error: "border-[var(--error)]/25 bg-error-soft text-error-strong",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

const icons = {
  info: Info,
  success: CheckCircle2,
  urgency: TriangleAlert,
  error: AlertCircle,
} as const;

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode;
  /** Permite reemplazar el ícono por defecto de la variante. */
  icon?: React.ReactNode;
}

export function Alert({ className, variant = "info", title, icon, children, ...props }: AlertProps) {
  const Icon = icons[variant ?? "info"];
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <span className="mt-0.5 shrink-0" aria-hidden>
        {icon ?? <Icon className="size-5" strokeWidth={1.75} />}
      </span>
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-[13px] opacity-90">{children}</div>}
      </div>
    </div>
  );
}
