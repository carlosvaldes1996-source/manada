"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { SubscriptionView } from "@/types";
import { listMySubscriptions } from "@/lib/medusa/subscriptions";
import { useSession } from "./session-provider";

/**
 * Estado global de las suscripciones del cliente (D56 · Bloque C).
 *
 * FUENTE DE VERDAD: el backend (`GET /store/subscriptions`, API.md §13). Al
 * autenticarse se hidrata desde ahí; sin sesión la lista se DERIVA vacía (no se
 * resetea estado en el efecto — regla `react-hooks`). Base compartida por la Home
 * (la `PetStatusCard` evoluciona según haya o no plan activo), la vista de
 * `/cuenta` y —más adelante— la gestión del Bloque D (que añadirá mutaciones y
 * llamará a `refresh`).
 *
 * El match suscripción↔mascota se hace por `product_id === currentFoodId` (D56·C).
 */
interface SubscriptionContextValue {
  subscriptions: SubscriptionView[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  /** Suscripción ACTIVA cuyo producto coincide con `productId` (o `undefined`). */
  activeForProduct: (productId?: string) => SubscriptionView | undefined;
  /** Suscripción VIGENTE (activa o pausada, no cancelada) para `productId`. La Home
   *  la usa para tratar un plan pausado como plan —invitar a reanudar— y no como
   *  "no suscrito" (D56·R1). */
  subscriptionForProduct: (productId?: string) => SubscriptionView | undefined;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [subscriptions, setSubscriptions] = useState<SubscriptionView[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const syncingRef = useRef(false);

  // Solo setea estado DESPUÉS del await (nada síncrono) → seguro de llamar desde el
  // efecto de hidratación sin disparar renders en cascada.
  const refresh = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      setSubscriptions(await listMySubscriptions());
      setHasLoaded(true);
    } catch (err) {
      // Sin backend no rompemos la sesión: el estado queda como esté.
      console.warn("[subscriptions] hidratación falló", err);
    } finally {
      syncingRef.current = false;
    }
  }, []);

  // Hidratación al autenticarse: fetch inline (mismo patrón que PetProvider) — el
  // estado se setea DENTRO del IIFE async, no llamando a un callback que setea, para
  // no disparar la regla de renders en cascada. `refresh` queda para uso externo
  // (Home al entrar, y las mutaciones del Bloque D).
  useEffect(() => {
    if (status !== "authenticated" || syncingRef.current) return;
    syncingRef.current = true;
    let active = true;
    void (async () => {
      try {
        const subs = await listMySubscriptions();
        if (active) {
          setSubscriptions(subs);
          setHasLoaded(true);
        }
      } catch (err) {
        console.warn("[subscriptions] hidratación falló", err);
      } finally {
        syncingRef.current = false;
      }
    })();
    return () => {
      active = false;
    };
  }, [status]);

  const value = useMemo<SubscriptionContextValue>(() => {
    const authed = status === "authenticated";
    // Solo con sesión se exponen; sin ella, lista vacía (derivado, no reset de estado).
    const effective = authed ? subscriptions : [];
    return {
      subscriptions: effective,
      isLoading: authed && !hasLoaded,
      refresh,
      activeForProduct: (productId?: string) =>
        productId
          ? effective.find((s) => s.status === "active" && s.productId === productId)
          : undefined,
      subscriptionForProduct: (productId?: string) =>
        productId
          ? effective.find((s) => s.status !== "cancelled" && s.productId === productId)
          : undefined,
    };
  }, [status, subscriptions, hasLoaded, refresh]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscriptions(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscriptions debe usarse dentro de <SubscriptionProvider>");
  return ctx;
}
