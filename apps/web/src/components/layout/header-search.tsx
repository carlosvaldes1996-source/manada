"use client";

import { useRouter } from "next/navigation";
import { SearchBar, type SearchBarProps } from "@/components/ui/search-bar";

/**
 * Buscador del header cableado a la búsqueda real (Fase 5 · Etapa B): al enviar,
 * navega a `/buscar?q=…` (que consume el `q` nativo de la Store API de Medusa).
 */
export function HeaderSearch(props: SearchBarProps) {
  const router = useRouter();
  return (
    <SearchBar
      {...props}
      onSubmit={(query) => {
        const q = query.trim();
        if (q) router.push(`/buscar?q=${encodeURIComponent(q)}`);
      }}
    />
  );
}
