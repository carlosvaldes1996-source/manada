import { notFound } from "next/navigation";

/**
 * Gate de las rutas de desarrollo (`/dev/*`: styleguide de componentes/tokens y
 * diagnóstico de datos de Medusa). Fuera de desarrollo devuelven 404, para no
 * exponer herramientas internas ni volcados de datos en producción. Interruptor
 * único: cubre todas las páginas bajo /dev sin tocarlas una a una.
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return <>{children}</>;
}
