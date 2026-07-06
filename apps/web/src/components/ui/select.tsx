"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field } from "./field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
}

/**
 * Select accesible (Radix) re-estilizado a la marca. Teclado, foco y rol de
 * listbox vienen resueltos. Para opciones a medida usar los subcomponentes.
 */
export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Selecciona…",
  label,
  hint,
  error,
  required,
  disabled,
  name,
  id,
  className,
}: SelectProps) {
  const reactId = React.useId();
  const selectId = id ?? reactId;

  const trigger = (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={selectId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border-default bg-surface px-3.5 text-[15px] text-text-primary transition-colors hover:border-border-strong focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-terracota-100 data-[placeholder]:text-text-muted disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-[var(--error)]",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-text-muted" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-[90] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-surface shadow-md data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="relative flex cursor-pointer select-none items-center rounded-[var(--radius-sm)] py-2 pr-8 pl-3 text-[15px] text-text-primary outline-none data-[highlighted]:bg-brand-soft data-[highlighted]:text-text-brand data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5 inline-flex">
                  <Check className="size-4 text-terracota-500" aria-hidden />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );

  if (!label && !hint && !error) return trigger;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={selectId}>
      {trigger}
    </Field>
  );
}
