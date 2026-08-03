import { fold, isStopword } from "./normalize";

/**
 * Léxico de conceptos del buscador — **el traductor entre cómo habla el cliente
 * y cómo se llaman los productos**.
 *
 * Por qué existe: el catálogo real de Manada está mayormente en inglés ("Orijen
 * Puppy", "Pacific Stream Salmón Ahumado", "Bravery Chicken Kitten") y el cliente
 * chileno busca en español ("cachorro", "pescado", "gato esterilizado"). Sin este
 * mapa, "acana cachorro" no encuentra "Acana Puppy" por más buen ranking que haya.
 *
 * Un concepto agrupa todas las formas de nombrar la misma idea. Se detecta en dos
 * lugares y de la misma forma (`detectConcepts`):
 *   1. en la CONSULTA  → qué quiso decir el cliente;
 *   2. en el PRODUCTO  → qué es realmente (nombre + atributos estructurados).
 *
 * Los conceptos de `species`/`stage`/`category` además existen como campos reales
 * del dominio (`Product.species`, `.stage`, `.category`), así que un producto los
 * hereda del backend aunque su nombre no diga nada (ver `structuralConcepts`).
 * Los demás (sabor, tamaño, humedad, rasgo) solo viven en el texto del nombre.
 *
 * Ampliarlo es agregar una fila. NO es un diccionario general del español: solo
 * entra vocabulario que el cliente usa para comprar comida y accesorios de mascota.
 */

export type ConceptKind = "species" | "stage" | "category" | "flavor" | "size" | "moisture" | "trait";

export interface Concept {
  /** `${kind}:${slug}` — p. ej. "stage:cachorro". */
  id: string;
  kind: ConceptKind;
  /** Título para la sección de resultados degradados ("Para cachorros"). */
  groupLabel: string;
  /** Cómo lo nombra la gente. Se pliegan al cargar; pueden ser multi-palabra. */
  terms: string[];
  /**
   * Conceptos más generales que este implica. **Solo se expanden en el producto,
   * nunca en la consulta**, y de ahí sale la precisión del buscador: un producto
   * "Salmón Ahumado" también es "pescado", así que buscar *pescado* lo encuentra;
   * pero buscar *salmón* NO arrastra a todos los pescados del catálogo.
   */
  parents?: string[];
}

function concept(
  kind: ConceptKind,
  slug: string,
  groupLabel: string,
  terms: string[],
  parents?: string[],
): Concept {
  return { id: `${kind}:${slug}`, kind, groupLabel, terms, parents };
}

