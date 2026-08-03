import type { Product } from "@/types";
import { featuredShowcase } from "@/lib/catalog";
import { editDistance, fold, isStopword, tokenize, typoTolerance } from "./normalize";
import {
  conceptById,
  conceptsForTerm,
  detectConcepts,
  LEXICON_WORDS,
  phraseConcepts,
  structuralConcepts,
  suggestConceptLabels,
  withAncestors,
} from "./lexicon";

/**
 * Motor de búsqueda de catálogo — **puro, en memoria, sin índice externo**.
 *
 * Por qué acá y no en el backend: el catálogo de Manada cabe entero en una sola
 * lectura cacheada (`getCachedCatalog`, ~170 productos, D68). Buscar sobre esa
 * lista es más barato que ir a la base y —sobre todo— permite lo que el `q`
 * nativo de Medusa NO puede hacer:
 *
 *   1. `q` solo mira columnas de texto (`title`, `description`, título/SKU de
 *      variante). La MARCA de Manada vive en `product.metadata` → invisible para
 *      `q`. Un tercio del catálogo no lleva la marca en el título ("Pacific
 *      Stream Salmón Ahumado" es Taste of the Wild): buscar la marca no los
 *      encontraba. Acá la marca es un campo más del documento.
 *   2. `q` exige TODOS los tokens (AND de `ilike`). "acana cachorro" devolvía
 *      cero, porque el producto se llama "Acana Puppy". Acá la cobertura parcial
 *      degrada en vez de vaciar la pantalla.
 *   3. `ilike` no ignora tildes: "salmon" no encontraba "Salmón".
 *   4. No hay ranking: el orden lo ponía la base de datos.
 *
 * Cuando el catálogo deje de caber en una lectura (miles de productos), esto se
 * reemplaza por un índice real; el contrato (`searchCatalog`) no cambia.
 */

/* -------------------------------------------------------------------------- */
/*                                   Índice                                    */
/* -------------------------------------------------------------------------- */

interface SearchDoc {
  product: Product;
  /** Nombre plegado ("Acana — Puppy Recipe" → "acana puppy recipe"). */
  name: string;
  words: string[];
  brandName: string;
  brandWords: string[];
  /** Palabras de los formatos de compra ("11.4", "kg"). */
  formatWords: Set<string>;
  /** Marca + nombre + formatos, plegado: para coincidencias de frase e infijos. */
  haystack: string;
  /** Conceptos del producto: los del léxico (nombre) + los estructurales (datos). */
  concepts: Set<string>;
  /**
   * Solo los que el NOMBRE dice literalmente. Un "Acana Puppy" y un "Acana
   * Classic" para cachorro cubren igual la consulta "acana cachorro", pero el
   * que lo lleva en el nombre es el que la persona vino a buscar: puntúa más.
   */
  textConcepts: Set<string>;
}

interface SearchIndex {
  docs: SearchDoc[];
  brands: { slug: string; name: string; words: string[] }[];
  /** Palabras conocidas (catálogo + léxico) — base del corrector ortográfico. */
  vocabulary: string[];
  vocabularySet: Set<string>;
}

/**
 * El índice se construye una vez por lista de productos. Es una WeakMap sobre el
 * array del catálogo: mientras `getCachedCatalog` devuelva la misma referencia,
 * se reutiliza; cuando el caché se revalida y llega un array nuevo, el viejo se
 * recolecta solo. Construirlo cuesta ~1 ms con 170 productos, así que esto es
 * higiene bajo carga (autocompletado), no una optimización crítica.
 */
const INDEX_CACHE = new WeakMap<Product[], SearchIndex>();

