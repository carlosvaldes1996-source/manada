"use client";

import { useMediaQuery } from "./use-media-query";

/** Breakpoints del design system (DESIGN_SYSTEM §9.4) — espejo de Tailwind. */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** `true` cuando el viewport es ≥ al breakpoint dado (mobile-first). */
export function useBreakpoint(bp: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[bp]}px)`);
}

/** Atajo: `true` en viewports de escritorio (≥ lg, donde aparece la navbar). */
export function useIsDesktop(): boolean {
  return useBreakpoint("lg");
}
