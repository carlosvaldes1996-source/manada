"use client";

import Link from "next/link";
import { ShoppingBag, Lock, User } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { HeaderSearch } from "./header-search";
import { useCart, usePet } from "@/components/providers";
import { PetSwitcher } from "@/components/pet/pet-switcher";
import { Logo } from "./logo";
import { Navbar } from "./navbar";
import { MobileNav } from "./mobile-nav";

export interface HeaderProps {
  /**
   * - "checkout": versión mínima (sin búsqueda/nav/carrito), foco en completar.
   * - "marketing": chrome de visitante anónimo (Logo + Ingresar + Comenzar),
   *   sin tienda (no hay carrito ni selector de mascota todavía).
   */
  variant?: "default" | "checkout" | "marketing";
}

/**
 * Header global sticky con blur (DESIGN_SYSTEM §12.4): logo · buscador central ·
 * selector de mascota + carrito. En desktop monta la <Navbar> por necesidad;
 * en móvil, el <MobileNav>. Las variantes "checkout" y "marketing" reducen el chrome.
 */
export function Header({ variant = "default" }: HeaderProps) {
  // Onboarding completado = hay una mascota activa (invitado o con sesión). La
  // variante "marketing" solo se monta para anónimos, así que basta con esto.
  const { activePet } = usePet();

  if (variant === "marketing") {
    // Chrome de visitante con TIENDA navegable: el anónimo puede buscar,
    // recorrer categorías y comprar sin cuenta (e-commerce como piso).
    // "Comenzar" (perfil de mascota) sigue siendo el CTA destacado.
    return (
      <header className="sticky top-0 z-40 border-b border-border-default bg-[rgba(250,246,240,0.92)] backdrop-blur-md">
        <Container className="flex h-16 items-center gap-3 md:gap-4">
          <MobileNav />
          <Logo />
          <div className="hidden flex-1 md:block">
            <HeaderSearch />
          </div>
          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/ingresar">Ingresar</Link>
            </Button>
            {/* Onboarding ya hecho (mascota activa): el CTA formaliza la cuenta
                conservando la mascota, en vez de reiniciar el alta ("Comenzar"). */}
            <Button size="sm" asChild>
              {activePet ? (
                <Link href="/crear-cuenta">Crear cuenta</Link>
              ) : (
                <Link href="/comenzar">Comenzar</Link>
              )}
            </Button>
            <CartButton />
          </div>
        </Container>
        <div className="border-t border-border-default px-4 py-2 md:hidden">
          <HeaderSearch />
        </div>
        <Navbar />
      </header>
    );
  }

  if (variant === "checkout") {
    return (
      <header className="sticky top-0 z-40 border-b border-border-default bg-[rgba(250,246,240,0.92)] backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between">
          <Logo />
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary">
            <Lock className="size-4 text-[var(--success)]" aria-hidden />
            Conexión segura
          </span>
        </Container>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border-default bg-[rgba(250,246,240,0.92)] backdrop-blur-md">
      <Container className="flex h-16 items-center gap-3 md:gap-4">
        <MobileNav />
        <Logo />
        <div className="hidden flex-1 md:block">
          <HeaderSearch />
        </div>
        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <PetSwitcher />
          <Link href="/cuenta" aria-label="Mi cuenta" className="hidden sm:block">
            <IconButton label="Mi cuenta" asChild>
              <span>
                <User className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
            </IconButton>
          </Link>
          <CartButton />
        </div>
      </Container>
      {/* Buscador en móvil: el header lo expone siempre (<md) ya que el
          bottom-nav dejó de incluir "Buscar" (AUDIT U059/U060). */}
      <div className="border-t border-border-default px-4 py-2 md:hidden">
        <HeaderSearch />
      </div>
      <Navbar />
    </header>
  );
}

/** Botón de carrito con contador; enlaza a /carrito. */
function CartButton() {
  const { count } = useCart();
  return (
    <Link href="/carrito" aria-label={`Carrito, ${count} productos`} className="relative">
      <IconButton label="Ver carrito" asChild>
        <span>
          <ShoppingBag className="size-5" strokeWidth={1.75} aria-hidden />
          {count > 0 && (
            <span className="absolute top-1 right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-terracota-500 px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </span>
      </IconButton>
    </Link>
  );
}
