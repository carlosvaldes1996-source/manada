import type { CartItem } from "@/types";

/**
 * Snapshot de compra para la analítica post-Flow (D58).
 *
 * Con pago manual (D24) la compra se medía en el mismo click, con los ítems a
 * mano. Con Flow el usuario sale del sitio y vuelve a la confirmación, cuando el
 * carrito ya se vació: guardamos un snapshot en `sessionStorage` (vive en la
 * pestaña, sobrevive el ida y vuelta a Flow) para disparar `trackPurchase` con
 * los ítems reales, y lo borramos al usarlo. Clave compartida checkout↔confirmación.
 */
export const PENDING_PURCHASE_KEY = "manada_pending_purchase";

export interface PendingPurchaseSnapshot {
  items: CartItem[];
  total: number;
}
