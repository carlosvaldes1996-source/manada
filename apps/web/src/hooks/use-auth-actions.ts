"use client";

import { useCallback } from "react";
import { useSession, usePet, useCart } from "@/components/providers";
import {
  confirmAccount,
  loginCustomer,
  registerCustomer,
  type RegisterInput,
  type RegisterOutcome,
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
 * **D82 · dos matices nuevos:**
 *  1. `register` puede terminar SIN sesión (`status: "verify_email"`): si ese correo
 *     ya tenía un customer invitado, la cuenta se adopta recién cuando el cliente usa
 *     el enlace que le llega por correo (API.md §17.3). La UI muestra "revisa tu correo".
 *  2. `login` consulta `confirmAccount()`, que devuelve `true` **una sola vez**: en el
 *     primer login posterior a esa activación. Solo ahí —y solo ahí— se adopta la
 *     mascota del onboarding, sin cambiar el comportamiento del login normal. La marca
 *     vive en el servidor (`has_account`), no en `localStorage`, así que es idempotente
 *     por construcción: no hay nada que "consumir" mal ni que se pueda repetir.
 *
 * Devuelven `{ ok, error }` con el mensaje ya traducido para la UI.
 */
export interface AuthResult {
  ok: boolean;
  error?: string;
  /** Solo en `register`: `verify_email` = no hay sesión, hay un correo esperando. */
  status?: RegisterOutcome;
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
        // §17.2: consuma una adopción pendiente. Devuelve `true` SOLO en el primer
        // login tras activar; en cualquier otro login es un no-op y la regla de
        // "el login no mezcla mascotas" queda intacta.
        if (await confirmAccount()) requestGuestTransfer();
        await transferToCustomer();
        await refresh();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: toMessage(err, "No pudimos iniciar tu sesión.") };
      }
    },
    [refresh, transferToCustomer, requestGuestTransfer],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<AuthResult> => {
      try {
        const status = await registerCustomer(input);
        // Había un invitado con ese correo: no hay sesión que abrir todavía. La
        // mascota y el carrito se adoptan en el login que venga después del enlace.
        if (status === "verify_email") return { ok: true, status };

        // Cuenta nueva: adoptar la mascota del onboarding en la transición a
        // `authenticated` que dispara `refresh()` (el intent es síncrono).
        requestGuestTransfer();
        await transferToCustomer();
        await refresh();
        return { ok: true, status };
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
