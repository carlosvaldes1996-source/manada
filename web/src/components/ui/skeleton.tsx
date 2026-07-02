import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Forma del placeholder. */
  shape?: "rect" | "circle" | "text";
}

/**
 * Placeholder de carga con shimmer cálido (DESIGN_SYSTEM §10 — nada de spinners
 * fríos donde hay layout). Usa `bg-muted` y un barrido suave.
 * Las dimensiones se pasan por className (w-/h-) o `style`.
 */
export function Skeleton({ shape = "rect", className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      data-loading
      className={cn(
        "relative overflow-hidden bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)]",
        shape === "circle" && "rounded-full",
        shape === "rect" && "rounded-[var(--radius-md)]",
        shape === "text" && "h-4 rounded-md",
        className,
      )}
      {...props}
    />
  );
}
