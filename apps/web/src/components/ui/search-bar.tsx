"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onSubmit"> {
  /** Se dispara con Enter o al pulsar el ícono de búsqueda. */
  onSubmit?: (query: string) => void;
  onClear?: () => void;
  /** Variante visual: barra del header vs. campo en página. */
  variant?: "bar" | "field";
}

/**
 * Barra de búsqueda — el catálogo se navega por necesidad, pero la búsqueda es
 * prominente (DESIGN_SYSTEM §12.4). Form semántico (role=search) con limpiar.
 */
export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, placeholder = "Busca alimento, marca o síntoma…", onSubmit, onClear, variant = "bar", value, defaultValue, ...props }, ref) => {
    const [internal, setInternal] = React.useState(String(defaultValue ?? ""));
    const isControlled = value !== undefined;
    const current = isControlled ? String(value) : internal;

    return (
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(current);
        }}
        className={cn(
          "flex w-full items-center gap-2 transition-colors",
          variant === "bar"
            ? "rounded-[var(--radius-pill)] border border-border-default bg-subtle px-4 py-2.5 focus-within:border-border-focus focus-within:bg-surface"
            : "rounded-[var(--radius-md)] border border-border-default bg-surface px-3.5 py-3 focus-within:border-border-focus focus-within:ring-2 focus-within:ring-terracota-100",
          className,
        )}
      >
        <Search className="size-5 shrink-0 text-text-muted" aria-hidden />
        <input
          ref={ref}
          type="search"
          aria-label="Buscar"
          placeholder={placeholder}
          value={isControlled ? value : internal}
          onChange={(e) => {
            if (!isControlled) setInternal(e.target.value);
            props.onChange?.(e);
          }}
          className="w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
          {...props}
        />
        {current && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => {
              if (!isControlled) setInternal("");
              onClear?.();
            }}
            className="inline-flex shrink-0 rounded-full p-0.5 text-text-muted hover:text-text-primary"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </form>
    );
  },
);
SearchBar.displayName = "SearchBar";
