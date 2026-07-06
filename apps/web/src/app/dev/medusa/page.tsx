import { getProductByHandle, listProducts, MEDUSA_BACKEND_URL } from "@/lib/medusa";

/**
 * Diagnóstico de la capa de datos de Medusa (Fase 5 · Etapa 1).
 *
 * Página dev-only (como /dev/tokens y /dev/components): ejercita el mapper real
 * contra el backend y muestra el resultado para revisarlo a ojo. `force-dynamic`
 * para que la conexión ocurra en cada request y NO en el build.
 */
export const dynamic = "force-dynamic";

export default async function MedusaDiagnosticsPage() {
  let products = [] as Awaited<ReturnType<typeof listProducts>>;
  let sample: Awaited<ReturnType<typeof getProductByHandle>> = null;
  let error: string | null = null;

  try {
    products = await listProducts();
    sample = await getProductByHandle("royal-canin-adulto-razas-pequenas-3kg");
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main style={{ padding: 24, fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
      <h1 style={{ fontFamily: "sans-serif" }}>Medusa · diagnóstico Etapa 1</h1>
      <p>
        Backend: <code>{MEDUSA_BACKEND_URL}</code> · productos mapeados: <strong>{products.length}</strong>
      </p>
      {error ? (
        <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>Error: {error}</pre>
      ) : (
        <>
          <h2 style={{ fontFamily: "sans-serif" }}>getProductByHandle(&quot;royal-canin…&quot;)</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(sample, null, 2)}</pre>
          <h2 style={{ fontFamily: "sans-serif" }}>listProducts()</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(products, null, 2)}</pre>
        </>
      )}
    </main>
  );
}
