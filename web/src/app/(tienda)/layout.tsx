import { AppShell } from "@/components/layout";

/**
 * Layout del grupo de rutas de tienda: monta el chrome compartido
 * (Header + Navbar + Footer + BottomNav) sobre cada pantalla de tienda
 * (PLP, PDP, Carrito, Mi Cuenta). La Home vive en la raíz con su propio
 * AppShell y el Checkout fuera de este grupo (chrome mínimo).
 */
export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
