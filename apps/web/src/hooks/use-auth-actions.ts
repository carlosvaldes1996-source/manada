"use client";

import { useCallback } from "react";
import { useSession, usePet, useCart } from "@/components/providers";
import {
  loginCustomer,
  registerCustomer,
  type RegisterInput,
} from "@/lib/medusa";

/**
 * Acciones de cuenta que coordinan sesión + carrito + mascotas sin acoplar los
 * providers entre sí (Fase 5 · Etapa A). Todo sobre auth NATIVO de Medusa.
 *
 * - `login` / `register`: autentican (lib/medusa) → **transfieren el carrito de
 *   invitado** al cliente (`transferCart`) → refrescan sesión. Así la orden que
 *   complete queda ligada a su cuenta y aparece en su historial. Solo el
 *   `register` (cuenta nueva) adopta además la mascota del onboarding
 *   (`requestGuestTransfer`); el `login` a una cuenta existente no la mezcla.
 * - `logout`: cierra la sesión real, olvida el carrito local y limpia mascotas.
 *
 * Devuelven `{ ok, error }` con el mensaje ya traducido para la UI.
 */
export interface AuthResult {
  ok: boolean;
  error?: string;
}

/** Traduce errores del backend a mensajes de la UI (sin filtrar detalles técnicos). */
function toMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const lower = raw.toLowerCase();
  if (lower.includes("unauthorized") || lower.includes("invalid") || lower.includes("401")) {
    return "Correo o contraseña incorrectos.";
  }
  if (lower.includes("already") || lower.includes("exists") || lower.includes("duplicate")) {
    return "Ya existe una cuenta con ese correo. Inicia sesión.";
  }
  return raw || fallback;
}

export function useAuthActions() {
  const { refresh, signOut } = useSession();
  const { transferToCustomer, reset } = useCart();
  const { clearPets, requestGuestTransfer } = usePet();

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        await loginCustomer(email, password);
        await transferToCustomer();
        await refresh();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: toMessage(err, "No pudimos iniciar tu sesión.") };
      }
    },
    [refresh, transferToCustomer],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<AuthResult> => {
      try {
        await registerCustomer(input);
        // Cuenta nueva: adoptar la mascota del onboarding en la transición a
        // `authenticated` que dispara `refresh()` (el intent es síncrono).
        requestGuestTransfer();
        await transferToCustomer();
        await refresh();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: toMessage(err, "No pudimos crear tu cuenta.") };
      }
    },
    [refresh, transferToCustomer, requestGuestTransfer],
  );

  const logout = useCallback(async () => {
    await signOut();
    reset();
    clearPets();
  }, [signOut, reset, clearPets]);

  return { login, register, logout };
}
