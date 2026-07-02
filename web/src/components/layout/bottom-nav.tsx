"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV } from "@/config/nav";
import { NavIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/providers";

/**
 * Barra de navegación inferior fija (solo móvil/tablet, < lg).
 * 5 destinos clave con la mascota en el centro de la experiencia.
 * Marca el activo con aria-current y respeta el safe-area inferior.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-border-default bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {BOTTOM_NAV.map((item) => {
        const active = pathname === item.href;
        const isCart = item.href === "/carrito";
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 px-2 py-2 text-[11px] font-medium transition-colors",
              active ? "text-text-brand" : "text-text-muted",
            )}
          >
            <span className="relative">
              <NavIcon name={item.icon} className="size-[22px]" />
              {isCart && count > 0 && (
                <span className="absolute -top-1.5 -right-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-terracota-500 px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
