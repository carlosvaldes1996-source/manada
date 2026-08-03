import { getCachedCatalog } from "@/lib/medusa/catalog-cache";
import { suggestSearch } from "@/lib/search";

/**
 * `/api/buscar?q=<texto>` — sugerencias del buscador mientras se escribe.
 *
 * Resuelve en el servidor sobre el catálogo YA cacheado (`getCachedCatalog`,
 * Data Cache de 300s): no toca el backend de Medusa por pulsación y devuelve
 * solo lo que la fila del desplegable necesita pintar, no el producto entero.
 *
 * Por qué servidor y no cliente: mandar el catálogo completo al navegador para
 * buscar ahí sería ~40 KB extra en CADA carga de página (el buscador vive en el
 * header, o sea en todas). Acá la respuesta pesa < 2 KB, se cachea en el CDN por
 * consulta y el cliente además la memoriza en la sesión.
 */

/** Techo de la consulta: nadie busca con un párrafo, y acota el trabajo por request. */
const MAX_QUERY = 64;
const LIMIT = 6;

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY);
  if (q.length < 2) return Response.json({ products: [], terms: [], total: 0 });

  const catalog = await getCachedCatalog();
  const { products, terms, total } = suggestSearch(catalog, q, LIMIT);

  return Response.json(
    {
      total,
      terms,
      products: products.map((p) => ({
        slug: p.slug,
        name: p.name,
        brand: p.brand.name,
        image: p.imageUrl,
        price: p.price.current,
      })),
    },
    {
      // El catálogo cambia cada 300s como mucho; una sugerencia vieja unos
      // segundos no rompe nada y sí ahorra el render repetido de la consulta.
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    },
  );
}
