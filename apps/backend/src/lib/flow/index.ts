/**
 * Cliente REST de Flow — punto de entrada ÚNICO de la integración HTTP (D58/D59/D70).
 * Doc oficial: https://developers.flow.cl/api
 *
 * Este barrel reemplaza al antiguo `src/lib/flow.ts` monolítico sin cambiar su
 * especificador de importación: todo el código que hacía `from "../lib/flow"`
 * sigue funcionando igual. La estructura interna quedó por capas:
 *
 *   ./http.ts          transporte: config, firma HMAC, fetch, errores, reintentos
 *   ./payments.ts      servicio `payment` (pago único, D58)
 *   ./customers.ts     servicio `customer` (bóveda de tarjeta + cobro, D59/D70)
 *   ./plans.ts         servicio `plans` (tarifas recurrentes, D71)
 *   ./subscriptions.ts servicios `subscription` + `subscription_item` (D71)
 *
 * La ORQUESTACIÓN del dominio (cuándo crear un cliente/plan/suscripción, dónde se
 * persiste, cómo se garantiza que no haya duplicados) NO vive aquí: vive en
 * `src/lib/flow-customer.ts`, `flow-plan.ts` y `flow-subscription.ts`. Este módulo
 * no conoce Medusa.
 */

export {
  getFlowConfig,
  isFlowConfigured,
  signParams,
  flowGet,
  flowPost,
  flowErrorMessage,
  FlowApiError,
  type FlowConfig,
  type FlowParams,
  type FlowRequestOptions,
} from "./http";

export {
  createFlowPayment,
  getFlowStatus,
  getFlowStatusByCommerceId,
  FLOW_STATUS,
  type CreatePaymentInput,
  type CreatePaymentResult,
  type FlowStatusResult,
} from "./payments";

export {
  createFlowCustomer,
  editFlowCustomer,
  getFlowCustomer,
  deleteFlowCustomer,
  listFlowCustomers,
  findFlowCustomerByExternalId,
  registerFlowCard,
  getFlowRegisterStatus,
  unregisterFlowCard,
  chargeFlowCustomer,
  isChargeable,
  FLOW_CUSTOMER_STATUS,
  FLOW_PAY_MODE,
  type FlowCustomer,
  type FlowPayMode,
  type FlowCustomerPage,
  type CreateCustomerInput,
  type EditCustomerInput,
  type ListCustomersInput,
  type RegisterCardInput,
  type RegisterCardResult,
  type RegisterStatusResult,
  type ChargeCustomerInput,
  type ChargeCustomerResult,
} from "./customers";

export {
  createFlowPlan,
  getFlowPlan,
  editFlowPlan,
  deleteFlowPlan,
  listFlowPlans,
  FLOW_INTERVAL,
  FLOW_PLAN_STATUS,
  type FlowPlan,
  type FlowInterval,
  type FlowPlanPage,
  type CreatePlanInput,
  type EditPlanInput,
  type ListPlansInput,
} from "./plans";

export {
  createFlowSubscription,
  getFlowSubscription,
  listFlowSubscriptions,
  getFlowCustomerSubscriptions,
  cancelFlowSubscription,
  changeFlowSubscriptionTrial,
  changeFlowSubscriptionPlan,
  previewFlowSubscriptionPlanChange,
  cancelFlowSubscriptionPlanChange,
  addFlowSubscriptionItem,
  deleteFlowSubscriptionItem,
  addFlowSubscriptionCoupon,
  deleteFlowSubscriptionCoupon,
  createFlowItemAdditional,
  getFlowItemAdditional,
  editFlowItemAdditional,
  deleteFlowItemAdditional,
  listFlowItemAdditionals,
  FLOW_SUBSCRIPTION_STATUS,
  FLOW_MOROSE,
  FLOW_ITEM_CHANGE_TYPE,
  type FlowSubscription,
  type FlowSubscriptionItem,
  type FlowSubscriptionPage,
  type FlowItemAdditional,
  type FlowItemChangeResult,
  type FlowItemChangeType,
  type FlowChangePlanResult,
  type CreateSubscriptionInput,
  type ListSubscriptionsInput,
  type ChangePlanInput,
} from "./subscriptions";
