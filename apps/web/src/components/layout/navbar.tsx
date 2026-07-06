"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { MAIN_NAV, MEGA_MENU } from "@/config/nav";
import { cn } from "@/lib/utils";
import { MegaMenu } from "./mega-menu";

/**
 * Barra de navegación por necesidad (solo desktop, ≥ lg). El primer item
 * ("Comprar") despliega el mega-menú al hover/focus. El resto son enlaces
 * directos. Marca el activo con subrayado Terracota + aria-current.
 */
export function Navbar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Categorías" className="hidden border-t border-border-default bg-canvas lg:block">
      <ul className="mx-auto flex h-12 max-w-[var(--container-max)] items-center gap-6 px-8 text-sm font-semibold">
        {MAIN_NAV.map((item) => {
          const active = pathname.startsWith(item.href) && item.href !== "/categoria/todo";
          const hasMega = item.children && item.children.length > 0;

          if (hasMega) {
            return (
              <li key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className="flex items-center gap-1 py-3 text-text-secondary transition-colors group-hover:text-text-primary group-focus-within:text-text-primary"
                >
                  {item.label}
                  <ChevronDown className="size-4 transition-transform group-hover:rotate-180" aria-hidden />
                </Link>
                <div className="invisible absolute top-full left-0 z-50 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <MegaMenu columns={MEGA_MENU} />
                </div>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block border-b-2 py-3 transition-colors",
                  active
                    ? "border-terracota-500 text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
