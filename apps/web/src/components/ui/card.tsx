import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tarjeta — unidad base de agrupación (DESIGN_SYSTEM §8, §11).
 * Superficie blanca, radio lg, sombra sm; hover sube a md cuando es interactiva.
 * Subcomponentes opcionales para estructura consistente (Header/Title/Content/Footer).
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  /** Reduce el padding a 0 (para media a sangre). */
  flush?: boolean;
  /** Eleva la sombra al hover (tarjetas clicables). */
  interactive?: boolean;
}

export function Card({
  as: Comp = "div",
  flush = false,
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <Comp
      className={cn(
        "rounded-[var(--radius-lg)] border border-border-default bg-surface shadow-sm",
        flush ? "overflow-hidden p-0" : "p-6",
        interactive &&
          "transition-[transform,box-shadow] duration-[var(--duration-standard)] hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("heading-4 text-text-primary", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("body-s text-text-secondary", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-3", className)} {...props} />;
}
