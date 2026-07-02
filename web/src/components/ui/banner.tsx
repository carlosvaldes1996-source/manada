"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Banner full-width para anuncios globales (envío gratis, aviso de marca).
 * Ancho completo, opcionalmente descartable. Distinto de Alert (contextual) y
 * Toast (efímero). Tono `accent` = Miel para mensajes de anticipación.
 */
const bannerVariants = cva("w-full text-sm", {
  variants: {
    tone: {
      brand: "bg-terracota-500 text-white",
      accent: "bg-miel-500 text-neutral-800",
      pino: "bg-pino-500 text-white",
      subtle: "bg-subtle text-text-primary",
    },
  },
  defaultVariants: { tone: "brand" },
});

export interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Banner({
  className,
  tone,
  icon,
  dismissible = false,
  onDismiss,
  children,
  ...props
}: BannerProps) {
  const [visible, setVisible] = React.useState(true);
  if (!visible) return null;
  return (
    <div className={cn(bannerVariants({ tone }), className)} {...props}>
      <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-center gap-2 px-4 py-2.5 text-center font-medium">
        {icon && (
          <span className="inline-flex shrink-0" aria-hidden>
            {icon}
          </span>
        )}
        <span>{children}</span>
        {dismissible && (
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
            className="ml-auto inline-flex rounded-full p-1 transition-colors hover:bg-black/10"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
