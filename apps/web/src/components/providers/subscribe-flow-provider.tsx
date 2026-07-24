"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useCart } from "./cart-provider";
import {
  SubscribeConfirmSheet,
  type SubscribeConfirmDetails,
} from "@/components/commerce/subscribe-confirm-sheet";
import type { Product, SubscriptionFrequencyWeeks } from "@/types";

/**
 * Flujo ÚNICO post-"Suscribirme" (D56 · Bloque B) — mismo patrón que el Toast.
 *
 * Cualquier CTA de suscripción (card de la PDP o tarjeta de catálogo) llama a
 * `start(product, frequency)`: se agrega la línea de suscripción al carrito y se
 * abre la hoja de confirmación (`SubscribeConfirmSheet`). Centralizar aquí evita
 * duplicar el comportamiento entre superficies y mantiene una sola verdad de "qué
 * pasa al suscribirse".
 */

interface SubscribeFlowValue {
  start: (product: Product, frequency: SubscriptionFrequencyWeeks) => void;
}

const SubscribeFlowContext = createContext<SubscribeFlowValue | null>(null);

export function SubscribeFlowProvider({ children }: { children: React.ReactNode }) {
  const { addItem } = useCart();
  const [details, setDetails] = useState<SubscribeConfirmDetails | null>(null);
  const [open, setOpen] = useState(false);

  const start = useCallback(
    (product: Product, frequency: SubscriptionFrequencyWeeks) => {
      // La hoja explica el plan desde `product` + `frequency` (no depende del
      // carrito), así que se abre de inmediato; el alta corre en segundo plano.
      setDetails({ product, frequency });
      setOpen(true);
      void addItem(product, { subscriptionWeeks: frequency });
    },
    [addItem],
  );

  return (
    <SubscribeFlowContext.Provider value={{ start }}>
      {children}
      <SubscribeConfirmSheet open={open} onOpenChange={setOpen} details={details} />
    </SubscribeFlowContext.Provider>
  );
}

export function useSubscribeFlow(): SubscribeFlowValue {
  const ctx = useContext(SubscribeFlowContext);
  if (!ctx) throw new Error("useSubscribeFlow debe usarse dentro de <SubscribeFlowProvider>");
  return ctx;
}
