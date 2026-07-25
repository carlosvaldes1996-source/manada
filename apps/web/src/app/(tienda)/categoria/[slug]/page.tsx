import type { Metadata } from "next";
import { categoryLabel } from "@/lib/catalog";
import { getCachedCatalog } from "@/lib/medusa/catalog-cache";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo";
import { CategoryView } from "./category-view";

// Catálogo cacheado con ISR (`revalidate` 300s): se sirve desde el edge sin
// round-trip a Railway por visita. El desfase máximo (5 min) solo afecta datos
// cosméticos (p. ej. urgencia de stock); carrito/checkout validan en vivo.
export const revalidate = 300;

// Devolver [] activa ISR en un segmento dinámico (requisito de Next para revalidar
// rutas en runtime): nada se prerenderiza en build —el catálogo vive en el backend—
// y cada slug se renderiza on-demand la primera vez y queda cacheado por `revalidate`.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const label = categoryLabel(slug);
  const description = `${label} para tu mascota en Manada: alimento, accesorios y farmacia con despacho a domicilio en Chile.`;
  const canonical = `/categoria/${slug}`;
  return {
    title: label,
    description,
    alternates: { canonical },
    openGraph: { type: "website", title: label, description, url: canonical },
  };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await getCachedCatalog();

  const breadcrumb = breadcrumbSchema([
    { name: "Inicio", path: "/" },
    { name: categoryLabel(slug), path: `/categoria/${slug}` },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumb} />
      <CategoryView slug={slug} products={products} />
    </>
  );
}