export const CONCEPTS: Concept[] = [
  /* --------------------------------- especie -------------------------------- */
  concept("species", "perro", "Para perros", [
    "perro", "perros", "perrito", "perrita", "perruno", "can", "canino", "dog", "dogs", "canine",
  ]),
  concept("species", "gato", "Para gatos", [
    "gato", "gatos", "gatito", "gatita", "gatuno", "michi", "felino", "cat", "cats", "feline", "kitten",
  ]),

  /* ------------------------------ etapa de vida ----------------------------- */
  concept("stage", "cachorro", "Para cachorros", [
    "cachorro", "cachorros", "cachorrito", "puppy", "puppies", "junior", "kitten", "gatito",
    "crecimiento", "growth", "bebe", "cria",
  ]),
  concept("stage", "adulto", "Para adultos", [
    "adulto", "adulta", "adultos", "adultas", "adult", "mantenimiento", "maintenance",
  ]),
  concept("stage", "senior", "Para seniors", [
    "senior", "seniors", "mayor", "mayores", "anciano", "ancianos", "viejito", "geriatrico",
  ]),

  /* -------------------------------- categoría ------------------------------- */
  // Sin "food": es palabra literal de decenas de nombres ("Wet Food"), así que
  // como concepto no aporta nada y sí distorsiona (haría que "comida para gatos"
  // abra por los húmedos). El match literal ya la cubre.
  concept("category", "alimento", "Alimento", [
    "alimento", "alimentos", "comida", "comidas", "croqueta", "croquetas", "pienso",
    "concentrado", "balanceado", "racion", "raciones",
  ]),
  concept("category", "snacks", "Snacks y premios", [
    "snack", "snacks", "premio", "premios", "treat", "treats", "galleta", "galletas", "golosina",
    "golosinas", "hueso", "huesos",
  ]),
  concept("category", "farmacia", "Farmacia", [
    "farmacia", "antiparasitario", "antiparasitarios", "antipulgas", "pulga", "pulgas", "garrapata",
    "garrapatas", "desparasitante", "desparasitar", "medicamento", "medicamentos", "remedio",
    "vitamina", "vitaminas", "suplemento", "suplementos", "prescription", "veterinaria",
  ]),
  concept("category", "higiene", "Higiene", [
    "higiene", "shampoo", "champu", "arena", "sanitaria", "bano", "toallita", "toallitas",
    "cepillo", "dental", "limpieza", "desodorante",
  ]),
  concept("category", "accesorios", "Accesorios", [
    "accesorio", "accesorios", "cama", "camas", "juguete", "juguetes", "correa", "collar", "arnes",
    "plato", "bebedero", "comedero", "transportadora", "rascador", "cucha",
  ]),

  /* ---------------------------------- sabor --------------------------------- */
  // Jerarquía a propósito (ver `parents`): buscar "pescado" alcanza al salmón, al
  // atún y a la trucha; buscar "salmón" devuelve salmón. Lo mismo con las aves.
  concept("flavor", "pescado", "Con pescado", ["pescado", "pescados", "fish", "seafood", "marino", "mariscos"]),
  concept("flavor", "salmon", "Con salmón", ["salmon"], ["flavor:pescado"]),
  concept("flavor", "atun", "Con atún", ["atun", "tuna"], ["flavor:pescado"]),
  concept("flavor", "trucha", "Con trucha", ["trucha", "trout"], ["flavor:pescado"]),
  concept("flavor", "sardina", "Con sardina", ["sardina", "sardinas", "sardine"], ["flavor:pescado"]),

  concept("flavor", "ave", "Con ave", ["ave", "aves", "poultry", "aviar"]),
  concept("flavor", "pollo", "Con pollo", ["pollo", "pollos", "chicken"], ["flavor:ave"]),
  concept("flavor", "pavo", "Con pavo", ["pavo", "turkey"], ["flavor:ave"]),
  concept("flavor", "pato", "Con pato", ["pato", "duck"], ["flavor:ave"]),

  concept("flavor", "carne", "Con carne", ["carne", "carnes", "beef", "res", "vacuno", "buey", "ternera"]),
  concept("flavor", "angus", "Con angus", ["angus"], ["flavor:carne"]),
  concept("flavor", "cordero", "Con cordero", ["cordero", "lamb", "oveja"]),
  concept("flavor", "venado", "Con venado", ["venado", "venison", "ciervo", "deer"]),
  concept("flavor", "cerdo", "Con cerdo", ["cerdo", "pork"]),
  concept("flavor", "jabali", "Con jabalí", ["jabali", "boar"], ["flavor:cerdo"]),
  concept("flavor", "bisonte", "Con bisonte", ["bisonte", "bison", "bufalo"]),
  // Sin "grano(s)": chocaba de frente con quien busca "sin granos" — le devolvía
  // justo los productos con arroz y cereales. El cereal se busca por su nombre.
  concept("flavor", "vegetal", "Con vegetales", [
    "verdura", "verduras", "vegetal", "vegetales", "vegetables", "arroz", "rice", "cereal", "cereales",
  ]),

  /* --------------------------------- tamaño --------------------------------- */
  concept("size", "pequena", "Para razas pequeñas", [
    "raza pequena", "razas pequenas", "small breed", "small breeds", "pequeno", "pequena",
    "pequenos", "pequenas", "mini", "toy", "chico", "chica",
  ]),
  concept("size", "mediana", "Para razas medianas", ["raza mediana", "razas medianas", "medium breed", "mediano", "mediana", "medium"]),
  concept("size", "grande", "Para razas grandes", [
    "raza grande", "razas grandes", "large breed", "large breeds", "grande", "grandes", "maxi",
    "gigante", "giant", "large",
  ]),

  /* -------------------------------- humedad --------------------------------- */
  concept("moisture", "humedo", "Alimento húmedo", ["humedo", "humeda", "wet", "mojado"]),
  concept("moisture", "pate", "En paté", ["pate", "mousse", "gelatina", "terrina"], ["moisture:humedo"]),
  concept("moisture", "caldo", "En caldo", ["caldito", "caldo", "salsa", "jugo", "gravy"], ["moisture:humedo"]),
  concept("moisture", "lata", "En lata o sobre", ["lata", "latas", "sobre", "sobres", "pouch"], ["moisture:humedo"]),
  concept("moisture", "seco", "Alimento seco", ["seco", "seca", "dry", "extruido"]),

  /* ---------------------------------- rasgo --------------------------------- */
  concept("trait", "esterilizado", "Para esterilizados", [
    "esterilizado", "esterilizada", "esterilizados", "sterilized", "castrado", "castrada", "neutered",
  ]),
  concept("trait", "light", "Control de peso", [
    "light", "fit", "trim", "sobrepeso", "obesidad", "adelgazar", "weight control", "control de peso", "delgado",
  ]),
  // Se reconoce la INTENCIÓN, pero hoy ningún producto la declara: ni el nombre
  // ni la metadata dicen si es grain free. Hasta que el backend exponga ese dato
  // (ver recomendaciones), la consulta degrada en vez de mentir.
  concept("trait", "sin-grano", "Sin granos", ["grain free", "sin grano", "sin granos", "libre de granos", "grainfree"]),
  concept("trait", "indoor", "De interior", ["indoor", "interior", "casa", "hogareno"]),
];

