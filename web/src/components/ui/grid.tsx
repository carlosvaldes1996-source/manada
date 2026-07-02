import * as React from "react";
import { cn } from "@/lib/utils";

const gaps = {
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
} as const;

/**
 * Mapas estáticos de columnas por breakpoint. Se enumeran como literales para
 * que el scanner de Tailwind v4 los detecte (no concatenar clases en runtime).
 */
const baseCols: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
  12: "grid-cols-12",
};
const smCols: Record<number, string> = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" };
const mdCols: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};
const lgCols: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  6: "lg:grid-cols-6",
};

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  cols?: number;
  sm?: number;
  md?: number;
  lg?: number;
  gap?: keyof typeof gaps;
}

/**
 * Grid responsive declarativo. Ej: `<Grid cols={2} md={3} lg={4}>` = grilla de
 * catálogo (2→3→4, DESIGN_SYSTEM §9.4). Para layouts ad-hoc, usar Tailwind directo.
 */
export function Grid({
  as: Comp = "div",
  cols = 1,
  sm,
  md,
  lg,
  gap = 4,
  className,
  ...props
}: GridProps) {
  return (
    <Comp
      className={cn(
        "grid",
        baseCols[cols],
        sm && smCols[sm],
        md && mdCols[md],
        lg && lgCols[lg],
        gaps[gap],
        className,
      )}
      {...props}
    />
  );
}
