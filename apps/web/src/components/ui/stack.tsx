import * as React from "react";
import { cn } from "@/lib/utils";

const gaps = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
} as const;

const aligns = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;

const justifies = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
} as const;

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  direction?: "row" | "col";
  gap?: keyof typeof gaps;
  align?: keyof typeof aligns;
  justify?: keyof typeof justifies;
  wrap?: boolean;
}

/**
 * Flex genérico (vertical por defecto) con escala de gap del design system.
 * `Stack` cubre la mayoría de layouts 1D; usar `Grid` para 2D.
 */
export function Stack({
  as: Comp = "div",
  direction = "col",
  gap = 4,
  align,
  justify,
  wrap = false,
  className,
  ...props
}: StackProps) {
  return (
    <Comp
      className={cn(
        "flex",
        direction === "col" ? "flex-col" : "flex-row",
        gaps[gap],
        align && aligns[align],
        justify && justifies[justify],
        wrap && "flex-wrap",
        className,
      )}
      {...props}
    />
  );
}

/** Atajo horizontal centrado verticalmente — patrón muy común (íconos + texto). */
export function Row({ align = "center", direction = "row", ...props }: StackProps) {
  return <Stack direction={direction} align={align} {...props} />;
}
