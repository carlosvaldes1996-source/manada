"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field } from "./field";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Combobox con filtrado por texto y navegación por teclado (↑/↓/Enter/Esc).
 * Útil cuando un Select tendría demasiadas opciones (comuna, marca, raza).
 * Implementa roles ARIA combobox/listbox/option y aria-activedescendant.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecciona…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados",
  label,
  hint,
  error,
  disabled,
  id,
  className,
}: ComboboxProps) {
  const reactId = React.useId();
  const listId = `${id ?? reactId}-list`;
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) setActiveIndex(0);
  }

  function onQueryChange(q: string) {
    setQuery(q);
    setActiveIndex(0);
  }

  function commit(opt: ComboboxOption) {
    onValueChange?.(opt.value);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      commit(filtered[activeIndex]);
    }
  }

  const control = (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-invalid={error ? true : undefined}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border-default bg-surface px-3.5 text-[15px] transition-colors hover:border-border-strong focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-terracota-100 disabled:opacity-60 aria-[invalid=true]:border-[var(--error)]",
          selected ? "text-text-primary" : "text-text-muted",
          className,
        )}
      >
        {selected?.label ?? placeholder}
        <ChevronsUpDown className="size-4 shrink-0 text-text-muted" aria-hidden />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-[90] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-surface shadow-md"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).querySelector("input")?.focus();
          }}
        >
          <div className="flex items-center gap-2 border-b border-border-default px-3">
            <Search className="size-4 text-text-muted" aria-hidden />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
              className="h-11 w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-60 overflow-auto p-1.5">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-text-muted">{emptyMessage}</li>
            )}
            {filtered.map((opt, i) => {
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={opt.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => commit(opt)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-[15px] text-text-primary",
                    isActive && "bg-brand-soft text-text-brand",
                  )}
                >
                  {opt.label}
                  {isSelected && <Check className="size-4 text-terracota-500" aria-hidden />}
                </li>
              );
            })}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );

  if (!label && !hint && !error) return control;
  return (
    <Field label={label} hint={hint} error={error}>
      {control}
    </Field>
  );
}
