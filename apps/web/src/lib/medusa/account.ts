import type { HttpTypes } from "@medusajs/types";
import { medusa } from "./client";

/**
 * Cuenta del cliente sobre la Store API de Medusa (Fase 5 · Etapa A): historial de
 * pedidos y direcciones, ambos NATIVOS y ligados al cliente autenticado (el SDK
 * envía el JWT). Sin lógica de negocio propia; el frontend solo consume y mapea.
 */

/* --------------------------------- Pedidos -------------------------------- */

export interface OrderLineView {
  id: string;
  title: string;
  quantity: number;
  thumbnail?: string | null;
  /** Producto de la línea — permite el match alimento↔mascota (D35). */
  productId?: string;
}

export interface OrderView {
  id: string;
  displayId: number;
  createdAt: string;
  total: number;
  currencyCode: string;
  /** Estado legible en español (derivado de fulfillment/payment/status nativos). */
  statusLabel: string;
  itemCount: number;
  items: OrderLineView[];
}

const ORDER_FIELDS = [
  "id",
  "display_id",
  "created_at",
  "total",
  "currency_code",
  "status",
  "payment_status",
  "fulfillment_status",
  "*items",
].join(",");

type AnyOrder = {
  id: string;
  display_id?: number | null;
  created_at?: string;
  total?: number | null;
  currency_code?: string;
  status?: string;
  payment_status?: string;
  fulfillment_status?: string;
  items?: { id: string; title?: string; product_title?: string; quantity?: number; thumbnail?: string | null; product_id?: string | null }[];
};

/** Etiqueta honesta del estado (operación manual del MVP, D22). */
function statusLabel(order: AnyOrder): string {
  if (order.status === "canceled") return "Cancelado";
  if (order.fulfillment_status === "delivered") return "Entregado";
  if (order.fulfillment_status === "shipped") return "En camino";
  if (order.payment_status === "captured" || order.payment_status === "authorized") return "En preparación";
  return "Pendiente de pago";
}

function mapOrder(order: AnyOrder): OrderView {
  const items = (order.items ?? []).map((i) => ({
    id: i.id,
    title: i.title || i.product_title || "Producto",
    quantity: i.quantity ?? 1,
    thumbnail: i.thumbnail ?? null,
    productId: i.product_id ?? undefined,
  }));
  return {
    id: order.id,
    displayId: order.display_id ?? 0,
    createdAt: order.created_at ?? "",
    total: order.total ?? 0,
    currencyCode: order.currency_code ?? "clp",
    statusLabel: statusLabel(order),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    items,
  };
}

/** Pedidos del cliente autenticado (más recientes primero). */
export async function listOrders(): Promise<OrderView[]> {
  const { orders } = await medusa.store.order.list({
    fields: ORDER_FIELDS,
    order: "-created_at",
    limit: 50,
  });
  return (orders as unknown as AnyOrder[]).map(mapOrder);
}

/* ------------------------------- Direcciones ------------------------------ */

export interface AddressView {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  countryCode: string;
  isDefaultShipping: boolean;
}

/** Datos de un formulario de dirección (crear/editar). */
export interface AddressInput {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  province?: string;
  postalCode?: string;
  phone?: string;
}

type AnyAddress = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  address_1?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  country_code?: string | null;
  is_default_shipping?: boolean | null;
};

function mapAddress(a: AnyAddress): AddressView {
  return {
    id: a.id,
    firstName: a.first_name ?? "",
    lastName: a.last_name ?? "",
    address1: a.address_1 ?? "",
    city: a.city ?? "",
    province: a.province ?? undefined,
    postalCode: a.postal_code ?? undefined,
    phone: a.phone ?? undefined,
    countryCode: a.country_code ?? "cl",
    isDefaultShipping: Boolean(a.is_default_shipping),
  };
}

/** Cuerpo Medusa para crear/actualizar una dirección (Chile). */
function toBody(input: AddressInput): HttpTypes.StoreCreateCustomerAddress {
  return {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    address_1: input.address1.trim(),
    city: input.city.trim(),
    province: input.province?.trim() || undefined,
    postal_code: input.postalCode?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    country_code: "cl",
  };
}

export async function listAddresses(): Promise<AddressView[]> {
  const { addresses } = await medusa.store.customer.listAddress({ limit: 50 });
  return (addresses as unknown as AnyAddress[]).map(mapAddress);
}

export async function createAddress(input: AddressInput): Promise<void> {
  await medusa.store.customer.createAddress(toBody(input));
}

export async function updateAddress(addressId: string, input: AddressInput): Promise<void> {
  await medusa.store.customer.updateAddress(addressId, toBody(input));
}

export async function deleteAddress(addressId: string): Promise<void> {
  await medusa.store.customer.deleteAddress(addressId);
}
