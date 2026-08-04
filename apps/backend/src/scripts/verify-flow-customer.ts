import crypto from "crypto";
import type { ExecArgs } from "@medusajs/framework/types";
import { FLOW_CUSTOMER_MODULE } from "../modules/flow-customer";
import type FlowCustomerModuleService from "../modules/flow-customer/service";
import {
  getFlowCustomerRecord,
  canChargeFlowCustomer,
  markFlowCardRegistered,
} from "../lib/flow-customer";
import { signParams, isChargeable, FLOW_PAY_MODE, FLOW_CUSTOMER_STATUS } from "../lib/flow";

/**
 * Verificación de la Etapa 1 (Customers, D70) — `npx medusa exec ./src/scripts/verify-flow-customer.ts`.
 *
 * Comprueba lo que se AFIRMA del diseño, sin tocar la red (Flow no se llama aquí):
 *  1. La firma HMAC reproduce el ejemplo trabajado de la doc oficial.
 *  2. El UNIQUE sobre `customer_id` impide de verdad dos clientes de Flow por cliente.
 *  3. El orquestador lee/actualiza el vínculo y responde bien a "¿puedo cobrarle?".
 *
 * Limpia lo que crea. No sirve como test de integración con Flow: eso exige llaves
 * y un ngrok para el callback (ver `apps/backend/DEV.md`).
 */

const TEST_CUSTOMER = "cus_test_verify_d70";

export default async function verifyFlowCustomer({ container }: ExecArgs) {
  const svc = container.resolve<FlowCustomerModuleService>(FLOW_CUSTOMER_MODULE);
  const results: string[] = [];
  const fail: string[] = [];
  const check = (name: string, ok: boolean, detail = "") =>
    (ok ? results : fail).push(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);

  // ── 1. Firma: ejemplo textual de la doc oficial ────────────────────────────
  // Doc §"¿Cómo firmar con su SecretKey?": con apiKey/currency/amount el string a
  // firmar debe ser "amount5000apiKeyXXXX-XXXX-XXXXcurrencyCLP".
  const secret = "test-secret";
  const expected = require("crypto")
    .createHmac("sha256", secret)
    .update("amount5000apiKeyXXXX-XXXX-XXXXcurrencyCLP")
    .digest("hex");
  const actual = signParams({ apiKey: "XXXX-XXXX-XXXX", currency: "CLP", amount: 5000 }, secret);
  check("Firma HMAC reproduce el ejemplo de la doc", actual === expected);

  // La firma debe ignorar `s` y ser estable ante el orden de inserción.
  const reordered = signParams({ currency: "CLP", amount: 5000, apiKey: "XXXX-XXXX-XXXX" }, secret);
  check("Firma estable ante el orden de las claves", reordered === expected);

  // ── 2. Idempotencia dura: UNIQUE por cliente ───────────────────────────────
  await svc.deleteFlowCustomers({ customer_id: TEST_CUSTOMER }).catch(() => {});

  const first = await svc.createFlowCustomers({
    customer_id: TEST_CUSTOMER,
    flow_customer_id: "cus_flow_aaa",
    status: FLOW_CUSTOMER_STATUS.ACTIVE,
  });
  check("Se crea el vínculo", Boolean(first?.id));

  let blocked = false;
  try {
    await svc.createFlowCustomers({
      customer_id: TEST_CUSTOMER,
      flow_customer_id: "cus_flow_bbb",
      status: FLOW_CUSTOMER_STATUS.ACTIVE,
    });
  } catch {
    blocked = true;
  }
  check(
    "Un 2º cliente de Flow para el MISMO cliente es rechazado por la BD",
    blocked,
    blocked ? "" : "¡el UNIQUE no está actuando!",
  );

  // ── 3. Orquestador ─────────────────────────────────────────────────────────
  const record = await getFlowCustomerRecord(container, TEST_CUSTOMER);
  check("getFlowCustomerRecord devuelve el vínculo", record?.flow_customer_id === "cus_flow_aaa");

  check(
    "Sin pay_mode todavía NO se puede cobrar",
    (await canChargeFlowCustomer(container, TEST_CUSTOMER)) === false,
  );

  await markFlowCardRegistered(container, TEST_CUSTOMER);
  check(
    "Tras registrar tarjeta, pay_mode=auto y SÍ se puede cobrar",
    (await canChargeFlowCustomer(container, TEST_CUSTOMER)) === true,
  );

  const afterRegister = await getFlowCustomerRecord(container, TEST_CUSTOMER);
  check("Se guardó la fecha de registro", Boolean(afterRegister?.register_date));

  // Cliente eliminado en Flow ⇒ no cobrable, aunque tenga pay_mode auto.
  check(
    "status='0' (eliminado en Flow) ⇒ no cobrable",
    isChargeable({ status: FLOW_CUSTOMER_STATUS.DELETED, payMode: FLOW_PAY_MODE.AUTO }) === false,
  );
  check(
    "pay_mode='manual' ⇒ no cobrable",
    isChargeable({ status: FLOW_CUSTOMER_STATUS.ACTIVE, payMode: FLOW_PAY_MODE.MANUAL }) === false,
  );

  // ── Limpieza ───────────────────────────────────────────────────────────────
  await svc.deleteFlowCustomers({ customer_id: TEST_CUSTOMER }).catch(() => {});
  const gone = await getFlowCustomerRecord(container, TEST_CUSTOMER);
  check("Limpieza: el vínculo de prueba se eliminó", gone === null);

  console.log(`\n[D70 · Etapa 1 Customers] Verificación\n${"─".repeat(60)}`);
  for (const r of results) console.log(r);
  for (const f of fail) console.log(f);
  console.log("─".repeat(60));
  console.log(`${results.length} OK · ${fail.length} fallidas\n`);
  if (fail.length) throw new Error(`${fail.length} verificación(es) fallida(s)`);
}
