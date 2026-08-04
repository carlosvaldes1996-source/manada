import type { MedusaContainer } from "@medusajs/framework/types";
import { FLOW_CUSTOMER_MODULE } from "../modules/flow-customer";
import type FlowCustomerModuleService from "../modules/flow-customer/service";
import {
  createFlowCustomer,
  editFlowCustomer,
  getFlowCustomer,
  getFlowConfig,
  isChargeable,
  FlowApiError,
  FLOW_CUSTOMER_STATUS,
  type FlowConfig,
  type FlowCustomer,
} from "./flow";

/**
 * ORQUESTADOR de clientes de Flow (D70, Etapa 1) — la costura entre el dominio de
 * Manada y la integración con Flow.
 *
 * Reparto de responsabilidades:
 *   `lib/flow/customers.ts`  → habla el API de Flow. No conoce Medusa.
 *   `modules/flow-customer`  → persiste el vínculo. No conoce Flow.
 *   este archivo             → decide CUÁNDO y garantiza que no haya duplicados.
 *
 * ── La idempotencia es local, y tiene que serlo ───────────────────────────────
 * Flow no ofrece "crear si no existe" ni permite buscar un cliente por
 * `externalId` (`customer/list` solo filtra por nombre). Por lo tanto, la única
 * garantía posible de "un cliente de Flow por cliente de Manada" es la restricción
 * UNIQUE sobre `flow_customer.customer_id`. Todo lo demás se construye sobre eso.
 */

type LocalFlowCustomer = {
  id: string;
  customer_id: string;
  flow_customer_id: string;
  status: string;
  pay_mode: string | null;
  register_date: Date | null;
  last_synced_at: Date | null;
};

export interface EnsureFlowCustomerArgs {
  /** `customer.id` de Medusa — la referencia estable que viaja como `externalId`. */
  customerId: string;
  name: string;
  email: string;
}

/** Flow exige `name`; una cuenta de Manada puede no tener nombre todavía. */
const FALLBACK_NAME = "Cliente Manada";

function service(container: MedusaContainer): FlowCustomerModuleService {
  return container.resolve<FlowCustomerModuleService>(FLOW_CUSTOMER_MODULE);
}

/** Lee el vínculo local de un cliente (o `null` si aún no tiene). */
export async function getFlowCustomerRecord(
  container: MedusaContainer,
  customerId: string,
): Promise<LocalFlowCustomer | null> {
  const rows = (await service(container).listFlowCustomers({
    customer_id: customerId,
  })) as LocalFlowCustomer[];
  return rows[0] ?? null;
}

/**
 * Copia a la fila local lo que Flow acaba de decirnos sobre el cliente. Se llama
 * tras CUALQUIER respuesta que traiga un objeto Customer (create/get/edit), para
 * que `status`/`pay_mode` no se queden viejos.
 */
async function mirrorFromFlow(
  container: MedusaContainer,
  localId: string,
  remote: FlowCustomer,
): Promise<void> {
  await service(container).updateFlowCustomers({
    id: localId,
    status: remote.status ?? FLOW_CUSTOMER_STATUS.ACTIVE,
    pay_mode: remote.payMode ?? null,
    register_date: parseFlowDate(remote.registerDate),
    last_synced_at: new Date(),
  });
}

/**
 * Flow devuelve fechas como `yyyy-mm-dd hh:mm:ss` SIN zona horaria. Se interpretan
 * tal cual (hora de Flow); solo se usan para mostrar "desde cuándo hay tarjeta",
 * nunca para decidir un cobro, así que el desfase de zona es irrelevante.
 */
function parseFlowDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Resuelve el cliente de Flow de un cliente de Manada, CREÁNDOLO si aún no existe.
 * Es la única puerta de entrada: nadie más debe llamar a `createFlowCustomer`.
 *
 * Garantías:
 *  - **Idempotente.** Si ya hay vínculo local, lo devuelve sin tocar Flow.
 *  - **Persiste ANTES de que el usuario pueda abandonar.** La fila se escribe justo
 *    después de crear el cliente en Flow, no después de que registre la tarjeta.
 *    Este es el punto que fallaba antes (D59): el vínculo nacía en
 *    `settleSubscriptionRegistration`, así que todo checkout abandonado en la
 *    pantalla de Flow creaba un `cus_…` nuevo en el intento siguiente.
 *  - **A prueba de carreras.** Dos peticiones simultáneas pueden crear dos clientes
 *    en Flow (inevitable: no hay create-if-not-exists), pero solo una gana el
 *    UNIQUE; la perdedora descarta el suyo y reusa el ganador, de modo que jamás se
 *    cobra contra el huérfano. El huérfano se registra en el log con su id para
 *    poder limpiarlo desde el panel de Flow.
 *  - **Auto-sanación.** Si Flow reporta el cliente como eliminado (`status='0'`),
 *    se crea uno nuevo y se repunta el vínculo.
 */
