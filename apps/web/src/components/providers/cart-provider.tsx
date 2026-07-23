"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartItem, Product, SubscriptionFrequencyWeeks } from "@/types";
import {
  addLineItem,
  addSubscriptionLineItem,
  createCart,
  findLineIdByProduct,
  mapCartItems,
  type MedusaCart,
  removeLineItem,
  retrieveCart,
  setLineItemQuantity,
  transferCartToCustomer,
} from "@/lib/medusa/cart";
import { trackAddToCart } from "@/lib/analytics";

/**
 * Estado del carrito sobre carritos REALES de Medusa (Fase 5 · Etapa 3, D24).
 *
 * El carrito de Medusa es la fuente de verdad; este provider lo envuelve y persiste
 * su `id` en `localStorage` para sobrevivir entre sesiones. Las mutaciones son
 * asíncronas (Store API) y devuelven el carrito actualizado. Compra única (sin
 * suscripción: el motor recurrente es el moat, posterior al MVP).
 *
 * Se conserva la superficie pública (`items`/`count`/`subtotal`/`addItem`/
 * `removeItem`/`updateQuantity`) para no romper los componentes existentes; además
 * expone el carrito crudo y `applyCart`/`refresh`/`clear` para el checkout real.
 */
const CART_ID_KEY = "manada_cart_id";

interface CartContextValue {
  cart: MedusaCart | null;
  items: CartItem[];
  count: number;
  subtotal: number;
  /** Carga inicial del carrito persistido. */
  isLoading: boolean;
  addItem: (
    product: Product,
    opts?: { quantity?: number; subscriptionWeeks?: SubscriptionFrequencyWeeks },
  ) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  /** Reemplaza el carrito con la respuesta de una operación de checkout. */
  applyCart: (cart: MedusaCart) => void;
  /** Re-lee el carrito desde el backend. */
  refresh: () => Promise<void>;
  /** Vacía: arranca un carrito nuevo (tras completar la orden). */
  clear: () => Promise<void>;
  /** Asocia el carrito de invitado al cliente recién autenticado (transferCart). */
  transferToCustomer: () => Promise<void>;
  /** Olvida el carrito local (al cerrar sesión); el próximo ítem crea uno nuevo. */
  reset: () => void;
  /** @deprecated Con carritos reales no se siembran ítems demo. No-op. */
  seedItems: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCartState] = useState<MedusaCart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Ref para operar con el carrito actual sin closures obsoletos en clics rápidos.
  const cartRef = useRef<MedusaCart | null>(null);

  const setCart = useCallback((next: MedusaCart | null) => {
    cartRef.current = next;
    setCartState(next);
    if (typeof window !== "undefined") {
      if (next?.id) window.localStorage.setItem(CART_ID_KEY, next.id);
      else window.localStorage.removeItem(CART_ID_KEY);
    }
  }, []);

  // Hidrata el carrito persistido al montar.
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(CART_ID_KEY) : null;
      if (stored) {
        const existing = await retrieveCart(stored);
        if (active && existing && !existing.completed_at) setCart(existing);
        else if (active) setCart(null);
      }
      if (active) setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [setCart]);

  /** Devuelve el carrito actual o crea uno nuevo (perezoso: solo al primer ítem). */
  const ensureCart = useCallback(async (): Promise<MedusaCart> => {
    if (cartRef.current) return cartRef.current;
    const created = await createCart();
    setCart(created);
    return created;
  }, [setCart]);

  const addItem = useCallback<CartContextValue["addItem"]>(
    async (product, opts) => {
      if (!product.variantId) {
        console.warn(`[cart] "${product.name}" no tiene variantId; no se puede agregar al carrito real.`);
        return;
      }
      const current = await ensureCart();
      const quantity = opts?.quantity ?? 1;
      // Suscripción: ruta propia que fija el precio suscrito + deja la metadata de
      // suscripción en la línea (D55). Compra única: ruta core sin cambios.
      const updated = opts?.subscriptionWeeks
        ? await addSubscriptionLineItem(current.id, product.variantId, quantity, opts.subscriptionWeeks)
        : await addLineItem(current.id, product.variantId, quantity);
      setCart(updated);
      // Punto único del funnel para "add_to_cart": PLP, PDP, recomendación y
      // recompra del dashboard pasan todas por aquí (una sola instrumentación).
      trackAddToCart(product, quantity);
    },
    [ensureCart, setCart],
  );

  const updateQuantity = useCallback<CartContextValue["updateQuantity"]>(
    async (productId, quantity) => {
      const current = cartRef.current;
      const lineId = findLineIdByProduct(current, productId);
      if (!current || !lineId) return;
      const updated =
        quantity <= 0
          ? await removeLineItem(current.id, lineId)
          : await setLineItemQuantity(current.id, lineId, quantity);
      setCart(updated ?? null);
    },
    [setCart],
  );

  const removeItem = useCallback<CartContextValue["removeItem"]>(
    async (productId) => {
      const current = cartRef.current;
      const lineId = findLineIdByProduct(current, productId);
      if (!current || !lineId) return;
      const updated = await removeLineItem(current.id, lineId);
      setCart(updated ?? null);
    },
    [setCart],
  );

  const applyCart = useCallback<CartContextValue["applyCart"]>((next) => setCart(next), [setCart]);

  const refresh = useCallback(async () => {
    const id = cartRef.current?.id;
    if (id) setCart(await retrieveCart(id));
  }, [setCart]);

  const clear = useCallback(async () => {
    setCart(await createCart());
  }, [setCart]);

  const transferToCustomer = useCallback(async () => {
    const id = cartRef.current?.id;
    if (!id) return;
    try {
      setCart(await transferCartToCustomer(id));
    } catch {
      // Si el carrito ya no es transferible (expirado/completado), lo olvidamos.
      setCart(null);
    }
  }, [setCart]);

  const reset = useCallback(() => {
    setCart(null);
  }, [setCart]);

  const seedItems = useCallback(() => {
    // Con carritos reales de Medusa no se siembran ítems demo. Compat no-op.
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const items = mapCartItems(cart);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = cart?.item_subtotal ?? items.reduce((s, i) => s + i.product.price.current * i.quantity, 0);
    return { cart, items, count, subtotal, isLoading, addItem, removeItem, updateQuantity, applyCart, refresh, clear, transferToCustomer, reset, seedItems };
  }, [cart, isLoading, addItem, removeItem, updateQuantity, applyCart, refresh, clear, transferToCustomer, reset, seedItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
