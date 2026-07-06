"use client";

import { useCallback } from "react";
import { useSession, usePet, useCart } from "@/components/providers";
import { DEMO_PETS, DEMO_CART } from "@/lib/demo-data";

/**
 * Acciones de cuenta que coordinan los tres contextos (sesión + mascota +
 * carrito) sin acoplarlos entre sí (cada provider queda independiente).
 *
 * - `signInDemo()` entra como Carlos y **siembra** a Toby + su carrito, para
 *   poder revisar intacta la app logueada ya aprobada (Etapas 1–2).
 * - `signOut()` limpia los tres.
 *
 * El alta de mascota (onboarding) usa `usePet().addPet` y el registro
 * "valor primero" usa `useSession().signUp` directamente en sus pantallas.
 */
export function useAuthActions() {
  const { signInDemo, signOut } = useSession();
  const { seedPets, clearPets } = usePet();
  const { seedItems, clear } = useCart();

  const enterDemo = useCallback(() => {
    signInDemo();
    seedPets(DEMO_PETS, DEMO_PETS[0]?.id);
    seedItems(DEMO_CART);
  }, [signInDemo, seedPets, seedItems]);

  const leave = useCallback(() => {
    signOut();
    clearPets();
    clear();
  }, [signOut, clearPets, clear]);

  return { enterDemo, leave };
}
