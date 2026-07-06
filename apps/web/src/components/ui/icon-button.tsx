import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Botón de solo ícono. Exige `label` (aria-label) — sin texto visible, la
 * etiqueta accesible es obligatoria (a11y §13). Área táctil ≥44px en `md`.
 */
const iconButtonVariants = cva(
  "inline-grid place-items-center rounded-[var(--radius-pill)] text-text-primary transition-colors duration-[var(--duration-micro)] active:scale-[.96] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]",
  {
    variants: {
      variant: {
        ghost: "hover:bg-subtle",
        solid: "bg-terracota-500 text-white hover:bg-terracota-600",
        outline: "border border-border-default hover:bg-subtle",
      },
      size: { sm: "size-9 text-[18px]", md: "size-11 text-[20px]", lg: "size-12 text-[22px]" },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  },
);

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">,
    VariantProps<typeof iconButtonVariants> {
  label: string;
  asChild?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, label, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        aria-label={label}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
IconButton.displayName = "IconButton";
