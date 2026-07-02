import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Migas de pan accesibles (nav + aria-current). El último item es la página
 * actual y no enlaza. Usado en PLP/PDP para orientación jerárquica.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Ruta de navegación" className={cn("py-3.5", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-text-secondary">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="transition-colors hover:text-text-brand">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn(last && "font-medium text-text-primary")}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 text-text-muted" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
