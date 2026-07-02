import type { Transition, Variants } from "framer-motion";

/**
 * Presets de motion de Manada (DESIGN_SYSTEM §10).
 * El motion es "anticipatorio y con propósito", nunca decorativo.
 * Duraciones y easing son espejo de los tokens CSS (`--duration-*`, `--ease-*`).
 * Centralizar aquí evita duplicar curvas por todo el árbol y garantiza
 * que `MotionProvider` (reducedMotion="user") las pueda neutralizar.
 */

/** Duraciones en segundos (Framer usa segundos; los tokens CSS, ms). */
export const DURATION = {
  micro: 0.15,
  standard: 0.25,
  overlay: 0.4,
} as const;

/** Curvas de easing de marca (cubic-bezier → tupla que Framer entiende). */
export const EASE = {
  /** Entrada/estándar — ease-out suave. */
  out: [0.2, 0.8, 0.2, 1],
  /** Salida — ease-in. */
  in: [0.4, 0, 1, 1],
} as const;

export const transition = {
  micro: { duration: DURATION.micro, ease: EASE.out } satisfies Transition,
  standard: { duration: DURATION.standard, ease: EASE.out } satisfies Transition,
  overlay: { duration: DURATION.overlay, ease: EASE.out } satisfies Transition,
  spring: { type: "spring", stiffness: 420, damping: 32 } satisfies Transition,
} as const;

/** Fade + leve subida — entradas de cápsulas, banners, contenido personalizado. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transition.standard },
  exit: { opacity: 0, y: 8, transition: { ...transition.micro, ease: EASE.in } },
};

/** Solo fade — la variante segura cuando reduce-motion está activo. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.standard },
  exit: { opacity: 0, transition: transition.micro },
};

/** Contenedor con stagger — re-personalización al cambiar de mascota (§10). */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

/** Press/hover de botones — escala .98 al presionar, elevación al hover. */
export const pressable = {
  whileTap: { scale: 0.98 },
} as const;
