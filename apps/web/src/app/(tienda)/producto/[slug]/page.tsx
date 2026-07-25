import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCachedCatalog,
  getCachedProductByHandle,
  getCachedShippingPolicy,
} from "@/lib/medusa/catalog-cache";
import { categoryLabel } from "@/lib/catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, productSchema, resolveProductImage } from "@/lib/seo";
import { ProductView } from "./product-view";

// Ficha cacheada con ISR (`revalidate` 300s): se sirve desde el edge sin round-trip
// a Railway por visita. El desfase máximo (5 min) solo afecta datos cosméticos
// (urgencia/agotado); add-to-cart y checkout validan stock y precio en vivo, así
// que no hay riesgo de sobreventa ni de cobro con precio obsoleto.
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
  const product = await getCachedProductByHandle(slug);
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
    getCachedProductByHandle(slug),
    getCachedCatalog(),
    getCachedShippingPolicy(),
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
