import type { Metadata } from "next";
import { categoryLabel } from "@/lib/catalog";
import { listProducts } from "@/lib/medusa";
import { CategoryView } from "./category-view";

// El catálogo se hidrata desde el backend en cada request (no en el build).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: categoryLabel(slug) };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await listProducts();
  return <CategoryView slug={slug} products={products} />;
}
