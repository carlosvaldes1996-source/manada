"use client";

import { useMediaQuery } from "./use-media-query";

/**
 * `true` si el usuario pidió reducir el movimiento.
 * `MotionConfig reducedMotion="user"` ya neutraliza las animaciones de Framer;
 * este hook es para decisiones manuales (p. ej. no auto-reproducir un pulso).
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
