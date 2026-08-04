import type { ExecArgs } from "@medusajs/framework/types";
import { FLOW_SUBSCRIPTION_MODULE } from "../modules/flow-subscription";
import type FlowSubscriptionModuleService from "../modules/flow-subscription/service";
import {
  flowPlanIdFor,
  planSpecFromWeeks,
  assertValidPlanSpec,
  getFlowPlanRecord,
} from "../lib/flow-plan";
import {
  getFlowSubscriptionRecord,
  getFlowSubscriptionForManada,
  linkToManadaSubscription,
} from "../lib/flow-subscription";
import { FLOW_INTERVAL, FLOW_SUBSCRIPTION_STATUS, FLOW_ITEM_CHANGE_TYPE } from "../lib/flow";

/**
 * Verificación de la Etapa 2 (Subscriptions, D71) —
 * `npx medusa exec ./src/scripts/verify-flow-subscription.ts`.
 *
 * Comprueba sin tocar la red las propiedades de las que depende el diseño:
 *  1. El `planId` determinista: mismo precio+cadencia ⇒ mismo id; distinto ⇒ distinto.
 *  2. El mapeo semanas → (`interval`, `interval_count`) de Manada a Flow.
 *  3. Las validaciones rechazan tarifas imposibles antes de gastar una llamada.
 *  4. Los UNIQUE impiden duplicar planes y duplicar la suscripción de una de Manada,
 *     **pero permiten N suscripciones aún sin enlazar** (NULLs múltiples).
 *  5. El enlace tardío con Manada funciona (es lo que usará la etapa siguiente).
 *
 * No es un test de integración con Flow: eso exige llaves reales (`FLOW_API_KEY`).
 */

const T = "sub_test_verify_d71";

