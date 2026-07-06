/**
 * Capa de datos de Medusa (Fase 5 · Etapa 1 — Fundación).
 *
 * Único punto de `apps/web` que conoce la forma de la Store API de Medusa. Las
 * pantallas y providers importan desde aquí, no del SDK directamente, para que
 * el mapeo Medusa → dominio Manada viva en un solo lugar.
 */
export { medusa, MEDUSA_BACKEND_URL } from "./client";
export { getRegionId } from "./region";
export { mapProduct, PRODUCT_FIELDS } from "./map-product";
export { listProducts, getProductByHandle } from "./products";
export type { ListProductsParams } from "./products";
export {
  createCart,
  retrieveCart,
  addLineItem,
  setLineItemQuantity,
  removeLineItem,
  mapCartItems,
  findLineIdByProduct,
  CART_FIELDS,
  type MedusaCart,
} from "./cart";
export {
  MANUAL_PAYMENT_PROVIDER,
  listShippingOptions,
  setCheckoutInfo,
  selectShippingMethod,
  initManualPayment,
  completeCart,
  type CheckoutAddress,
  type ShippingOptionView,
  type CompletedOrder,
} from "./checkout";
