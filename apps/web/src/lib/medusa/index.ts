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
export { listProducts, getProductByHandle, searchProducts } from "./products";
export type { ListProductsParams } from "./products";
export { getShippingPolicy, type ShippingPolicy } from "./shipping";
export {
  createCart,
  retrieveCart,
  addLineItem,
  setLineItemQuantity,
  removeLineItem,
  transferCartToCustomer,
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
export {
  mapCustomer,
  getCurrentCustomer,
  registerCustomer,
  loginCustomer,
  logoutCustomer,
  requestPasswordReset,
  resetPassword,
  saveCustomerRut,
  type RegisterInput,
} from "./auth";
export {
  listOrders,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  type OrderView,
  type OrderLineView,
  type AddressView,
  type AddressInput,
} from "./account";
export {
  listMyPets,
  createMyPet,
  updateMyPet,
  type UpdateMyPetInput,
} from "./pets";