function buildIndex(products: Product[]): SearchIndex {
  const brands = new Map<string, { slug: string; name: string; words: string[] }>();
  const vocabularySet = new Set<string>(LEXICON_WORDS);

  const docs = products.map((product): SearchDoc => {
    const name = fold(product.name);
    const words = name.split(" ").filter(Boolean);
    const brandName = fold(product.brand.name);
    const brandWords = brandName.split(" ").filter(Boolean);

    const formats = (product.variants?.map((v) => v.format) ?? [product.format ?? ""])
      .map(fold)
      .filter(Boolean);
    const formatWords = new Set(formats.flatMap((f) => f.split(" ")));

    const textConcepts = withAncestors(detectConcepts(name, words));
    const concepts = new Set(textConcepts);
    for (const id of structuralConcepts(product.species, product.stage, product.category)) {
      concepts.add(id);
    }

    for (const word of words) if (word.length >= 2) vocabularySet.add(word);
    for (const word of brandWords) if (word.length >= 2) vocabularySet.add(word);
    if (!brands.has(product.brand.slug)) {
      brands.set(product.brand.slug, {
        slug: product.brand.slug,
        name: product.brand.name,
        words: brandWords,
      });
    }

    return {
      product,
      name,
      words,
      brandName,
      brandWords,
      formatWords,
      haystack: [brandName, name, ...formats].filter(Boolean).join(" "),
      concepts,
      textConcepts,
    };
  });

  return {
    docs,
    brands: [...brands.values()],
    vocabulary: [...vocabularySet],
    vocabularySet,
  };
}

function getIndex(products: Product[]): SearchIndex {
  const cached = INDEX_CACHE.get(products);
  if (cached) return cached;
  const index = buildIndex(products);
  INDEX_CACHE.set(products, index);
  return index;
}

/* -------------------------------------------------------------------------- */
/*                                  Consulta                                   */
/* -------------------------------------------------------------------------- */

interface QueryTerm {
  text: string;
  /** Conector ("de", "para", "of"): suma si coincide, pero nunca se exige. */
  optional: boolean;
  concepts: string[];
}

interface ParsedQuery {
  folded: string;
  terms: QueryTerm[];
}

function parseQuery(raw: string): ParsedQuery {
  const tokens = tokenize(raw);
  if (!tokens.length) return { folded: "", terms: [] };

  // Si TODO lo escrito son conectores, se toman como términos reales: es preferible
  // buscar "para" literalmente que declarar la consulta vacía.
  const allStopwords = tokens.every(isStopword);
  const folded = tokens.join(" ");

  const terms: QueryTerm[] = tokens.map((text) => ({
    text,
    optional: !allStopwords && isStopword(text),
    concepts: conceptsForTerm(text),
  }));

  // Frases del léxico: "raza pequeña" da el concepto a AMBAS palabras, para que
  // ninguna quede sin cubrir y dispare una degradación innecesaria.
  for (const { words, conceptId } of phraseConcepts(folded)) {
    for (const term of terms) {
      if (words.includes(term.text) && !term.concepts.includes(conceptId)) {
        term.concepts.push(conceptId);
      }
    }
  }

  return { folded, terms };
}

/**
 * Corrige tipeos contra el vocabulario real del catálogo. Solo interviene en
 * términos que no existen ni como palabra ni como prefijo de una palabra
 * conocida — "acan" es un prefijo legítimo de "acana" y NO se toca; "akana" sí.
 * Devuelve la consulta corregida, o `null` si no hubo nada que corregir.
 */
function correctQuery(parsed: ParsedQuery, index: SearchIndex): string | null {
  let changed = false;
  const corrected = parsed.terms.map((term) => {
    if (term.optional || term.concepts.length || term.text.length < 4) return term.text;
    if (index.vocabularySet.has(term.text)) return term.text;
    if (index.vocabulary.some((word) => word.startsWith(term.text))) return term.text;

    const max = typoTolerance(term.text);
    if (!max) return term.text;

    let best: string | null = null;
    let bestDistance = max + 1;
    for (const word of index.vocabulary) {
      const distance = editDistance(term.text, word, bestDistance - 1);
      if (distance < bestDistance) {
        best = word;
        bestDistance = distance;
        if (distance === 1) break; // suficientemente cerca; no hay mejor realista
      }
    }
    if (!best) return term.text;
    changed = true;
    return best;
  });

  return changed ? corrected.join(" ") : null;
}

