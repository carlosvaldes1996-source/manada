"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import { MotionProvider } from "./motion-provider";
import { SessionProvider } from "./session-provider";
import { PetProvider } from "./pet-provider";
import { CartProvider } from "./cart-provider";

/**
 * Composición única de providers de la app, montada en el Root Layout.
 * Orden: Motion (config global) → Tooltip (a11y de toda la app) → Session
 * (cuenta) → Pet (núcleo/moat) → Cart (comercio) → Toast (viewport de feedback,
 * el más interno para poder notificar acciones de carrito/suscripción).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <TooltipProvider delayDuration={200}>
        <SessionProvider>
          <PetProvider>
            <CartProvider>
              <ToastProvider>{children}</ToastProvider>
            </CartProvider>
          </PetProvider>
        </SessionProvider>
      </TooltipProvider>
    </MotionProvider>
  );
}

export { useSession } from "./session-provider";
export { usePet } from "./pet-provider";
export { useCart } from "./cart-provider";
