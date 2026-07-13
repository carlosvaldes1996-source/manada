import { MedusaService } from "@medusajs/framework/utils";
import SavedCard from "./models/saved-card";

/**
 * Servicio del módulo `payment-method` (API.md §10). `MedusaService` autogenera
 * el CRUD (`listSavedCards`/`softDeleteSavedCards`/…); las rutas de la Store API
 * imponen la propiedad por `customer_id` — el servicio no conoce la sesión.
 *
 * Cuando Mercado Pago entre, la eliminación se extiende AQUÍ (borrar la card en
 * MP vía `gateway_card_id` y luego soft-delete local), sin tocar el contrato.
 */
class PaymentMethodModuleService extends MedusaService({ SavedCard }) {}

export default PaymentMethodModuleService;
