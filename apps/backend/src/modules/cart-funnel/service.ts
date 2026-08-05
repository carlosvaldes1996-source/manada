import { MedusaService } from "@medusajs/framework/utils";
import CartFunnel from "./models/cart-funnel";

/**
 * Servicio del módulo `cart-funnel` (D75). `MedusaService` autogenera el CRUD
 * (`listCartFunnels`/`retrieveCartFunnel`/`createCartFunnels`/`updateCartFunnels`).
 *
 * Igual que en `flow-payment` (D58), la LÓGICA no vive aquí: la proyección del
 * funnel (leer el carrito, derivar etapa y último movimiento, calcular el snapshot)
 * está en `src/lib/cart-funnel-projection.ts`, en UNA sola función idempotente que
 * comparten los subscribers, el backfill y cualquier job de reparación futuro.
 * El servicio solo persiste.
 */
class CartFunnelModuleService extends MedusaService({ CartFunnel }) {}

export default CartFunnelModuleService;
