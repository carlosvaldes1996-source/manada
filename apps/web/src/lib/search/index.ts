/**
 * Buscador de catálogo de Manada — **dueño único de la relevancia de búsqueda**.
 *
 * Todo lo que busque productos (página `/buscar`, autocompletado del header,
 * endpoint `/api/buscar`) entra por acá. El porqué de resolverlo en la app en vez
 * de con el `q` nativo de Medusa está documentado en `engine.ts`.
 */
export { searchCatalog, suggestSearch } from "./engine";
export type { SearchGroup, SearchOptions, SearchOutcome, SearchSuggestions } from "./engine";
