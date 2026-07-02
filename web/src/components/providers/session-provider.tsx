"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { User } from "@/types";
import { DEMO_USER } from "@/lib/demo-data";

/**
 * Estado de sesión / cuenta de Manada (Fase 3.3B — New User Experience).
 *
 * Habilita el embudo de activación: por defecto el visitante es **anónimo**
 * (no hay cuenta ni mascota sembrada), lo que destraba la landing, el alta de
 * mascota y el registro "valor primero" (la cuenta se crea para GUARDAR el
 * perfil ya construido). Sin backend: el estado vive en memoria (coherente con
 * D13; la persistencia y la auth real entran en Fase 4).
 *
 * La coordinación con el carrito y la mascota (sembrar el demo al "ingresar",
 * limpiar al salir) vive en `useAuthActions()` para no acoplar providers.
 */
export type SessionStatus = "anonymous" | "authenticated";

interface SessionContextValue {
  user: User | null;
  status: SessionStatus;
  /** Crea la cuenta (registro mínimo) y deja la sesión iniciada. */
  signUp: (data: { firstName: string; email: string }) => User;
  /** Entra como el usuario demo (Carlos) — pensado para revisar la app logueada. */
  signInDemo: () => User;
  /** Cierra la sesión (vuelve a anónimo). */
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signUp = useCallback<SessionContextValue["signUp"]>((data) => {
    const next: User = {
      id: `u_${Date.now()}`,
      firstName: data.firstName.trim(),
      email: data.email.trim(),
    };
    setUser(next);
    return next;
  }, []);

  const signInDemo = useCallback<SessionContextValue["signInDemo"]>(() => {
    const next: User = {
      id: DEMO_USER.id,
      firstName: DEMO_USER.firstName,
      email: "carlos@ejemplo.cl",
      comuna: DEMO_USER.comuna,
      region: DEMO_USER.region,
    };
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      status: user ? "authenticated" : "anonymous",
      signUp,
      signInDemo,
      signOut,
    }),
    [user, signUp, signInDemo, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
