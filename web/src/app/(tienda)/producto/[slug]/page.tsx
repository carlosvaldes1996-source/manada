import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS_BY_SLUG } from "@/lib/data/catalog";
import { ProductView } from "./product-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = PRODUCTS_BY_SLUG.get(slug);
  return { title: product ? `${product.brand.name} · ${product.name}` : "Producto" };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!PRODUCTS_BY_SLUG.has(slug)) notFound();
  return <ProductView slug={slug} />;
}
