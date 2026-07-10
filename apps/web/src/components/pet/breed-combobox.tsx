"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Search, Check, ChevronDown, PawPrint, ArrowLeft } from "lucide-react";
import type { Species } from "@/types";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { searchBreeds, mestizoLabel, normalize } from "@/lib/breeds";
import { cn } from "@/lib/utils";

export interface BreedComboboxProps {
  species: Species;
  /** Raza elegida (nombre). "" / undefined = ninguna. */
  value?: string;
  onChange: (breed: string) => void;
  id?: string;
}

/**
 * Selector de raza premium del onboarding (funnel F2).
 *
 * Buscador tolerante a acentos sobre la lista curada CL (perro/gato), con
 * Mestizo/Quiltro fijado arriba y un escape "mi raza no aparece" que habilita el
 * ingreso manual (como antes). La raza elegida se muestra como Chip con ✕ para
 * cambiarla — atajo útil, no formulario. Especies sin lista ("otro") caen al
 * ingreso manual directo. Reusa las primitivas Radix del stack (Popover) y el
 * mismo lenguaje visual del `Combobox` genérico.
 */
export function BreedCombobox({ species, value, onChange, id }: BreedComboboxProps) {
  const reactId = React.useId();
  const listId = `${id ?? reactId}-breeds`;
  const hasList = species === "perro" || species === "gato";

  const [open, setOpen] = React.useState(false);
  const [manual, setManual] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const mestizo = mestizoLabel(species);

  const items = React.useMemo<string[]>(() => {
    if (!hasList) return [];
    const q = normalize(query);
    const names = searchBreeds(species, query).map((b) => b.nombre);
    const showMestizo = !q || normalize(mestizo).includes(q);
    return showMestizo ? [mestizo, ...names] : names;
  }, [hasList, species, query, mestizo]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setQuery("");
      setActiveIndex(0);
    }
  }

  function commit(name: string) {
    onChange(name);
    setManual(false);
    setOpen(false);
    setQuery("");
  }

  function startManual() {
    setManual(true);
    setOpen(false);
    onChange("");
  }

  function clear() {
    onChange("");
    setManual(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && items[activeIndex]) {
      e.preventDefault();
      commit(items[activeIndex]);
    }
  }

  // Especie sin lista curada (p. ej. "otro") → ingreso manual directo.
  if (!hasList) {
    return (
      <Input
        label="Raza"
        placeholder="Escribe su raza…"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-sm"
      />
    );
  }

  // Ingreso manual ("mi raza no aparece").
  if (manual) {
    return (
      <div className="max-w-sm space-y-2">
        <Input
          label="Escribe su raza"
          placeholder="Ej: Pastor pastoreo…"
          autoFocus
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setManual(false)}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-text-brand underline-offset-2 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Buscar en la lista
        </button>
      </div>
    );
  }

  // Raza elegida → Chip con ✕ para cambiarla.
  if (value) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Chip active removable onRemove={clear} icon={<PawPrint className="size-3.5" aria-hidden />}>
          {value}
        </Chip>
        <span className="text-[13px] text-text-muted">Toca ✕ para cambiarla</span>
      </div>
    );
  }

  // Buscador (estado por defecto).
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger
        role="combobox"
        aria-expanded={open}
        className="flex h-12 w-full max-w-sm items-center gap-2 rounded-[var(--radius-md)] border border-border-default bg-surface px-3.5 text-[15px] text-text-muted transition-colors hover:border-border-strong focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-terracota-100"
      >
        <Search className="size-4 shrink-0 text-text-muted" aria-hidden />
        <span className="flex-1 text-left">Buscar raza…</span>
        <ChevronDown className="size-4 shrink-0 text-text-muted" aria-hidden />
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
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={`Buscar raza de ${species === "gato" ? "gato" : "perro"}…`}
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={items[activeIndex] ? `${listId}-${activeIndex}` : undefined}
              className="h-11 w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-60 overflow-auto p-1.5">
            {items.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-text-muted">
                Sin coincidencias. Usa “mi raza no aparece”.
              </li>
            )}
            {items.map((name, i) => {
              const isMestizo = name === mestizo;
              const isActive = i === activeIndex;
              return (
                <li
                  key={name}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => commit(name)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-[15px] text-text-primary",
                    isMestizo && "font-semibold",
                    isActive && "bg-brand-soft text-text-brand",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {isMestizo && <PawPrint className="size-3.5 text-text-brand" aria-hidden />}
                    {name}
                  </span>
                  {isActive && <Check className="size-4 text-terracota-500" aria-hidden />}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={startManual}
            className="flex w-full items-center gap-2 border-t border-border-default px-3.5 py-3 text-left text-[13px] font-semibold text-text-brand transition-colors hover:bg-subtle"
          >
            Mi raza no aparece · escribirla
          </button>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
