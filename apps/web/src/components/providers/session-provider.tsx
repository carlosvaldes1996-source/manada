"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@/types";
import { getCurrentCustomer, logoutCustomer } from "@/lib/medusa";

/**
 * Sesión / cuenta de Manada sobre el Customer + Auth Module de Medusa
 * (Fase 5 · Etapa A). La sesión es **real y persistente**: el SDK guarda el JWT
 * en localStorage (client.ts), así que al montar se re-hidrata el cliente con
 * `getCurrentCustomer()`. El visitante sin token es **anónimo** (embudo de
 * activación + compra de invitado intactos).
 *
 * Este provider NO orquesta el carrito ni las mascotas: el login/registro y la
 * transferencia del carrito viven en `useAuthActions` (que llama a `refresh`),
 * para no acoplar los providers entre sí.
 */
export type SessionStatus = "anonymous" | "authenticated";

/** Datos mínimos del comprador invitado (checkout sin cuenta). */
export interface GuestInfo {
  firstName: string;
  email: string;
}

interface SessionContextValue {
  user: User | null;
  status: SessionStatus;
  /** `true` mientras se resuelve la sesión inicial (evita parpadeos en `/cuenta`). */
  isLoading: boolean;
  /**
   * Comprador invitado de la última compra sin cuenta (registro "valor primero"
   * post-compra). En memoria; `null` si no aplica.
   */
  guest: GuestInfo | null;
  setGuest: (guest: GuestInfo | null) => void;
  /** Re-lee el cliente autenticado desde el backend (tras login/registro). */
  refresh: () => Promise<void>;
  /** Cierra la sesión real (token del SDK) y vuelve a anónimo. */
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guest, setGuest] = useState<GuestInfo | null>(null);

  // Re-hidrata la sesión persistida al montar.
  useEffect(() => {
    let active = true;
    getCurrentCustomer()
      .then((u) => active && setUser(u))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const u = await getCurrentCustomer();
    setUser(u);
    if (u) setGuest(null); // la cuenta absorbe al invitado
  }, []);

  const signOut = useCallback(async () => {
    await logoutCustomer();
    setUser(null);
    setGuest(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      status: user ? "authenticated" : "anonymous",
      isLoading,
      guest,
      setGuest,
      refresh,
      signOut,
    }),
    [user, isLoading, guest, refresh, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
