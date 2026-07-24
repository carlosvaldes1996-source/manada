import { MedusaService } from "@medusajs/framework/utils";
import FlowPayment from "./models/flow-payment";

/**
 * Servicio del módulo `flow-payment` (D58). `MedusaService` autogenera el CRUD
 * (`listFlowPayments`/`retrieveFlowPayment`/`createFlowPayments`/
 * `updateFlowPayments`); la lógica de conciliación (firmar, `getStatus`, completar
 * el carrito e idempotencia) vive en `src/lib/flow.ts` y en los endpoints, no aquí:
 * el servicio solo persiste el ciclo del intento de pago.
 */
class FlowPaymentModuleService extends MedusaService({ FlowPayment }) {}

export default FlowPaymentModuleService;
