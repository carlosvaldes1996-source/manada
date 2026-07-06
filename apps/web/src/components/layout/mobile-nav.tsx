"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { ACCOUNT_NAV, MAIN_NAV } from "@/config/nav";
import { NavIcon } from "@/lib/icons";
import { useDisclosure } from "@/hooks/use-disclosure";
import { IconButton } from "@/components/ui/icon-button";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";

/**
 * Menú de navegación móvil — Drawer lateral disparado por el botón hamburguesa
 * del header (< lg). Lista las categorías y los accesos de cuenta. Cada enlace
 * cierra el drawer al navegar (DrawerClose asChild).
 */
export function MobileNav() {
  const { isOpen, setIsOpen } = useDisclosure();

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <IconButton label="Abrir menú" className="lg:hidden">
          <Menu className="size-6" strokeWidth={1.75} aria-hidden />
        </IconButton>
      </DrawerTrigger>
      <DrawerContent side="left" title="Menú">
        <nav aria-label="Categorías" className="flex flex-col">
          {MAIN_NAV.map((item) => (
            <DrawerClose asChild key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 border-b border-border-default py-3.5 font-semibold text-text-primary"
              >
                <NavIcon name={item.icon} className="size-5 text-text-secondary" />
                {item.label}
              </Link>
            </DrawerClose>
          ))}
        </nav>
        <Separator className="my-4" />
        <p className="mb-1 text-xs font-semibold tracking-[0.06em] text-text-muted uppercase">Mi cuenta</p>
        <nav aria-label="Mi cuenta" className="flex flex-col">
          {ACCOUNT_NAV.map((item) => (
            <DrawerClose asChild key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 py-3 text-[15px] text-text-secondary"
              >
                <NavIcon name={item.icon} className="size-5" />
                {item.label}
              </Link>
            </DrawerClose>
          ))}
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