/* -------------------------------------------------------------------------- */
/*                                  Ranking                                    */
/* -------------------------------------------------------------------------- */

/**
 * Pesos del ranking. El orden que producen es el que se espera de una tienda:
 *
 *   1. título exacto              →  "orijen six fish"
 *   2. marca + concepto (todo)    →  "acana cachorro" → Acana Puppy
 *   3. solo marca                 →  otros Acana
 *   4. solo concepto              →  otros alimentos de cachorro
 *   5. parecidos                  →  resto
 *
 * Las claves son la COBERTURA (cuántos términos de la consulta cubre el producto)
 * y, dentro de la misma cobertura, cuán literal fue la coincidencia. La marca
 * puntúa apenas sobre el concepto a propósito: "acana" es más específico que
 * "cachorro", así que ante cobertura parcial mandan los Acana.
 */
const SCORE = {
  fullTitle: 1200,
  phrase: 320,
  phraseStart: 140,
  word: 160,
  brandWord: 150,
  /** El nombre lo dice ("Puppy" para la consulta "cachorro"). */
  conceptInName: 130,
  /** Lo dicen los datos del backend (`stage`, `species`, `category`). */
  concept: 110,
  wordPrefix: 90,
  brandPrefix: 85,
  infix: 55,
  format: 40,
  /** Peso de la cobertura: domina sobre cualquier coincidencia suelta. */
  coverage: 600,
  /** Premio extra por cubrir TODOS los términos (separa el tier 2 del 3). */
  complete: 400,
  inStock: 25,
  featured: 12,
} as const;

function scoreTerm(doc: SearchDoc, term: QueryTerm): number {
  const t = term.text;
  let best = 0;
  const bump = (points: number) => {
    if (points > best) best = points;
  };

  if (doc.words.includes(t)) bump(SCORE.word);
  if (doc.brandWords.includes(t)) bump(SCORE.brandWord);
  if (term.concepts.some((id) => doc.textConcepts.has(id))) bump(SCORE.conceptInName);
  else if (term.concepts.some((id) => doc.concepts.has(id))) bump(SCORE.concept);
  // Prefijos: el mínimo de 2 letras evita que "a" prefije media tienda.
  if (t.length >= 2) {
    if (doc.words.some((w) => w.startsWith(t))) bump(SCORE.wordPrefix);
    if (doc.brandWords.some((w) => w.startsWith(t))) bump(SCORE.brandPrefix);
  }
  // Infijo ("six" dentro de "sixfish", "kg" dentro de un formato): último recurso,
  // desde 3 letras para que no coincida con cualquier cosa.
  if (t.length >= 3 && doc.haystack.includes(t)) bump(SCORE.infix);
  if (doc.formatWords.has(t)) bump(SCORE.format);

  return best;
}

interface ScoredDoc {
  doc: SearchDoc;
  score: number;
  /** 0–1: proporción de términos exigibles que el producto cubre. */
  coverage: number;
}

function rank(index: SearchIndex, query: ParsedQuery): ScoredDoc[] {
  const multiTerm = query.terms.length > 1;
  const scored: ScoredDoc[] = [];

  for (const doc of index.docs) {
    let score = 0;

    if (doc.name === query.folded || `${doc.brandName} ${doc.name}` === query.folded) {
      score += SCORE.fullTitle;
    } else if (multiTerm && doc.haystack.includes(query.folded)) {
      // Solo con 2+ términos: con uno, el bono de frase duplicaría el del término.
      score += SCORE.phrase;
      if (doc.haystack.startsWith(query.folded) || doc.name.startsWith(query.folded)) {
        score += SCORE.phraseStart;
      }
    }

    let required = 0;
    let matched = 0;
    for (const term of query.terms) {
      const points = scoreTerm(doc, term);
      score += points;
      if (!term.optional) {
        required++;
        if (points > 0) matched++;
      }
    }

    if (score === 0) continue;
    const coverage = required === 0 ? 1 : matched / required;
    score += coverage * SCORE.coverage;
    if (coverage === 1) score += SCORE.complete;
    if (doc.product.stock > 0) score += SCORE.inStock;
    if (doc.product.featuredLanding) score += SCORE.featured;

    scored.push({ doc, score, coverage });
  }

  return scored.sort(compareScored);
}

