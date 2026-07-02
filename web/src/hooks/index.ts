/** Barrel de hooks reutilizables. Importa desde "@/hooks". */
export * from "./use-disclosure";
export * from "./use-media-query";
export * from "./use-breakpoint";
export * from "./use-prefers-reduced-motion";
export * from "./use-subscription";
export * from "./use-auth-actions";
// Estado global (Session/Pet/Cart) y feedback (Toast) se exponen desde providers / ui.
export { useSession, usePet, useCart } from "@/components/providers";
export { useToast } from "@/components/ui/toast";
