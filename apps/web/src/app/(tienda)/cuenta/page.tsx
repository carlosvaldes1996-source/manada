import type { Metadata } from "next";
import { listProducts } from "@/lib/medusa";
import { AccountView } from "./account-view";

export const metadata: Metadata = { title: "Mi cuenta" };
export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const products = await listProducts();
  return <AccountView products={products} />;
}