/**
 * Desempates, en orden: disponible antes que agotado y —a igualdad de todo lo
 * demás— nombre más corto primero. Lo segundo no es estética: con el mismo score,
 * "Salvaje Adulto con Salmón" responde mejor a *salmón* que "Amity SP Low Grain
 * Salmon Adult Breeder", porque el término es una parte mayor de lo que el
 * producto es. El último criterio es alfabético para que el orden sea estable.
 */
function compareScored(a: ScoredDoc, b: ScoredDoc): number {
  return compareProducts(a.doc.product, b.doc.product, b.score - a.score);
}

function compareProducts(a: Product, b: Product, byScore: number): number {
  return (
    byScore ||
    Number(b.stock > 0) - Number(a.stock > 0) ||
    a.name.length - b.name.length ||
    a.name.localeCompare(b.name, "es")
  );
}

/* -------------------------------------------------------------------------- */
/*                            Resultado y degradación                          */
/* -------------------------------------------------------------------------- */

/** Bloque de resultados alternativos cuando la búsqueda exacta no da nada. */
export interface SearchGroup {
  id: string;
  title: string;
  products: Product[];
}

export interface SearchOutcome {
  /**
   * Consulta a mostrar: tal cual se escribió (con tildes y mayúsculas) o, si
   * hubo tipeo, la corregida. Nunca la forma interna plegada — a nadie le sirve
   * leer "salmon" cuando escribió "salmón".
   */
  query: string;
  /** Lo que se había escrito, presente solo si se corrigió ("akana" → "acana"). */
  correctedFrom?: string;
  /** Productos que cubren TODOS los términos buscados. */
  results: Product[];
  /** Cuántos hubo antes de recortar a `limit`. */
  total: number;
  /** `false` cuando no hubo coincidencia completa y solo hay alternativas. */
  exact: boolean;
  /** Alternativas: nunca se devuelve una pantalla vacía. */
  groups: SearchGroup[];
}

export interface SearchOptions {
  /** Máximo de resultados exactos devueltos (la vista pagina sobre esto). */
  limit?: number;
  /** Tamaño de cada bloque de alternativas. */
  groupSize?: number;
}

/**
 * Búsqueda completa con degradación. El contrato es: **si hay catálogo, siempre
 * devuelve algo útil**. Baja peldaño por peldaño —coincidencia exacta → marca →
 * concepto → parecidos → destacados— en vez de saltar al vacío.
 */
export function searchCatalog(
  products: Product[],
  rawQuery: string,
  { limit = 48, groupSize = 8 }: SearchOptions = {},
): SearchOutcome {
  const index = getIndex(products);
  let parsed = parseQuery(rawQuery);

  if (!parsed.terms.length) {
    return {
      query: "",
      results: [],
      total: 0,
      exact: false,
      groups: popularGroups(products, groupSize),
    };
  }

  let ranked = rank(index, parsed);
  let full = ranked.filter((r) => r.coverage === 1);
  let correctedFrom: string | undefined;
  let query = rawQuery.trim();

  // Corrector: solo entra si la consulta tal cual no dio ninguna coincidencia
  // completa, y solo se adopta si la corregida SÍ la da. Así nunca empeora.
  if (!full.length) {
    const fixed = correctQuery(parsed, index);
    if (fixed && fixed !== parsed.folded) {
      const reparsed = parseQuery(fixed);
      const reranked = rank(index, reparsed);
      const refull = reranked.filter((r) => r.coverage === 1);
      if (refull.length) {
        correctedFrom = query;
        query = reparsed.folded; // una corrección ES una reescritura: se muestra tal cual
        parsed = reparsed;
        ranked = reranked;
        full = refull;
      }
    }
  }

  const groups: SearchGroup[] = full.length
    ? relatedGroups(index, parsed, ranked, full, groupSize)
    : degradedGroups(index, parsed, ranked, products, groupSize);

  return {
    query,
    correctedFrom,
    results: full.slice(0, limit).map((r) => r.doc.product),
    total: full.length,
    exact: full.length > 0,
    groups,
  };
}

