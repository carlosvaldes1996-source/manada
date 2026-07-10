import { listProducts } from "@/lib/medusa";
import { BienvenidaView } from "./bienvenida-view";

/**
 * Server component: hidrata el catálogo real (Store API) para que la vista
 * resuelva el alimento asignado a la mascota (`currentFoodId` → producto real)
 * y derive su anticipación de la fuente única (mismo patrón que Home, D23/O5).
 */
export const dynamic = "force-dynamic";

export default async function BienvenidaPage() {
  const products = await listProducts();
  return <BienvenidaView products={products} />;
}
