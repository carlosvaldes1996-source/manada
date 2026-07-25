import { getCachedCatalog } from "@/lib/medusa/catalog-cache";
import { HomeSwitch } from "./home-switch";

/**
 * Home. Server component: hidrata el catálogo real desde el backend y delega en
 * <HomeSwitch> la elección landing (anónimo) vs. dashboard (con sesión), que depende
 * del estado de sesión (cliente). Una sola superficie en `/`.
 *
 * Catálogo cacheado con ISR (`revalidate` 300s): la página se sirve desde el edge
 * sin round-trip a Railway en cada visita. Es seguro porque el render del servidor
 * es agnóstico a la sesión (el split landing/dashboard y el carrito ocurren en el
 * cliente); el carrito/checkout revalidan precio y stock en vivo.
 */
export const revalidate = 300;

export default async function HomePage() {
  const products = await getCachedCatalog();
  return <HomeSwitch products={products} />;
}
