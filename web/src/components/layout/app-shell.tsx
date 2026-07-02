import { cn } from "@/lib/utils";
import { Header, type HeaderProps } from "./header";
import { Footer } from "./footer";
import { BottomNav } from "./bottom-nav";

export interface AppShellProps {
  children: React.ReactNode;
  /** "checkout" usa header mínimo y oculta footer/bottom-nav (foco en convertir). */
  variant?: HeaderProps["variant"];
  /** Oculta el footer (p. ej. pantallas full-height). */
  hideFooter?: boolean;
  className?: string;
}

/**
 * Esqueleto de la aplicación: Header + contenido + Footer + BottomNav (móvil).
 * Envuelve cada pantalla de tienda. Reserva el padding inferior para que la
 * BottomNav fija no tape el contenido en móvil. La variante "marketing" (landing
 * de visitante) usa header de marca + footer, sin BottomNav (no hay tienda aún).
 */
export function AppShell({ children, variant = "default", hideFooter, className }: AppShellProps) {
  const isCheckout = variant === "checkout";
  const showBottomNav = variant === "default";
  return (
    <div className="flex min-h-dvh flex-col">
      <Header variant={variant} />
      <main className={cn("flex-1", showBottomNav && "pb-20 lg:pb-0", className)}>{children}</main>
      {!isCheckout && !hideFooter && <Footer />}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
