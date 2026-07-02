"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Páginas vecinas a mostrar a cada lado de la actual. */
  siblings?: number;
  className?: string;
}

/** Construye la secuencia de páginas con elipsis ("…") según la posición. */
function buildRange(page: number, total: number, siblings: number): (number | "…")[] {
  const range: (number | "…")[] = [];
  const left = Math.max(2, page - siblings);
  const right = Math.min(total - 1, page + siblings);
  range.push(1);
  if (left > 2) range.push("…");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("…");
  if (total > 1) range.push(total);
  return range;
}

/**
 * Paginación accesible para el catálogo. Botones prev/next + números con
 * elipsis. Marca la página actual con aria-current.
 */
export function Pagination({ page, totalPages, onPageChange, siblings = 1, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = buildRange(page, totalPages, siblings);
  const base =
    "grid h-10 min-w-10 place-items-center rounded-[var(--radius-md)] px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] disabled:opacity-40 disabled:pointer-events-none";

  return (
    <nav aria-label="Paginación" className={cn("flex items-center gap-1.5", className)}>
      <button
        type="button"
        className={cn(base, "text-text-secondary hover:bg-subtle")}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="grid h-10 w-8 place-items-center text-text-muted" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPageChange(p)}
            className={cn(
              base,
              p === page
                ? "bg-terracota-500 text-white"
                : "text-text-secondary hover:bg-subtle",
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        className={cn(base, "text-text-secondary hover:bg-subtle")}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Página siguiente"
      >
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}
