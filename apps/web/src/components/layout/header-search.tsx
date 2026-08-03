"use client";

import { SearchSuggest, type SearchSuggestProps } from "@/components/commerce/search-suggest";

/**
 * Buscador del header. Delega en `SearchSuggest`: sugiere productos mientras se
 * escribe y, al enviar, navega a `/buscar?q=…`. La misma pieza se usa en la
 * página de resultados, para que buscar se sienta igual en toda la tienda.
 */
export function HeaderSearch(props: SearchSuggestProps) {
  return <SearchSuggest {...props} />;
}
