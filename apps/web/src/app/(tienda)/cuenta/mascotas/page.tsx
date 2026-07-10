import { listProducts } from "@/lib/medusa";
import { MascotasView } from "./mascotas-view";

/**
 * Perfil de mascota — el núcleo del producto (el moat). Server component: hidrata
 * el catálogo real del backend (para el riel "Lo de siempre" y el cross-sell de
 * salud) y delega la experiencia logueada en <MascotasView>, que lee la mascota
 * activa del PetProvider (cliente). Mismo patrón que la Home.
 */
export const dynamic = "force-dynamic";

export default async function MascotasPage() {
  const products = await listProducts();
  return <MascotasView products={products} />;
}
