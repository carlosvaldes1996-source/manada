"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CartItem, Product, SubscriptionFrequencyWeeks } from "@/types";

/**
 * Estado del carrito. Las pantallas y los componentes de comercio consumen este
 * contexto. El precio efectivo (con descuento de suscripción) se calcula aquí
 * para mantener una sola fuente de verdad.
 *
 * Fase 3.3B: arranca **vacío** (el visitante nuevo construye su primer carrito
 * desde la recomendación). El demo-login lo siembra vía `seedItems`.
 */
interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (
    product: Product,
    opts?: { quantity?: number; subscriptionWeeks?: SubscriptionFrequencyWeeks },
  ) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  /** Reemplaza el carrito completo (demo-login). */
  seedItems: (items: CartItem[]) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Precio unitario efectivo: aplica el descuento de suscripción si corresponde. */
function unitPrice(item: CartItem): number {
  const base = item.product.price.current;
  if (item.subscriptionWeeks && item.product.subscriptionDiscount) {
    return Math.round(base * (1 - item.product.subscriptionDiscount / 100));
  }
  return base;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Arranca vacío: el visitante nuevo arma su primer carrito desde la
  // recomendación; el demo-login lo siembra. En Fase 4 se hidrata desde backend.
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback<CartContextValue["addItem"]>((product, opts) => {
    const quantity = opts?.quantity ?? 1;
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity, subscriptionWeeks: opts?.subscriptionWeeks ?? i.subscriptionWeeks }
            : i,
        );
      }
      return [...prev, { product, quantity, subscriptionWeeks: opts?.subscriptionWeeks }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.product.id !== productId)
        : prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    );
  }, []);

  const seedItems = useCallback((next: CartItem[]) => setItems(next), []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0);
    return { items, count, subtotal, addItem, removeItem, updateQuantity, seedItems, clear };
  }, [items, addItem, removeItem, updateQuantity, seedItems, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
