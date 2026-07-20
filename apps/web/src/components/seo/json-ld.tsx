import type { JsonLdSchema } from "@/lib/seo";

/**
 * Inyecta datos estructurados JSON-LD como `<script type="application/ld+json">`.
 * Patrón recomendado por la guía oficial de Next.js: script nativo (no `next/script`,
 * porque es data, no código ejecutable) + escape de `<` a su unicode para evitar
 * inyección XSS al serializar contenido dinámico del catálogo.
 *
 * Acepta uno o varios schemas; emite un `<script>` por cada uno.
 */
export function JsonLd({ schema }: { schema: JsonLdSchema | JsonLdSchema[] }) {
  const schemas = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {schemas.map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(entry).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
