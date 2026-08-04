import { Module } from "@medusajs/framework/utils";
import FlowCustomerModuleService from "./service";

/**
 * Módulo `flow-customer` (D70, API.md §15) — vínculo 1:1 entre el `customer` de
 * Medusa y su cliente (`cus_…`) en Flow. Sexto módulo custom (patrón idéntico a
 * `pet` D34, `payment-method` §10, `flow-payment` D58).
 *
 * Es la fuente de verdad LOCAL del vínculo, y la única que hay: Flow no permite
 * buscar un cliente por `externalId`.
 */
export const FLOW_CUSTOMER_MODULE = "flow_customer";

export default Module(FLOW_CUSTOMER_MODULE, {
  service: FlowCustomerModuleService,
});
