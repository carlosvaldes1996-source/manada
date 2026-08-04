import { MedusaService } from "@medusajs/framework/utils";
import FlowCustomer from "./models/flow-customer";

/**
 * Servicio del módulo `flow-customer` (D70). `MedusaService` autogenera el CRUD
 * (`listFlowCustomers`/`createFlowCustomers`/`updateFlowCustomers`/…).
 *
 * Deliberadamente "tonto": no habla con Flow ni conoce la sesión. La orquestación
 * (cuándo crear el cliente en Flow, cómo resolver una carrera, cuándo re-sincronizar)
 * vive en `src/lib/flow-customer.ts` — mismo reparto que `payment-method` (§10).
 *
 * ⚠️ Nombre a no confundir: `listFlowCustomers` de ESTE servicio lee la tabla local;
 * `listFlowCustomers` de `src/lib/flow` llama al API de Flow.
 */
class FlowCustomerModuleService extends MedusaService({ FlowCustomer }) {}

export default FlowCustomerModuleService;
