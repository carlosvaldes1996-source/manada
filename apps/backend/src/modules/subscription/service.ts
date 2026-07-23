import { MedusaService } from "@medusajs/framework/utils";
import Subscription from "./models/subscription";

/**
 * Servicio del módulo `subscription` (D55). `MedusaService` autogenera el CRUD
 * (`listSubscriptions`/`retrieveSubscription`/`createSubscriptions`/
 * `updateSubscriptions`/`softDeleteSubscriptions`); las rutas de la Store API
 * (`/store/subscriptions`, API.md §13) imponen la propiedad por `customer_id` —
 * el servicio no conoce la sesión.
 *
 * Cuando entre el pago recurrente (Bloque 4) y el scheduler (Bloque 2), la
 * lógica de cobro/regeneración se extiende AQUÍ, sin tocar el contrato.
 */
class SubscriptionModuleService extends MedusaService({ Subscription }) {}

export default SubscriptionModuleService;
