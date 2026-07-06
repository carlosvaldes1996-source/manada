import * as React from "react";
import { cn } from "@/lib/utils";
import { Container, type ContainerProps } from "./container";

const spacing = {
  none: "",
  sm: "py-8 lg:py-12",
  /** Ritmo vertical estándar de sección (40 móvil → 72 desktop, §9.1). */
  md: "py-10 lg:py-[72px]",
  lg: "py-12 lg:py-24",
} as const;

const tones = {
  canvas: "",
  subtle: "bg-subtle",
  brand: "bg-brand-soft",
  accent: "bg-accent-soft",
  inverse: "bg-[var(--bg-inverse)] text-[var(--text-inverse)]",
} as const;

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  spacing?: keyof typeof spacing;
  tone?: keyof typeof tones;
  /** Si `false`, no envuelve el contenido en <Container> (para full-bleed). */
  contained?: boolean;
  containerSize?: ContainerProps["size"];
}

/**
 * Banda vertical de página con ritmo y tono de fondo consistentes.
 * Por defecto centra su contenido en un <Container>.
 */
export function Section({
  as: Comp = "section",
  spacing: s = "md",
  tone = "canvas",
  contained = true,
  containerSize,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <Comp className={cn(spacing[s], tones[tone], className)} {...props}>
      {contained ? <Container size={containerSize}>{children}</Container> : children}
    </Comp>
  );
}
