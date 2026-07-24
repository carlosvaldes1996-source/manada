"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/providers";
import { trackPurchase } from "@/lib/analytics";
import { PENDING_PURCHASE_KEY, type PendingPurchaseSnapshot } from "@/lib/checkout-snapshot";

/**
 * Efectos post-Flow de la confirmación (D58) — sin UI. Se ejecuta una vez al
 * llegar de vuelta desde Flow:
 *  - Pago EXITOSO: mide la compra (`trackPurchase`, `transaction_id` = nº de orden
 *    → dedup en GA4/Ads) con el snapshot guardado, borra el snapshot y **vacía el
 *    carrito** (la orden ya se creó en el backend con el pago confirmado).
 *  - Fallo/cancelación: conserva el carrito para reintentar; solo suelta el snapshot.
 */
export function PurchaseEffects({ estado, orden }: { estado: string; orden?: string }) {
  const { clear } = useCart();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let snap: PendingPurchaseSnapshot | null = null;
    try {
      const raw = sessionStorage.getItem(PENDING_PURCHASE_KEY);
      if (raw) snap = JSON.parse(raw) as PendingPurchaseSnapshot;
    } catch {
      /* almacenamiento no disponible */
    }

    // Solo tratamos como compra real si hubo checkout de verdad (snapshot u orden):
    // así una URL manipulada `?estado=exito` no vacía el carrito ni mide una compra.
    const realPurchase = estado === "exito" && (Boolean(snap) || Boolean(orden));

    if (realPurchase) {
      if (orden && snap?.items?.length) {
        trackPurchase({ transactionId: orden, value: snap.total ?? 0, items: snap.items });
      }
      // El carrito quedó completado en el backend → arrancamos uno nuevo.
      void clear();
    }
    // En cualquier caso soltamos el snapshot (evita re-medir en recargas / fallos).
    try {
      sessionStorage.removeItem(PENDING_PURCHASE_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
  }, [estado, orden, clear]);

  return null;
}