export default async function verifyFlowSubscription({ container }: ExecArgs) {
  const svc = container.resolve<FlowSubscriptionModuleService>(FLOW_SUBSCRIPTION_MODULE);
  const ok: string[] = [];
  const bad: string[] = [];
  const check = (name: string, cond: boolean, detail = "") =>
    (cond ? ok : bad).push(`${cond ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);

  // ── 1. planId determinista ─────────────────────────────────────────────────
  const a = planSpecFromWeeks(29990, 4);
  const b = planSpecFromWeeks(29990, 4);
  const c = planSpecFromWeeks(29990, 2);
  const d = planSpecFromWeeks(19990, 4);

  check("Mismo precio+cadencia ⇒ MISMO planId", flowPlanIdFor(a) === flowPlanIdFor(b));
  check("Distinta cadencia ⇒ distinto planId", flowPlanIdFor(a) !== flowPlanIdFor(c));
  check("Distinto precio ⇒ distinto planId", flowPlanIdFor(a) !== flowPlanIdFor(d));
  check(
    "planId legible y sin espacios",
    flowPlanIdFor(a) === "MANADA-CLP-29990-W4" && !/\s/.test(flowPlanIdFor(a)),
    flowPlanIdFor(a),
  );

  // ── 2. Mapeo de cadencia Manada → Flow ─────────────────────────────────────
  check(
    "4 semanas ⇒ interval=2 (semanal), interval_count=4",
    a.interval === FLOW_INTERVAL.WEEKLY && a.intervalCount === 4,
  );
  check("2 semanas ⇒ interval_count=2", c.intervalCount === 2);

  // ── 3. Validaciones ────────────────────────────────────────────────────────
  const rejects = (spec: Parameters<typeof assertValidPlanSpec>[0]) => {
    try {
      assertValidPlanSpec(spec);
      return false;
    } catch {
      return true;
    }
  };
  check("Rechaza monto 0", rejects({ amount: 0, interval: 2, intervalCount: 4 }));
  check("Rechaza monto negativo", rejects({ amount: -100, interval: 2, intervalCount: 4 }));
  check("Rechaza monto no entero", rejects({ amount: 1999.5, interval: 2, intervalCount: 4 }));
  check("Rechaza intervalo inexistente", rejects({ amount: 1000, interval: 9, intervalCount: 1 }));
  check("Rechaza interval_count 0", rejects({ amount: 1000, interval: 2, intervalCount: 0 }));

  // ── 4. UNIQUE en la BD ─────────────────────────────────────────────────────
  await svc.deleteFlowPlans({ plan_id: "MANADA-CLP-1-W1" }).catch(() => {});
  await svc.deleteFlowSubscriptions({ flow_customer_id: "cus_test_d71" }).catch(() => {});

  await svc.createFlowPlans({
    plan_id: "MANADA-CLP-1-W1",
    amount: 1,
    currency_code: "clp",
    interval: 2,
    interval_count: 1,
    status: 1,
  });
  let dupPlan = false;
  try {
    await svc.createFlowPlans({
      plan_id: "MANADA-CLP-1-W1",
      amount: 1,
      currency_code: "clp",
      interval: 2,
      interval_count: 1,
      status: 1,
    });
  } catch {
    dupPlan = true;
  }
  check("Un plan duplicado es rechazado por la BD", dupPlan);
  check(
    "getFlowPlanRecord lee el plan",
    (await getFlowPlanRecord(container, "MANADA-CLP-1-W1"))?.amount === 1,
  );

  // ── 4b. CARRERA REAL sobre el mismo plan ───────────────────────────────────
  // Sustenta la afirmación de idempotencia: N procesos que intentan registrar el
  // MISMO `plan_id` a la vez deben dejar exactamente UNA fila. Se ejerce la ruta de
  // persistencia (la que decide el desenlace); la llamada a Flow no participa porque
  // el `planId` es determinista y todas apuntarían al mismo plan.
  await svc.deleteFlowPlans({ plan_id: "MANADA-CLP-777-W6" }).catch(() => {});
  const attempts = await Promise.allSettled(
    Array.from({ length: 8 }, () =>
      svc.createFlowPlans({
        plan_id: "MANADA-CLP-777-W6",
        amount: 777,
        currency_code: "clp",
        interval: 2,
        interval_count: 6,
        status: 1,
      }),
    ),
  );
  const survivors = (await svc.listFlowPlans({ plan_id: "MANADA-CLP-777-W6" })) as unknown[];
  const won = attempts.filter((a) => a.status === "fulfilled").length;
  check(
    "8 creaciones simultáneas del mismo plan ⇒ exactamente 1 fila",
    survivors.length === 1,
    `filas=${survivors.length}, exitosas=${won}`,
  );
  check("…y al menos una de las 8 falló (el UNIQUE actuó)", won < 8, `exitosas=${won}/8`);
  await svc.deleteFlowPlans({ plan_id: "MANADA-CLP-777-W6" }).catch(() => {});

  // Dos suscripciones SIN enlazar deben poder coexistir (NULLs múltiples).
  const s1 = await svc.createFlowSubscriptions({
    flow_subscription_id: "sus_test_aaa",
    flow_plan_id: "MANADA-CLP-1-W1",
    flow_customer_id: "cus_test_d71",
    subscription_id: null,
    status: FLOW_SUBSCRIPTION_STATUS.ACTIVE,
  });
  const s2 = await svc.createFlowSubscriptions({
    flow_subscription_id: "sus_test_bbb",
    flow_plan_id: "MANADA-CLP-1-W1",
    flow_customer_id: "cus_test_d71",
    subscription_id: null,
    status: FLOW_SUBSCRIPTION_STATUS.ACTIVE,
  });
  check("N suscripciones SIN enlazar conviven (UNIQUE ignora NULLs)", Boolean(s1?.id && s2?.id));

  // Pero una suscripción de Manada no puede quedar representada dos veces.
  await linkToManadaSubscription(container, {
    flowSubscriptionId: "sus_test_aaa",
    subscriptionId: T,
  });
  let dupLink = false;
  try {
    await linkToManadaSubscription(container, {
      flowSubscriptionId: "sus_test_bbb",
      subscriptionId: T,
    });
  } catch {
    dupLink = true;
  }
  check("Una suscripción de Manada NO puede tener dos en Flow", dupLink);

  // ── 5. Enlace tardío ───────────────────────────────────────────────────────
  const linked = await getFlowSubscriptionForManada(container, T);
  check("getFlowSubscriptionForManada resuelve el enlace", linked?.flow_subscription_id === "sus_test_aaa");
  check(
    "getFlowSubscriptionRecord resuelve por id de Flow",
    (await getFlowSubscriptionRecord(container, "sus_test_bbb"))?.subscription_id === null,
  );

  // ── Constantes fieles al spec ──────────────────────────────────────────────
  check(
    "Estados de suscripción del spec (0/1/2/4)",
    FLOW_SUBSCRIPTION_STATUS.NOT_STARTED === 0 &&
      FLOW_SUBSCRIPTION_STATUS.ACTIVE === 1 &&
      FLOW_SUBSCRIPTION_STATUS.TRIALING === 2 &&
      FLOW_SUBSCRIPTION_STATUS.CANCELLED === 4,
  );
  check(
    "changeType del spec (to_future / all)",
    FLOW_ITEM_CHANGE_TYPE.TO_FUTURE === "to_future" && FLOW_ITEM_CHANGE_TYPE.ALL === "all",
  );

  // ── Limpieza ───────────────────────────────────────────────────────────────
  await svc.deleteFlowSubscriptions({ flow_customer_id: "cus_test_d71" }).catch(() => {});
  await svc.deleteFlowPlans({ plan_id: "MANADA-CLP-1-W1" }).catch(() => {});
  check("Limpieza", (await getFlowSubscriptionForManada(container, T)) === null);

  console.log(`\n[D71 · Etapa 2 Subscriptions] Verificación\n${"─".repeat(62)}`);
  for (const r of ok) console.log(r);
  for (const f of bad) console.log(f);
  console.log("─".repeat(62));
  console.log(`${ok.length} OK · ${bad.length} fallidas\n`);
  if (bad.length) throw new Error(`${bad.length} verificación(es) fallida(s)`);
}
