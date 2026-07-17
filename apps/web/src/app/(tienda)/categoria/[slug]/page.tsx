import type { Metadata } from "next";
import { categoryLabel } from "@/lib/catalog";
import { listProducts } from "@/lib/medusa";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbLd } from "@/lib/structured-data";
import { CategoryView } from "./category-view";

// El catálogo se hidrata desde el backend en cada request (no en el build).
export const dynamic = "force-dynamic";

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
  const products = await listProducts();
  const breadcrumb = breadcrumbLd([
    { name: "Inicio", path: "/" },
    { name: categoryLabel(slug), path: `/categoria/${slug}` },
  ]);
  return (
    <>
      <JsonLd data={breadcrumb} />
      <CategoryView slug={slug} products={products} />
    </>
  );
}
