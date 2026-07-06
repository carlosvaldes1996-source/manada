import Link from "next/link";
import { SITE } from "@/config/site";

/**
 * TEMPORAL — Andamiaje de Etapa 1 (routing).
 * Cada ruta renderiza este placeholder para verificar que la arquitectura,
 * los tokens y la tipografía funcionan. Se reemplazará por las pantallas
 * reales en Etapa 3. No forma parte del design system.
 */
export function RoutePlaceholder({
  title,
  stage,
  description,
}: {
  title: string;
  stage: "Etapa 2" | "Etapa 3";
  description: string;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <Link href="/" className="overline text-text-brand">
        🐾 {SITE.name}
      </Link>
      <h1 className="display-l text-text-primary">{title}</h1>
      <p className="body-l text-text-secondary">{description}</p>
      <span className="caption rounded-full bg-accent-soft px-4 py-1.5 text-subscribe-strong">
        Pantalla pendiente · se construye en {stage}
      </span>
      <Link
        href="/"
        className="body-s mt-4 text-text-brand underline-offset-4 hover:underline"
      >
        ← Volver al inicio
      </Link>
    </main>
  );
}
