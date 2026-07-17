import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductByHandle, listProducts, getShippingPolicy } from "@/lib/medusa";
import { categoryLabel } from "@/lib/catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbLd, productLd } from "@/lib/structured-data";
import { ProductView } from "./product-view";

/** ¿URL de imagen real (no un emoji placeholder)? Evita og:image roto (D48). */
function isRealImage(value?: string): value is string {
  return !!value && /^(https?:\/\/|\/)/.test(value);
}

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

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      // Solo si es una foto real. Con el placeholder emoji, `product.imageUrl` NO
      // es una URL → generaba og:image roto (p. ej. /%F0%9F%90%95). Omitido, cae
      // en la imagen OG de marca por defecto (app/opengraph-image.tsx). (D48)
      ...(isRealImage(product.imageUrl)
        ? { images: [{ url: product.imageUrl }] }
        : {}),
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

  // Datos estructurados: ficha de producto + migas de pan (Home → categoría → producto).
  const breadcrumb = breadcrumbLd([
    { name: "Inicio", path: "/" },
    { name: categoryLabel(product.category), path: `/categoria/${product.category}` },
    { name: product.name, path: `/producto/${product.slug}` },
  ]);

  return (
    <>
      <JsonLd data={[productLd(product), breadcrumb]} />
      <ProductView product={product} products={products} policy={policy} />
    </>
  );
}