export async function ensureFlowCustomer(
  container: MedusaContainer,
  args: EnsureFlowCustomerArgs,
): Promise<string> {
  const config = getFlowConfig();
  const svc = service(container);

  const existing = await getFlowCustomerRecord(container, args.customerId);
  if (existing) {
    if (existing.status !== FLOW_CUSTOMER_STATUS.DELETED) return existing.flow_customer_id;

    // El cliente fue eliminado en Flow: el vínculo está muerto, hay que rehacerlo.
    console.warn(
      `[flow] El cliente ${existing.flow_customer_id} está eliminado en Flow; ` +
        `se creará uno nuevo para el customer ${args.customerId}.`,
    );
    const replacement = await createFlowCustomer(
      { name: args.name || FALLBACK_NAME, email: args.email, externalId: args.customerId },
      config,
    );
    await svc.updateFlowCustomers({
      id: existing.id,
      flow_customer_id: replacement.customerId,
      status: replacement.status ?? FLOW_CUSTOMER_STATUS.ACTIVE,
      pay_mode: replacement.payMode ?? null,
      register_date: parseFlowDate(replacement.registerDate),
      last_synced_at: new Date(),
    });
    return replacement.customerId;
  }

  // Sin vínculo: crear en Flow y persistir de inmediato.
  const created = await createFlowCustomer(
    { name: args.name || FALLBACK_NAME, email: args.email, externalId: args.customerId },
    config,
  );

  try {
    await svc.createFlowCustomers({
      customer_id: args.customerId,
      flow_customer_id: created.customerId,
      status: created.status ?? FLOW_CUSTOMER_STATUS.ACTIVE,
      pay_mode: created.payMode ?? null,
      register_date: parseFlowDate(created.registerDate),
      last_synced_at: new Date(),
    });
    return created.customerId;
  } catch (e) {
    // Carrera: otra petición ganó el UNIQUE mientras hablábamos con Flow.
    const winner = await getFlowCustomerRecord(container, args.customerId);
    if (winner) {
      console.warn(
        `[flow] Carrera al crear el cliente de ${args.customerId}: se usa ${winner.flow_customer_id} ` +
          `y queda HUÉRFANO ${created.customerId} en Flow (sin tarjeta ni cobros; ` +
          `eliminable desde el panel).`,
      );
      return winner.flow_customer_id;
    }
    throw e;
  }
}

/**
 * Re-lee el cliente desde Flow (`customer/get`) y refresca la fila local.
 * Úsalo cuando importe la verdad más reciente (¿tiene tarjeta?, ¿sigue activo?),
 * no en cada request: la fila local ya se refresca al crear y al sincronizar.
 *
 * Devuelve `null` si el cliente no tiene vínculo local.
 */
export async function syncFlowCustomer(
  container: MedusaContainer,
  customerId: string,
): Promise<FlowCustomer | null> {
  const local = await getFlowCustomerRecord(container, customerId);
  if (!local) return null;

  const remote = await getFlowCustomer(local.flow_customer_id, getFlowConfig());
  await mirrorFromFlow(container, local.id, remote);
  return remote;
}

/**
 * ¿Se le puede cobrar server-to-server a este cliente? Responde con el estado LOCAL
 * (`status='1'` + `pay_mode='auto'`), sin ir a la red.
 *
 * `pay_mode` es la respuesta autoritativa de Flow a esta pregunta; el valor local
 * es un espejo, así que ante una decisión de dinero conviene refrescarlo antes con
 * `syncFlowCustomer`.
 */
export async function canChargeFlowCustomer(
  container: MedusaContainer,
  customerId: string,
): Promise<boolean> {
  const local = await getFlowCustomerRecord(container, customerId);
  if (!local) return false;
  return isChargeable({ status: local.status, payMode: local.pay_mode ?? undefined });
}

/**
 * Empuja a Flow los datos del cliente cuando cambian en Manada (`customer/edit`).
 *
 * BEST-EFFORT a propósito: mantener el nombre/correo sincronizados en la pasarela
 * es deseable, pero jamás debe hacer fallar la edición de perfil del usuario ni
 * quedar acoplado a la disponibilidad de Flow. Si no hay vínculo, es no-op: solo
 * los clientes que llegaron a suscribirse existen en Flow.
 *
 * No se guarda copia local de nombre/correo para comparar: ese hecho ya tiene dueño
 * (el `customer` de Medusa) y duplicarlo solo para ahorrar una llamada rara —los
 * clientes con vínculo son pocos y editan su perfil muy de vez en cuando— sería
 * cambiar consistencia por micro-optimización.
 */
export async function syncFlowCustomerProfile(
  container: MedusaContainer,
  args: EnsureFlowCustomerArgs,
): Promise<void> {
  const local = await getFlowCustomerRecord(container, args.customerId);
  if (!local || local.status === FLOW_CUSTOMER_STATUS.DELETED) return;

  try {
    const updated = await editFlowCustomer(
      {
        customerId: local.flow_customer_id,
        name: args.name || FALLBACK_NAME,
        email: args.email,
      },
      getFlowConfig(),
    );
    await mirrorFromFlow(container, local.id, updated);
  } catch (e) {
    const detail = e instanceof FlowApiError ? e.message : String(e);
    console.warn(
      `[flow] No se pudo sincronizar el perfil de ${args.customerId} con Flow (se reintentará ` +
        `en la próxima edición): ${detail}`,
    );
  }
}

/**
 * Registra el resultado de una tokenización en la fila local: tras
 * `customer/getRegisterStatus` sabemos que el cliente YA tiene tarjeta, así que
 * `pay_mode` pasa a `auto` sin necesidad de un `customer/get` extra.
 *
 * No guarda marca ni últimos 4: ese hecho es de `saved_card` (§10).
 */
export async function markFlowCardRegistered(
  container: MedusaContainer,
  customerId: string,
): Promise<void> {
  const local = await getFlowCustomerRecord(container, customerId);
  if (!local) return;
  await service(container).updateFlowCustomers({
    id: local.id,
    pay_mode: "auto",
    register_date: local.register_date ?? new Date(),
    last_synced_at: new Date(),
  });
}

export type { LocalFlowCustomer };
