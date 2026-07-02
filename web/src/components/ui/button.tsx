import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Botón — la acción de la marca (DESIGN_SYSTEM §11).
 * - primary: Terracota (acción principal, un solo primary por vista).
 * - secondary: borde Terracota, fondo transparente.
 * - ghost: sin fondo, hover sutil.
 * - subscribe: Miel (acento de anticipación/suscripción; texto Carbón por a11y).
 * - link: se ve como enlace de acción.
 * Microinteracción: press scale .98, hover eleva sombra (§10).
 * `asChild` permite renderizar como <Link> conservando estilos (Radix Slot).
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-transparent font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-[var(--duration-micro)] active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]",
  {
    variants: {
      variant: {
        primary:
          "bg-terracota-500 text-white hover:bg-terracota-600 hover:shadow-md hover:-translate-y-px",
        secondary:
          "border-terracota-500 text-terracota-600 hover:bg-terracota-50",
        ghost: "text-text-primary hover:bg-subtle",
        subscribe:
          "bg-miel-500 text-neutral-800 hover:bg-miel-600 hover:shadow-md hover:-translate-y-px",
        link: "text-text-brand underline-offset-4 hover:underline rounded-none px-0 h-auto",
        destructive: "bg-[var(--error)] text-white hover:opacity-90",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-[15px]",
        lg: "h-[52px] px-7 text-base",
        icon: "size-11",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Muestra un spinner y deshabilita la interacción. */
  loading?: boolean;
  /** Ícono al inicio (lucide). Se oculta mientras `loading`. */
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      block,
      asChild = false,
      loading = false,
      leadingIcon,
      trailingIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    // Slot exige un único hijo: cuando asChild, delegamos el contenido al consumidor.
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : leadingIcon}
            {children}
            {!loading && trailingIcon}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
