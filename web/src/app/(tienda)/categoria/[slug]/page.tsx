import type { Metadata } from "next";
import { categoryLabel } from "@/lib/data/catalog";
import { CategoryView } from "./category-view";

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
  return <CategoryView slug={slug} />;
}
