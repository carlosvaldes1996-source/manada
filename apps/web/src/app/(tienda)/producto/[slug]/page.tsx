import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductByHandle, listProducts, getShippingPolicy } from "@/lib/medusa";
import { categoryLabel } from "@/lib/catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, productSchema, resolveProductImage } from "@/lib/seo";
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
  if (!product) return { title: "Producto" };

  const title = `${product.brand.name} · ${product.name}`;
  const description = `${product.name}${product.format ? ` (${product.format})` : ""} de ${product.brand.name}. Cómpralo en Manada con despacho a domicilio en Chile.`;
  const canonical = `/producto/${slug}`;
  // Solo se usa la foto del producto si es una URL válida; si es un emoji placeholder
  // se omite `images` y Next aplica el `opengraph-image` de marca (file-convention).
  const ogImage = resolveProductImage(product.imageUrl);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
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

  const breadcrumb = breadcrumbSchema([
    { name: "Inicio", path: "/" },
    { name: categoryLabel(product.category), path: `/categoria/${product.category}` },
    { name: product.name, path: `/producto/${product.slug}` },
  ]);

  return (
    <>
      <JsonLd schema={[productSchema(product), breadcrumb]} />
      <ProductView product={product} products={products} policy={policy} />
    </>
  );
}