/**
 * Con resultados exactos pero POCOS, se ofrece un bloque de parecidos: tres
 * resultados y nada más se lee como un callejón sin salida. Se intenta, en este
 * orden, lo que cubría parte de la consulta → el concepto más amplio ("jabalí"
 * → cerdo) → la misma categoría.
 */
function relatedGroups(
  index: SearchIndex,
  query: ParsedQuery,
  ranked: ScoredDoc[],
  full: ScoredDoc[],
  size: number,
): SearchGroup[] {
  if (full.length >= 4) return [];

  const shown = new Set(full.map((r) => r.doc.product.id));
  const order = orderBy(ranked, size);

  const partial = ranked.filter((r) => r.coverage < 1 && !shown.has(r.doc.product.id));
  if (partial.length) {
    return [
      {
        id: "similares",
        title: "También te puede interesar",
        products: partial.slice(0, size).map((r) => r.doc.product),
      },
    ];
  }

  // Consulta de un solo concepto muy específico: se sube un peldaño en el léxico.
  for (const term of query.terms) {
    for (const conceptId of term.concepts) {
      for (const parentId of withAncestors([conceptId])) {
        if (parentId === conceptId) continue;
        const parent = conceptById(parentId);
        const docs = index.docs.filter((d) => d.concepts.has(parentId) && !shown.has(d.product.id));
        if (parent && docs.length) {
          return [{ id: `amplia-${parentId}`, title: parent.groupLabel, products: order(docs) }];
        }
      }
    }
  }

  // Último recurso: más de la misma categoría que lo encontrado.
  const category = full[0].doc.product.category;
  const sameCategory = index.docs.filter((d) => d.product.category === category && !shown.has(d.product.id));
  if (!sameCategory.length) return [];
  return [{ id: `categoria-${category}`, title: `Más en ${category}`, products: order(sameCategory) }];
}

/**
 * Sin coincidencia completa: se sueltan condiciones de a una, de la más
 * específica a la más genérica. Se muestran como máximo dos bloques —más que eso
 * deja de ser ayuda y pasa a ser ruido.
 */
function degradedGroups(
  index: SearchIndex,
  query: ParsedQuery,
  ranked: ScoredDoc[],
  products: Product[],
  size: number,
): SearchGroup[] {
  const order = orderBy(ranked, size);
  const groups: SearchGroup[] = [];

  // 1. Marca reconocida en la consulta → todo lo de esa marca.
  for (const brand of index.brands) {
    if (groups.length >= 2) break;
    const named = query.terms.some(
      (t) => !t.optional && brand.words.some((w) => w === t.text || (t.text.length >= 3 && w.startsWith(t.text))),
    );
    if (!named) continue;
    const docs = index.docs.filter((d) => d.product.brand.slug === brand.slug);
    if (docs.length) groups.push({ id: `marca-${brand.slug}`, title: `Todo de ${brand.name}`, products: order(docs) });
  }

  // 2. Conceptos de la consulta (etapa, especie, categoría, sabor…).
  const seen = new Set<string>();
  for (const term of query.terms) {
    if (groups.length >= 2) break;
    for (const conceptId of term.concepts) {
      if (groups.length >= 2 || seen.has(conceptId)) continue;
      seen.add(conceptId);
      const concept = conceptById(conceptId);
      if (!concept) continue;
      const docs = index.docs.filter((d) => d.concepts.has(conceptId));
      if (docs.length) groups.push({ id: `concepto-${conceptId}`, title: concept.groupLabel, products: order(docs) });
    }
  }

  // 3. Lo más parecido: cobertura parcial, por score.
  if (!groups.length) {
    const partial = ranked.slice(0, size);
    if (partial.length) {
      groups.push({ id: "similares", title: "Lo más parecido", products: partial.map((r) => r.doc.product) });
    }
  }

  // 4. Nada coincidió: destacados antes que una pantalla vacía.
  if (!groups.length) groups.push(...popularGroups(products, size));

  return groups;
}