const BY_ID = new Map(CONCEPTS.map((c) => [c.id, c]));

/** Término plegado de UNA palabra → conceptos ("kitten" es especie Y etapa). */
const SINGLE_WORD_TERMS = new Map<string, string[]>();
/** Términos de VARIAS palabras ("small breed") → se buscan como frase. */
const PHRASE_TERMS: { phrase: string; conceptId: string }[] = [];

for (const c of CONCEPTS) {
  for (const raw of c.terms) {
    const term = fold(raw);
    if (!term) continue;
    if (term.includes(" ")) {
      PHRASE_TERMS.push({ phrase: term, conceptId: c.id });
      continue;
    }
    const ids = SINGLE_WORD_TERMS.get(term);
    if (ids) {
      if (!ids.includes(c.id)) ids.push(c.id);
    } else {
      SINGLE_WORD_TERMS.set(term, [c.id]);
    }
  }
}

/**
 * Todas las palabras sueltas del léxico. Alimentan el corrector ortográfico:
 * "cachorroo" debe poder corregirse aunque ningún producto se llame así.
 */
export const LEXICON_WORDS: string[] = [...SINGLE_WORD_TERMS.keys()];

export function conceptById(id: string): Concept | undefined {
  return BY_ID.get(id);
}

/** Conceptos que nombra un término suelto ya plegado. */
export function conceptsForTerm(term: string): string[] {
  return SINGLE_WORD_TERMS.get(term) ?? [];
}

/**
 * Conceptos que aparecen en el texto como FRASE ("raza pequeña", "small breed"),
 * con las palabras que los forman. La consulta los usa para dar por cubiertos
 * todos los tokens de la frase: quien escribe "raza pequeña" no debe quedarse sin
 * resultados porque "raza" suelta no signifique nada.
 */
export function phraseConcepts(folded: string): { words: string[]; conceptId: string }[] {
  if (!folded) return [];
  const padded = ` ${folded} `;
  const found: { words: string[]; conceptId: string }[] = [];
  for (const { phrase, conceptId } of PHRASE_TERMS) {
    if (padded.includes(` ${phrase} `)) found.push({ words: phrase.split(" "), conceptId });
  }
  return found;
}

/**
 * Conceptos presentes en un texto plegado. Los términos de una palabra se
 * comparan contra tokens COMPLETOS (así "wetlands" no cuenta como "wet" ni
 * "grandes" se detecta dentro de otra palabra); los de varias, como frase.
 */
export function detectConcepts(folded: string, tokens: string[]): Set<string> {
  const found = new Set<string>();
  for (const token of tokens) {
    for (const id of conceptsForTerm(token)) found.add(id);
  }
  if (folded) {
    const padded = ` ${folded} `;
    for (const { phrase, conceptId } of PHRASE_TERMS) {
      if (padded.includes(` ${phrase} `)) found.add(conceptId);
    }
  }
  return found;
}

/**
 * Suma los conceptos más generales que implican los encontrados (salmón →
 * pescado). Se aplica al PRODUCTO, nunca a la consulta: es lo que hace que
 * "pescado" encuentre el salmón sin que "salmón" devuelva todos los pescados.
 */
export function withAncestors(ids: Iterable<string>): Set<string> {
  const out = new Set(ids);
  const pending = [...out];
  while (pending.length) {
    const concept = BY_ID.get(pending.pop() as string);
    for (const parent of concept?.parents ?? []) {
      if (!out.has(parent)) {
        out.add(parent);
        pending.push(parent);
      }
    }
  }
  return out;
}

/**
 * Conceptos que un producto tiene por DATO, no por texto: los atributos que el
 * backend ya conoce. Es lo que permite que "cachorro" alcance a "Orijen Puppy"
 * (su `stage` es `cachorro` en metadata) sin depender de cómo se llame.
 */
export function structuralConcepts(
  species: readonly string[],
  stage: readonly string[] | undefined,
  category: string,
): string[] {
  const ids = species.map((s) => `species:${s}`);
  for (const s of stage ?? []) ids.push(`stage:${s}`);
  ids.push(`category:${category}`);
  return ids.filter((id) => BY_ID.has(id));
}

/**
 * Sugerencias de término para el autocompletado: conceptos cuyo vocabulario
 * empieza por lo que se escribió. Devuelve la etiqueta visible del concepto, no
 * el sinónimo tipeado — sugerir "puppy" a quien escribió "pupp" no enseña nada.
 */
export function suggestConceptLabels(
  prefix: string,
  limit: number,
): { label: string; conceptId: string }[] {
  const term = fold(prefix);
  if (term.length < 2 || isStopword(term)) return [];
  const out: { label: string; conceptId: string }[] = [];
  for (const c of CONCEPTS) {
    if (out.length >= limit) break;
    if (c.terms.some((t) => fold(t).startsWith(term))) out.push({ label: c.groupLabel, conceptId: c.id });
  }
  return out;
}
