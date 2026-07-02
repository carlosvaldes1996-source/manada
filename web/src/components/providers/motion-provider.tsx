"use client";

import { MotionConfig } from "framer-motion";

/**
 * Configura Framer Motion para todo el árbol.
 * `reducedMotion="user"` respeta prefers-reduced-motion del sistema (a11y §11):
 * desactiva animaciones de transform/layout y mantiene solo fades cortos.
 * Easing/duraciones de marca viven en CSS vars (DESIGN_SYSTEM §10).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
