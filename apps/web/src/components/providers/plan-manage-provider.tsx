"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { PlanManageSheet } from "@/components/commerce/plan-manage-sheet";
import type { SubscriptionView } from "@/types";

/**
 * Punto de entrada ÚNICO a la gestión del plan (D56 · Bloque D) — mismo patrón que
 * `SubscribeFlow`. La Home y `/cuenta` llaman `open(subscription)` y se abre la
 * MISMA `PlanManageSheet` (reutilización total). El sheet lee la suscripción viva
 * del `SubscriptionProvider` por id, así que solo se pasa el identificador.
 */
interface PlanManageValue {
  open: (subscription: SubscriptionView) => void;
}

const PlanManageContext = createContext<PlanManageValue | null>(null);

export function PlanManageProvider({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = useCallback((subscription: SubscriptionView) => setOpenId(subscription.id), []);
  const close = useCallback(() => setOpenId(null), []);
  const value = useMemo<PlanManageValue>(() => ({ open }), [open]);

  return (
    <PlanManageContext.Provider value={value}>
      {children}
      <PlanManageSheet openId={openId} onClose={close} />
    </PlanManageContext.Provider>
  );
}

export function usePlanManage(): PlanManageValue {
  const ctx = useContext(PlanManageContext);
  if (!ctx) throw new Error("usePlanManage debe usarse dentro de <PlanManageProvider>");
  return ctx;
}
