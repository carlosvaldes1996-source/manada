import Link from "next/link";
import type { MegaColumn } from "@/config/nav";
import { cn } from "@/lib/utils";

export interface MegaMenuProps {
  columns: MegaColumn[];
  className?: string;
}

/**
 * Panel del mega-menú (contenido de columnas). Su visibilidad la controla el
 * <Navbar> vía hover/focus-within. Estructura por necesidad, no por marca.
 */
export function MegaMenu({ columns, className }: MegaMenuProps) {
  return (
    <div
      className={cn(
        "grid min-w-[560px] grid-cols-3 gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface p-6 shadow-lg",
        className,
      )}
    >
      {columns.map((col) => (
        <div key={col.title}>
          <h5 className="mb-2 text-xs font-semibold tracking-[0.06em] text-text-muted uppercase">
            {col.title}
          </h5>
          <ul>
            {col.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-brand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
