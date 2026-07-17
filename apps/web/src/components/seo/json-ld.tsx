/**
 * Inserta uno o varios nodos JSON-LD (schema.org) en el HTML como
 * `<script type="application/ld+json">` — el formato que Google recomienda para
 * datos estructurados. Server component: se renderiza en el HTML inicial (SSR),
 * así el rastreador lo ve sin ejecutar JS. Los builders viven en
 * `lib/structured-data.ts`.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const nodes = Array.isArray(data) ? data : [data];
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          // El contenido es nuestro (no entrada de usuario); JSON.stringify escapa el payload.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}
