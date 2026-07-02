"use client";

import { useCallback, useMemo, useState } from "react";
import type { Product, SubscriptionFrequencyWeeks } from "@/types";

/** Frecuencias ofrecidas, con su etiqueta legible. */
export const SUBSCRIPTION_FREQUENCIES: {
  weeks: SubscriptionFrequencyWeeks;
  label: string;
}[] = [
  { weeks: 2, label: "Cada 2 semanas" },
  { weeks: 4, label: "Cada 4 semanas" },
  { weeks: 6, label: "Cada 6 semanas" },
  { weeks: 8, label: "Cada 8 semanas" },
];

/**
 * Estado de suscripción para un producto (SubscriptionBox de la PDP).
 * Calcula precio con descuento y ahorro a partir de `subscriptionDiscount`.
 * Una sola fuente de verdad para la cápsula de suscripción y el CTA.
 */
export function useSubscription(product: Pick<Product, "price" | "subscriptionDiscount">) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [frequency, setFrequency] = useState<SubscriptionFrequencyWeeks>(4);

  const toggle = useCallback(() => setIsSubscribed((v) => !v), []);

  return useMemo(() => {
    const discountPct = product.subscriptionDiscount ?? 0;
    const base = product.price.current;
    const subscribedPrice = Math.round(base * (1 - discountPct / 100));
    const savings = base - subscribedPrice;
    const effectivePrice = isSubscribed ? subscribedPrice : base;
    return {
      isSubscribed,
      frequency,
      toggle,
      setIsSubscribed,
      setFrequency,
      discountPct,
      subscribedPrice,
      savings,
      effectivePrice,
    };
  }, [isSubscribed, frequency, product, toggle]);
}
