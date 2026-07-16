"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { useSession } from "@/components/providers";
import { LandingView } from "./landing-view";

/**
 * Conmutador de Home según sesión: los usuarios autenticados van directo a
 * /cuenta (panel unificado), los anónimos ven la landing.
 */
export function HomeSwitch({ products }: { products: Product[] }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/cuenta");
    }
  }, [status, router]);

  // Mientras resuelve la sesión o redirige, muestra la landing como placeholder.
  if (status === "authenticated") return null;

  return <LandingView products={products} />;
}
