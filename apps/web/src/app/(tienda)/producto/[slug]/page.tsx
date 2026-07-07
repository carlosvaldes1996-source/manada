import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductByHandle, listProducts, getShippingPolicy } from "@/lib/medusa";
import { ProductView } from "./product-view";

// La ficha se hidrata desde el backend en cada request (no en el build).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductByHandle(slug);
  return { title: product ? `${product.brand.name} · ${product.name}` : "Producto" };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, products, policy] = await Promise.all([
    getProductByHandle(slug),
    listProducts(),
    getShippingPolicy(),
  ]);
  if (!product) notFound();
  return <ProductView product={product} products={products} policy={policy} />;
}
