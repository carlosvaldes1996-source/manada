import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Página 404 con identidad de Manada (endurecimiento de lanzamiento). Cubre rutas
 * inexistentes y cualquier `notFound()` (incluye el gate de `/dev/*` en producción).
 */
export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-6 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
        <span className="text-6xl" aria-hidden>
          🐾
        </span>
        <h1 className="display-l text-text-primary">No encontramos esta página</h1>
        <p className="body-l text-text-secondary">
          El enlace pudo cambiar o la página ya no existe. Volvamos a un lugar seguro.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Ir al inicio</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/categoria/todo">Ir a la tienda</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
