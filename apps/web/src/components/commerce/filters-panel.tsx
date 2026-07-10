"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import type { FilterGroup } from "@/lib/catalog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export type FilterSelection = Record<string, string[]>;

export interface FiltersPanelProps {
  groups: FilterGroup[];
  value: FilterSelection;
  onChange: (value: FilterSelection) => void;
  className?: string;
}

/** Cuerpo reutilizable de filtros — render en sidebar (desktop) y sheet (móvil). */
function FiltersBody({ groups, value, onChange }: FiltersPanelProps) {
  function toggle(groupId: string, optValue: string) {
    const current = value[groupId] ?? [];
    const next = current.includes(optValue)
      ? current.filter((v) => v !== optValue)
      : [...current, optValue];
    onChange({ ...value, [groupId]: next });
  }

  return (
    <div className="flex flex-col">
      {groups.map((group, i) => (
        <React.Fragment key={group.id}>
          {i > 0 && <Separator className="my-1" />}
          <fieldset className="py-4">
            <legend className="mb-1.5 text-sm font-semibold text-text-primary">{group.label}</legend>
            <div className="flex flex-col">
              {group.options.map((opt) => (
                <Checkbox
                  key={opt.value}
                  checked={(value[group.id] ?? []).includes(opt.value)}
                  onCheckedChange={() => toggle(group.id, opt.value)}
                  label={opt.label}
                  meta={opt.count}
                />
              ))}
            </div>
          </fieldset>
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Panel de filtros del catálogo. En desktop se renderiza como sidebar fijo
 * (<FiltersSidebar>); en móvil, dentro de un sheet inferior (<FiltersSheet>).
 * Estado controlado por el padre (la PLP) para reflejarse en la URL/resultados.
 */
export function FiltersSidebar({ className, ...props }: FiltersPanelProps) {
  return (
    <aside className={cn("hidden lg:block", className)} aria-label="Filtros">
      <FiltersBody {...props} />
    </aside>
  );
}

export interface FiltersSheetProps extends FiltersPanelProps {
  /** Nº de resultados, para el CTA "Ver N productos". */
  resultCount?: number;
}

export function FiltersSheet({ resultCount, ...props }: FiltersSheetProps) {
  const activeCount = Object.values(props.value).reduce((n, arr) => n + arr.length, 0);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" size="sm" className="lg:hidden" leadingIcon={<SlidersHorizontal className="size-4" aria-hidden />}>
          Filtros{activeCount > 0 && ` (${activeCount})`}
        </Button>
      </SheetTrigger>
      <SheetContent
        title="Filtros"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" block onClick={() => props.onChange({})}>
              Limpiar
            </Button>
            <Button block>{resultCount != null ? `Ver ${resultCount} productos` : "Aplicar"}</Button>
          </div>
        }
      >
        <FiltersBody {...props} />
      </SheetContent>
    </Sheet>
  );
}
