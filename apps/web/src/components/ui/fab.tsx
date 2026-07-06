import * as React from "react";
import { cn } from "@/lib/utils";

export interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
  /** Texto opcional junto al ícono (FAB extendido). */
  extendedLabel?: string;
  position?: "br" | "bl";
}

/**
 * Floating Action Button — acción flotante persistente (p. ej. "Pedir de nuevo").
 * Se posiciona fijo sobre la BottomNav en móvil. Usa acento Terracota.
 */
export const Fab = React.forwardRef<HTMLButtonElement, FabProps>(
  ({ className, label, icon, extendedLabel, position = "br", ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={cn(
          "fixed z-50 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-terracota-500 px-4 font-semibold text-white shadow-lg transition-[transform,box-shadow] duration-[var(--duration-micro)] hover:bg-terracota-600 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]",
          extendedLabel ? "h-14" : "size-14 justify-center px-0",
          position === "br" ? "right-5 bottom-24 lg:bottom-8" : "left-5 bottom-24 lg:bottom-8",
          className,
        )}
        {...props}
      >
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
        {extendedLabel && <span className="pr-1 text-[15px]">{extendedLabel}</span>}
      </button>
    );
  },
);
Fab.displayName = "Fab";
