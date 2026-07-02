"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Suscribe a un media query y devuelve si matchea.
 * Usa `useSyncExternalStore` (patrón correcto para fuentes externas en React 19):
 * SSR-safe (snapshot del servidor = `false`) y sin setState en efectos.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
