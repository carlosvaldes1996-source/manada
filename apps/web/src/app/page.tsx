import type { Metadata } from "next";
import { listProducts } from "@/lib/medusa";
import { HomeSwitch } from "./home-switch";

/**
 * Home. Server component: hidrata el catálogo real desde el backend en cada request
 * y delega en <HomeSwitch> la elección landing (anónimo) vs. dashboard (con sesión),
 * que depende del estado de sesión (cliente). Una sola superficie en `/`.
 */
export const dynamic = "force-dynamic";

// Canonical propio de la home (ya no se hereda del layout raíz, ver layout.tsx).
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const products = await listProducts();
  return <HomeSwitch products={products} />;
}
