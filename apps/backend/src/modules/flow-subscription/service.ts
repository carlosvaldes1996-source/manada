import { MedusaService } from "@medusajs/framework/utils";
import FlowPlan from "./models/flow-plan";
import FlowSubscription from "./models/flow-subscription";

/**
 * Servicio del módulo `flow-subscription` (D71). `MedusaService` autogenera el CRUD
 * de ambos modelos (`listFlowPlans`/`createFlowSubscriptions`/…).
 *
 * ⚠️ Nombres que colisionan visualmente: `listFlowPlans`/`listFlowSubscriptions` de
 * ESTE servicio leen las tablas locales; los homónimos de `src/lib/flow` llaman al
 * API de Flow. Los orquestadores (`lib/flow-plan.ts`, `lib/flow-subscription.ts`)
 * son los únicos que ven ambos.
 */
class FlowSubscriptionModuleService extends MedusaService({ FlowPlan, FlowSubscription }) {}

export default FlowSubscriptionModuleService;
