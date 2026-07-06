import { cn } from "@/lib/utils";

const sizes = {
  2: "h-2",
  4: "h-4",
  6: "h-6",
  8: "h-8",
  12: "h-12",
  16: "h-16",
  24: "h-24",
} as const;

export interface SpacerProps {
  size?: keyof typeof sizes;
  /** Si crece para empujar contenido en un contenedor flex (margin-auto). */
  grow?: boolean;
  className?: string;
}

/**
 * Espacio vertical explícito entre bloques cuando el gap del contenedor no
 * aplica. `grow` lo convierte en un empujador flexible (`flex-1`).
 */
export function Spacer({ size = 4, grow = false, className }: SpacerProps) {
  return (
    <div
      aria-hidden
      className={cn(grow ? "flex-1" : sizes[size], "w-full shrink-0", className)}
    />
  );
}
