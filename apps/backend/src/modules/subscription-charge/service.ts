import { MedusaService } from "@medusajs/framework/utils";
import SubscriptionCharge from "./models/subscription-charge";

/**
 * Servicio del módulo `subscription-charge` (D59). `MedusaService` autogenera el
 * CRUD (`listSubscriptionCharges`/`createSubscriptionCharges`/
 * `updateSubscriptionCharges`/…); la orquestación del cobro (firmar, `customer/charge`,
 * verificar, crear la orden e idempotencia) vive en `src/lib/subscription-charge.ts`
 * y en el job, no aquí: el servicio solo persiste el ledger de cada intento.
 */
class SubscriptionChargeModuleService extends MedusaService({ SubscriptionCharge }) {}

export default SubscriptionChargeModuleService;
