"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Límite de error de la app (endurecimiento de lanzamiento). Si una pantalla falla
 * al renderizar (p. ej. el backend no responde), mostramos un mensaje con la
 * identidad de Manada y una salida clara, en vez de la pantalla cruda de Next.
 * El carrito se persiste en localStorage, así que no se pierde al reintentar.
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[70vh] place-items-center px-6 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
        <span className="text-6xl" aria-hidden>
          🐾
        </span>
        <h1 className="display-l text-text-primary">Algo no salió como esperábamos</h1>
        <p className="body-l text-text-secondary">
          Tuvimos un problema al cargar esta página. Puedes reintentar o volver al inicio; tu
          carrito queda guardado.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => reset()}>Reintentar</Button>
          <Button variant="secondary" asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
