import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Une clases condicionales (clsx) y resuelve conflictos de Tailwind (twMerge).
 * Helper estándar consumido por todos los componentes (incl. shadcn/ui).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
