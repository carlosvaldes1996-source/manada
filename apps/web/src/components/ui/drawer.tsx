"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Panel deslizante lateral o inferior (carrito, filtros móviles, menú).
 * Comparte motor con Dialog (Radix) → foco-trap/ESC/scroll-lock gratis.
 * - side="right": Drawer del carrito (DESIGN_SYSTEM §11).
 * - side="bottom": Sheet de filtros/acciones en móvil.
 */
export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

const sideClasses = {
  right:
    "top-0 right-0 h-full w-[min(420px,92vw)] rounded-l-[var(--radius-xl)] data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
  left: "top-0 left-0 h-full w-[min(420px,92vw)] rounded-r-[var(--radius-xl)] data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  bottom:
    "inset-x-0 bottom-0 max-h-[85vh] rounded-t-[var(--radius-xl)] data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
} as const;

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: keyof typeof sideClasses;
  /** Título accesible obligatorio (oculto visualmente si no se pasa header). */
  title: string;
  description?: string;
  /** Pie fijo (CTA del carrito, "Aplicar filtros"). */
  footer?: React.ReactNode;
  hideClose?: boolean;
}

export const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, side = "right", title, description, footer, hideClose, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-[95] bg-[rgba(42,39,34,0.45)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-[96] flex flex-col bg-surface shadow-lg duration-[var(--duration-overlay)] data-[state=open]:animate-in data-[state=closed]:animate-out",
        sideClasses[side],
        className,
      )}
      {...props}
    >
      {side === "bottom" && <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong" aria-hidden />}
      <div className="flex items-center justify-between gap-3 border-b border-border-default p-4">
        <div className="flex flex-col">
          <DialogPrimitive.Title className="heading-4 text-text-primary">{title}</DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="text-[13px] text-text-secondary">
              {description}
            </DialogPrimitive.Description>
          )}
        </div>
        {!hideClose && (
          <DialogPrimitive.Close
            aria-label="Cerrar"
            className="grid size-9 shrink-0 place-items-center rounded-full text-text-secondary transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
          >
            <X className="size-5" aria-hidden />
          </DialogPrimitive.Close>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">{children}</div>
      {footer && <div className="border-t border-border-default p-4">{footer}</div>}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DrawerContent.displayName = "DrawerContent";

/** Alias semántico: un Sheet es un Drawer inferior. */
export const Sheet = Drawer;
export const SheetTrigger = DrawerTrigger;
export const SheetClose = DrawerClose;
export function SheetContent(props: Omit<DrawerContentProps, "side">) {
  return <DrawerContent side="bottom" {...props} />;
}
