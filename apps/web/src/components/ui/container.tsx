import * as React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  /** Contenido máximo del design system (1280px). */
  default: "max-w-[var(--container-max)]",
  /** Lectura cómoda (texto largo, formularios). */
  prose: "max-w-3xl",
  /** Ancho completo, sin tope. */
  full: "max-w-none",
} as const;

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  size?: keyof typeof sizes;
}

/**
 * Centra el contenido y aplica los paddings responsive del grid
 * (16 móvil → 24 tablet → 32 desktop, DESIGN_SYSTEM §9.4).
 * Envoltura base de toda sección con ancho controlado.
 */
export function Container({
  as: Comp = "div",
  size = "default",
  className,
  ...props
}: ContainerProps) {
  return (
    <Comp
      className={cn("mx-auto w-full px-4 md:px-6 lg:px-8", sizes[size], className)}
      {...props}
    />
  );
}
