"use client";

import type { Product } from "@/types";
import type { ShippingPolicy } from "@/lib/medusa";
import { useSession } from "@/components/providers";
import { LandingView } from "./landing-view";
import { DashboardView } from "./dashboard-view";

/**
 * Conmutador de Home según sesión (Fase 3.3B · resuelve U041/U058), como cliente.
 * El catálogo real llega ya hidratado desde el server component `page.tsx` y se
 * pasa a ambas vistas; la decisión landing vs. dashboard depende del estado de
 * sesión (solo disponible en cliente).
 */
export function HomeSwitch({
  products,
  shippingPolicy,
}: {
  products: Product[];
  shippingPolicy: ShippingPolicy;
}) {
  const { status } = useSession();
  return status === "authenticated" ? (
    <DashboardView products={products} />
  ) : (
    <LandingView products={products} shippingPolicy={shippingPolicy} />
  );
}
