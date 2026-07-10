import type { Metadata } from "next";
import { listProducts } from "@/lib/medusa";
import { RecommendationView } from "./recommendation-view";

export const metadata: Metadata = {
  title: "Tu recomendación",
  description: "La comida que mejor le calza a tu mascota, con cuánto come, cuánto le dura y cuándo reponerla.",
};

/**
 * Server component: hidrata el catálogo real desde la Store API en cada request
 * (mismo patrón que Home/PLP/PDP, D23) para que la recomendación corra sobre
 * productos comprables — con `variantId` real, "Sumar al pedido" llena el
 * carrito real de Medusa (cierra O5).
 */
export const dynamic = "force-dynamic";

export default async function RecomendacionPage() {
  const products = await listProducts();
  return <RecommendationView products={products} />;
}