/**
 * Ordena los productos de un bloque alternativo. Dentro de cada bloque manda lo
 * que MÁS se acercaba a la consulta completa: si buscaste "acana cachorro" y no
 * hay, "Todo de Acana" abre por los Acana que algo tenían que ver, no por orden
 * alfabético.
 */
function orderBy(ranked: ScoredDoc[], size: number): (docs: SearchDoc[]) => Product[] {
  const scoreByProductId = new Map(ranked.map((r) => [r.doc.product.id, r.score]));
  return (docs) =>
    [...docs]
      .sort((a, b) =>
        compareProducts(
          a.product,
          b.product,
          (scoreByProductId.get(b.product.id) ?? 0) - (scoreByProductId.get(a.product.id) ?? 0),
        ),
      )
      .slice(0, size)
      .map((d) => d.product);
}

/** Último escalón (y estado inicial del buscador): la vitrina curada del Admin. */
function popularGroups(products: Product[], size: number): SearchGroup[] {
  const featured = featuredShowcase(products, size);
  return featured.length ? [{ id: "destacados", title: "Los favoritos de la manada", products: featured }] : [];
}

/* -------------------------------------------------------------------------- */
/*                          Sugerencias mientras se escribe                    */
/* -------------------------------------------------------------------------- */

export interface SearchSuggestions {
  /** Productos que ya se pueden abrir sin pulsar Enter. */
  products: Product[];
  /** Términos para completar la consulta (marcas y conceptos). */
  terms: string[];
  /** Total de coincidencias, para el pie "ver los N resultados". */
  total: number;
}

/**
 * Sugerencias del autocompletado. Deliberadamente tolerante: si no hay
 * coincidencia completa, cae a las parciales — el desplegable tampoco debe
 * quedar vacío mientras se escribe.
 *
 * Los términos sugeridos salen SIEMPRE de los resultados que ya se tienen a la
 * vista. Sugerir algo que después devuelve cero es peor que no sugerir nada.
 */
export function suggestSearch(products: Product[], rawQuery: string, limit = 6): SearchSuggestions {
  const parsed = parseQuery(rawQuery);
  if (!parsed.terms.length) return { products: [], terms: [], total: 0 };

  const index = getIndex(products);
  const ranked = rank(index, parsed);
  const full = ranked.filter((r) => r.coverage === 1);
  const pool = full.length ? full : ranked;
  const head = pool.slice(0, SUGGEST_POOL);
  const last = parsed.terms[parsed.terms.length - 1].text;

  const terms: string[] = [];
  // 1. Marcas presentes en los resultados que continúan lo escrito ("sal" → Salvaje).
  const brandsInPool = new Set(head.map((r) => r.doc.product.brand.slug));
  for (const brand of index.brands) {
    if (terms.length >= 2) break;
    if (!brandsInPool.has(brand.slug)) continue;
    if (fold(brand.name) === parsed.folded) continue; // ya está escrita entera
    if (brand.words.some((w) => w.startsWith(last))) terms.push(brand.name);
  }
  // 2. Conceptos que los resultados realmente tienen ("gat" → Para gatos).
  const conceptsInPool = new Set(head.flatMap((r) => [...r.doc.concepts]));
  for (const { label, conceptId } of suggestConceptLabels(last, 4)) {
    if (terms.length >= 4) break;
    if (conceptsInPool.has(conceptId) && !terms.includes(label)) terms.push(label);
  }

  return { products: pool.slice(0, limit).map((r) => r.doc.product), terms, total: pool.length };
}

/** Cuántos resultados se miran para deducir términos sugeridos. */
const SUGGEST_POOL = 24;
