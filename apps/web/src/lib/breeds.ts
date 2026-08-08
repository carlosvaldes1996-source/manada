import type { Species } from "@/types";
import { editDistance, fold, isStopword, tokenize, typoTolerance } from "@/lib/search/normalize";

/**
 * Catálogo OFICIAL de razas (fuente única · onboarding funnel F2/F3).
 *
 * Lista oficial de razas por especie, cada una con su rango de peso adulto típico
 * (kg, machos y hembras; referencia AKC/FCI cuando existe — provista por Carlos).
 * Alimenta dos cosas del onboarding —y solo esas dos—:
 *  - F2: el buscador de raza (`BreedCombobox`), con Mestizo fijado y escape a
 *    texto libre ("mi raza no aparece" = "Otra raza").
 *  - F3: la estimación de peso ("los {raza} pesan ~X–Y kg"), SIN obligar a un valor.
 *
 * ⚠️ La raza NO entra en el motor de recomendación ni en el cálculo nutricional
 * (RER/MER): ver `recommend.ts` / `anticipation.ts`, que solo usan especie, etapa,
 * peso, esterilización y condiciones. Cambiar este catálogo no puede alterar una
 * recomendación ni una ración.
 *
 * `pesoRangoAdulto` es OPCIONAL a nivel de tipo: si una raza futura llega sin dato,
 * F3 cae al selector de tamaño (buckets), igual que Mestizo, sin romperse.
 */

export interface Breed {
  nombre: string;
  especie: "perro" | "gato";
  /**
   * Rango de peso adulto típico en kg [min, max]. Opcional a nivel de tipo: ausente
   * ⇒ el paso de peso (F3) usa los buckets de tamaño en vez de pre-sugerir un peso.
   */
  pesoRangoAdulto?: [number, number];
  /** Fijada arriba en el selector (las más buscadas en Chile). */
  popular?: boolean;
  /**
   * Otros nombres con los que la gente busca esta raza: el nombre coloquial
   * chileno ("ovejero" por Pastor Alemán), el que quedó fuera del título oficial
   * ("carlino", "caniche") o el apodo de siempre ("yorkie", "pitbull"). Solo
   * alimentan el buscador —nunca se muestran—: el catálogo sigue teniendo un
   * nombre por raza. Sin sinónimo, esos nombres simplemente no encuentran nada.
   */
  sinonimos?: string[];
}

/** Una raza con rango de peso conocido (la que sí permite estimar peso en F3). */
export type BreedWithWeight = Breed & { pesoRangoAdulto: [number, number] };

/* --------------------------------- Perros -------------------------------- */
// Orden alfabético (el selector reordena: populares arriba, resto A→Z).

const DOG_BREEDS: Breed[] = [
  { nombre: "Affenpinscher", especie: "perro", pesoRangoAdulto: [3, 5] },
  { nombre: "Akita Inu", especie: "perro", pesoRangoAdulto: [32, 50] },
  { nombre: "Alaska Malamute", especie: "perro", pesoRangoAdulto: [34, 43] },
  { nombre: "American Bully", especie: "perro", pesoRangoAdulto: [20, 30] },
  { nombre: "American Staffordshire Terrier", especie: "perro", pesoRangoAdulto: [18, 32], sinonimos: ["Amstaff"] },
  { nombre: "Australian Cattle Dog", especie: "perro", pesoRangoAdulto: [14, 22] },
  { nombre: "Australian Shepherd", especie: "perro", pesoRangoAdulto: [18, 30] },
  { nombre: "Basenji", especie: "perro", pesoRangoAdulto: [9, 11] },
  { nombre: "Basset Hound", especie: "perro", pesoRangoAdulto: [20, 29] },
  { nombre: "Beagle", especie: "perro", pesoRangoAdulto: [9, 13], popular: true },
  { nombre: "Bichón Frisé", especie: "perro", pesoRangoAdulto: [3, 5] },
  { nombre: "Bichón Maltés", especie: "perro", pesoRangoAdulto: [3, 4] },
  { nombre: "Border Collie", especie: "perro", pesoRangoAdulto: [14, 20] },
  { nombre: "Boston Terrier", especie: "perro", pesoRangoAdulto: [5, 11] },
  { nombre: "Boxer", especie: "perro", pesoRangoAdulto: [25, 32] },
  { nombre: "Braco Alemán", especie: "perro", pesoRangoAdulto: [20, 32], sinonimos: ["Pointer Alemán", "Kurzhaar"] },
  { nombre: "Bull Terrier", especie: "perro", pesoRangoAdulto: [22, 32] },
  { nombre: "Bulldog Americano", especie: "perro", pesoRangoAdulto: [27, 54] },
  { nombre: "Bulldog Francés", especie: "perro", pesoRangoAdulto: [8, 14], popular: true, sinonimos: ["Frenchie"] },
  { nombre: "Bulldog Inglés", especie: "perro", pesoRangoAdulto: [18, 25] },
  { nombre: "Bullmastiff", especie: "perro", pesoRangoAdulto: [45, 59] },
  { nombre: "Cairn Terrier", especie: "perro", pesoRangoAdulto: [6, 8] },
  { nombre: "Cavalier King Charles Spaniel", especie: "perro", pesoRangoAdulto: [6, 8] },
  { nombre: "Chihuahua", especie: "perro", pesoRangoAdulto: [1.5, 3], popular: true },
  { nombre: "Chow Chow", especie: "perro", pesoRangoAdulto: [20, 32] },
  { nombre: "Cocker Spaniel Americano", especie: "perro", pesoRangoAdulto: [9, 14] },
  { nombre: "Cocker Spaniel Inglés", especie: "perro", pesoRangoAdulto: [13, 16] },
  { nombre: "Collie", especie: "perro", pesoRangoAdulto: [18, 30] },
  { nombre: "Corgi Galés (Pembroke)", especie: "perro", pesoRangoAdulto: [10, 14] },
  { nombre: "Corgi Galés (Cardigan)", especie: "perro", pesoRangoAdulto: [11, 17] },
  { nombre: "Dachshund (Salchicha)", especie: "perro", pesoRangoAdulto: [4, 9], sinonimos: ["Teckel", "Perro salchicha"] },
  { nombre: "Dálmata", especie: "perro", pesoRangoAdulto: [20, 32] },
  { nombre: "Doberman", especie: "perro", pesoRangoAdulto: [30, 40] },
  { nombre: "Dogo Argentino", especie: "perro", pesoRangoAdulto: [35, 45] },
  { nombre: "Fila Brasileño", especie: "perro", pesoRangoAdulto: [40, 50] },
  { nombre: "Fox Terrier", especie: "perro", pesoRangoAdulto: [6, 9] },
  { nombre: "Galgo", especie: "perro", pesoRangoAdulto: [20, 30] },
  { nombre: "Golden Retriever", especie: "perro", pesoRangoAdulto: [25, 34], popular: true },
  { nombre: "Gran Danés", especie: "perro", pesoRangoAdulto: [50, 80], sinonimos: ["Dogo Alemán", "Great Dane"] },
  { nombre: "Greyhound", especie: "perro", pesoRangoAdulto: [27, 40] },
  { nombre: "Husky Siberiano", especie: "perro", pesoRangoAdulto: [16, 27] },
  { nombre: "Jack Russell Terrier", especie: "perro", pesoRangoAdulto: [5, 8] },
  { nombre: "Labrador Retriever", especie: "perro", pesoRangoAdulto: [25, 36], popular: true },
  { nombre: "Lhasa Apso", especie: "perro", pesoRangoAdulto: [5, 8] },
  { nombre: "Mastín Napolitano", especie: "perro", pesoRangoAdulto: [50, 70] },
  { nombre: "Papillón", especie: "perro", pesoRangoAdulto: [2, 5] },
  { nombre: "Pastor Alemán", especie: "perro", pesoRangoAdulto: [22, 40], popular: true, sinonimos: ["Ovejero Alemán", "German Shepherd"] },
  { nombre: "Pastor Australiano", especie: "perro", pesoRangoAdulto: [18, 30] },
  { nombre: "Pastor Belga Malinois", especie: "perro", pesoRangoAdulto: [20, 30] },
  { nombre: "Pastor de Shetland", especie: "perro", pesoRangoAdulto: [6, 12], sinonimos: ["Sheltie"] },
  { nombre: "Pastor Suizo Blanco", especie: "perro", pesoRangoAdulto: [25, 40] },
  { nombre: "Pekinés", especie: "perro", pesoRangoAdulto: [3, 6] },
  { nombre: "Pinscher Miniatura", especie: "perro", pesoRangoAdulto: [4, 6] },
  { nombre: "Pit Bull Terrier", especie: "perro", pesoRangoAdulto: [16, 30], sinonimos: ["Pitbull"] },
  { nombre: "Pointer Inglés", especie: "perro", pesoRangoAdulto: [20, 34] },
  { nombre: "Pomerania", especie: "perro", pesoRangoAdulto: [1.5, 3.5], sinonimos: ["Pomeranian", "Lulú de Pomerania"] },
  { nombre: "Poodle Toy", especie: "perro", pesoRangoAdulto: [2, 4], sinonimos: ["Caniche"] },
  { nombre: "Poodle Miniatura", especie: "perro", pesoRangoAdulto: [5, 9], sinonimos: ["Caniche"] },
  { nombre: "Poodle Estándar", especie: "perro", pesoRangoAdulto: [20, 32], sinonimos: ["Caniche"] },
  { nombre: "Presa Canario", especie: "perro", pesoRangoAdulto: [40, 65], sinonimos: ["Dogo Canario"] },
  { nombre: "Pug", especie: "perro", pesoRangoAdulto: [6, 9], popular: true, sinonimos: ["Carlino"] },
  { nombre: "Rat Terrier", especie: "perro", pesoRangoAdulto: [4, 11] },
  { nombre: "Rhodesian Ridgeback", especie: "perro", pesoRangoAdulto: [29, 41], sinonimos: ["Rodesiano", "Ridgeback", "Perro Crestado Rodesiano"] },
  { nombre: "Rottweiler", especie: "perro", pesoRangoAdulto: [35, 60] },
  { nombre: "Samoyedo", especie: "perro", pesoRangoAdulto: [16, 30] },
  { nombre: "San Bernardo", especie: "perro", pesoRangoAdulto: [60, 90], sinonimos: ["Saint Bernard"] },
  { nombre: "Schnauzer Miniatura", especie: "perro", pesoRangoAdulto: [5, 9] },
  { nombre: "Schnauzer Estándar", especie: "perro", pesoRangoAdulto: [14, 20] },
  { nombre: "Schnauzer Gigante", especie: "perro", pesoRangoAdulto: [25, 48] },
  { nombre: "Setter Irlandés", especie: "perro", pesoRangoAdulto: [25, 32] },
  { nombre: "Shar Pei", especie: "perro", pesoRangoAdulto: [18, 29] },
  { nombre: "Shiba Inu", especie: "perro", pesoRangoAdulto: [7, 11] },
  { nombre: "Shih Tzu", especie: "perro", pesoRangoAdulto: [4, 8] },
  { nombre: "Springer Spaniel Inglés", especie: "perro", pesoRangoAdulto: [18, 25] },
  { nombre: "Staffordshire Bull Terrier", especie: "perro", pesoRangoAdulto: [11, 17], sinonimos: ["Staffy"] },
  { nombre: "Terra Nova (Newfoundland)", especie: "perro", pesoRangoAdulto: [45, 70] },
  { nombre: "Vizsla", especie: "perro", pesoRangoAdulto: [20, 30], sinonimos: ["Braco Húngaro"] },
  { nombre: "Weimaraner", especie: "perro", pesoRangoAdulto: [25, 40], sinonimos: ["Braco de Weimar"] },
  { nombre: "West Highland White Terrier", especie: "perro", pesoRangoAdulto: [6, 10], sinonimos: ["Westie"] },
  { nombre: "Whippet", especie: "perro", pesoRangoAdulto: [9, 19] },
  { nombre: "Yorkshire Terrier", especie: "perro", pesoRangoAdulto: [2, 3.5], popular: true, sinonimos: ["Yorkie"] },
];

/* --------------------------------- Gatos --------------------------------- */

const CAT_BREEDS: Breed[] = [
  { nombre: "Abisinio", especie: "gato", pesoRangoAdulto: [3, 5] },
  { nombre: "American Curl", especie: "gato", pesoRangoAdulto: [3, 5] },
  { nombre: "American Shorthair", especie: "gato", pesoRangoAdulto: [3, 7], sinonimos: ["Americano de Pelo Corto"] },
  { nombre: "Angora Turco", especie: "gato", pesoRangoAdulto: [3, 5], popular: true },
  { nombre: "Bengalí", especie: "gato", pesoRangoAdulto: [4, 7] },
  { nombre: "Birmano (Birman)", especie: "gato", pesoRangoAdulto: [3, 5.5], sinonimos: ["Sagrado de Birmania"] },
  { nombre: "Bombay", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "British Shorthair", especie: "gato", pesoRangoAdulto: [4, 8], popular: true, sinonimos: ["Británico de Pelo Corto"] },
  { nombre: "British Longhair", especie: "gato", pesoRangoAdulto: [4, 8], sinonimos: ["Británico de Pelo Largo"] },
  { nombre: "Burmés", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "Chartreux", especie: "gato", pesoRangoAdulto: [4, 7], sinonimos: ["Cartujo"] },
  { nombre: "Cornish Rex", especie: "gato", pesoRangoAdulto: [2, 4.5] },
  { nombre: "Devon Rex", especie: "gato", pesoRangoAdulto: [2.5, 4.5] },
  { nombre: "Exótico de Pelo Corto", especie: "gato", pesoRangoAdulto: [3, 6], sinonimos: ["Exotic Shorthair"] },
  { nombre: "Himalayo", especie: "gato", pesoRangoAdulto: [3, 5.5], sinonimos: ["Himalayan"] },
  { nombre: "Maine Coon", especie: "gato", pesoRangoAdulto: [5, 9], popular: true },
  { nombre: "Manx", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "Munchkin", especie: "gato", pesoRangoAdulto: [2, 4] },
  { nombre: "Noruego de Bosque", especie: "gato", pesoRangoAdulto: [4, 7.5], sinonimos: ["Bosque de Noruega", "Norwegian Forest"] },
  { nombre: "Ocicat", especie: "gato", pesoRangoAdulto: [3, 7] },
  { nombre: "Persa", especie: "gato", pesoRangoAdulto: [3, 5.5], popular: true },
  { nombre: "Ragdoll", especie: "gato", pesoRangoAdulto: [4.5, 9] },
  { nombre: "Ruso Azul", especie: "gato", pesoRangoAdulto: [3, 5.5], sinonimos: ["Russian Blue"] },
  { nombre: "Scottish Fold", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "Siamés", especie: "gato", pesoRangoAdulto: [3, 5], popular: true },
  { nombre: "Siberiano", especie: "gato", pesoRangoAdulto: [4, 9] },
  { nombre: "Singapura", especie: "gato", pesoRangoAdulto: [2, 4] },
  { nombre: "Snowshoe", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "Somalí", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "Sphynx (Sin pelo)", especie: "gato", pesoRangoAdulto: [3, 5], sinonimos: ["Esfinge"] },
  { nombre: "Tonkinés", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "Van Turco", especie: "gato", pesoRangoAdulto: [4, 9] },
];

/* -------------------------- Mestizo / Sin raza --------------------------- */

/**
 * Etiqueta oficial de "sin raza definida", fijada arriba del selector. No está en
 * las listas anteriores porque no tiene un rango de peso único → dispara los
 * buckets de tamaño en el paso de peso (F3).
 */
export function mestizoLabel(): string {
  return "Mestizo / Sin raza definida";
}

export function isMestizo(nombre: string): boolean {
  return normalize(nombre) === normalize(mestizoLabel());
}

/** Cómo se busca "sin raza definida" en Chile (la etiqueta oficial no basta). */
const MESTIZO_SINONIMOS = ["Quiltro", "Kiltro", "Callejero", "Mezcla", "Mix", "No sé", "Ninguna"];

/** ¿La consulta apunta a Mestizo? Mismo matcher que el resto del selector. */
export function matchesMestizo(query: string): boolean {
  return matchesBreedQuery(query, mestizoLabel(), MESTIZO_SINONIMOS);
}

/* --------------------------------- Búsqueda ------------------------------ */

/** Normaliza para comparar sin acentos ni mayúsculas ("Bulldog" ≈ "búldog"). */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Razas de la especie (perro/gato). Otras especies no tienen lista curada. */
export function breedsForSpecies(species: Species): Breed[] {
  if (species === "perro") return DOG_BREEDS;
  if (species === "gato") return CAT_BREEDS;
  return [];
}

/** Razas fijadas arriba (comunes) + resto en orden alfabético. */
export function orderedBreeds(species: Species): Breed[] {
  const list = breedsForSpecies(species);
  const popular = list.filter((b) => b.popular);
  const rest = list.filter((b) => !b.popular).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return [...popular, ...rest];
}

/* ------------------------- Buscador de razas (F2) ------------------------ */

/**
 * Buscador del selector de raza — **tolerante a tipeos y a nombres coloquiales**,
 * con el mismo criterio que el buscador de productos: reusa sus primitivas de
 * texto (`fold`, `editDistance`, `typoTolerance`) para que "buscar" signifique lo
 * mismo en toda la app.
 *
 * Nadie escribe una raza como está en el catálogo. Escribe *rodesiano* por
 * Rhodesian, *pitbull* pegado, *ovejero* en vez de Pastor Alemán, o simplemente
 * baila dos letras. Un `includes` literal —lo que había— devolvía cero en los
 * cuatro casos y empujaba a "mi raza no aparece", que es exactamente el escape
 * que NO queremos usar cuando la raza sí está en la lista.
 *
 * Cuatro formas de encontrar una raza, de la más literal a la más flexible:
 *   1. palabra exacta del nombre o de un sinónimo   ("beagle", "carlino")
 *   2. prefijo de una palabra                       ("labrad" → Labrador)
 *   3. la consulta entera, sin espacios             ("pitbull" → Pit Bull Terrier)
 *   4. distancia de edición                         ("retriver" → Retriever)
 *
 * La tolerancia a tipeos la fija `typoTolerance` por largo de palabra: con 3
 * letras o menos, ninguna —ahí un error cambia la palabra entera y el buscador
 * empezaría a inventar razas.
 */

/**
 * Índice de texto de un candidato: todas las formas en que puede coincidir. Se
 * arma igual para una raza del catálogo y para Mestizo (que no está en las listas).
 */
interface TextDoc {
  /** Palabras del nombre plegado ("Bulldog Francés" → ["bulldog", "frances"]). */
  words: string[];
  /** Palabras de los sinónimos, plegadas. */
  aliasWords: string[];
  /** Nombre + sinónimos en un solo texto: coincidencias de infijo. */
  haystack: string;
  /** Nombre y sinónimos SIN espacios: "pitbull" contra "Pit Bull Terrier". */
  squashed: string[];
}

/**
 * Pesos del ranking. Lo literal manda sobre lo aproximado, y el nombre oficial
 * sobre el sinónimo: quien escribe "caniche" y quien escribe "poodle" llegan a la
 * misma raza, pero entre dos candidatas gana la que lo dice en su nombre.
 */
const BREED_SCORE = {
  word: 100,
  aliasWord: 90,
  wholeSquashed: 80,
  wordPrefix: 70,
  aliasPrefix: 60,
  fuzzy: 50,
  infix: 40,
  /** Cada error de tipeo descuenta: entre dos aproximaciones gana la más cercana. */
  typoPenalty: 10,
  /** Desempate suave: a igualdad de coincidencia, primero las más buscadas. */
  popular: 5,
} as const;

/** Nombre sin espacios ("Pit Bull Terrier" → "pitbullterrier"). */
function squash(value: string): string {
  return fold(value).replace(/ /g, "");
}

/**
 * Los nombres que llevan una alternativa dentro —"Dachshund (Salchicha)",
 * "Mestizo / Sin raza definida"— son DOS nombres, no uno. Se separan para que
 * cada uno compita solo: pegar "dachshund" con "salchicha" no se parece a nada
 * que alguien vaya a escribir.
 */
function nameVariants(nombre: string): string[] {
  return nombre
    .split(/[()/]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildTextDoc(nombre: string, sinonimos: string[] = []): TextDoc {
  const variants = [...nameVariants(nombre), ...sinonimos];
  return {
    words: fold(nombre).split(" ").filter(Boolean),
    aliasWords: sinonimos.flatMap((s) => fold(s).split(" ")).filter(Boolean),
    haystack: [nombre, ...sinonimos].map(fold).join(" "),
    squashed: [...new Set(variants.map(squash))].filter(Boolean),
  };
}

/** El índice se arma una vez por especie: las listas son constantes de módulo. */
const DOC_CACHE = new Map<Species, { breed: Breed; text: TextDoc }[]>();

function docsForSpecies(species: Species) {
  const cached = DOC_CACHE.get(species);
  if (cached) return cached;
  const docs = orderedBreeds(species).map((breed) => ({
    breed,
    text: buildTextDoc(breed.nombre, breed.sinonimos),
  }));
  DOC_CACHE.set(species, docs);
  return docs;
}

/** Mejor puntaje de una palabra de la consulta contra un candidato (0 = no coincide). */
function scoreTerm(doc: TextDoc, term: string): number {
  let best = 0;
  const bump = (points: number) => {
    if (points > best) best = points;
  };

  if (doc.words.includes(term)) bump(BREED_SCORE.word);
  if (doc.aliasWords.includes(term)) bump(BREED_SCORE.aliasWord);
  // El prefijo del nombre vale desde la PRIMERA letra: en una lista de ~90 razas,
  // "b" es un salto a la B, no ruido. El del sinónimo exige 2, porque el sinónimo
  // no se ve: que "c" traiga Pug (por "Carlino") no se entiende desde la pantalla.
  if (doc.words.some((w) => w.startsWith(term))) bump(BREED_SCORE.wordPrefix);
  if (term.length >= 2 && doc.aliasWords.some((w) => w.startsWith(term))) bump(BREED_SCORE.aliasPrefix);
  // Infijo ("tzu" dentro de "shih tzu"): último recurso, desde 3 letras.
  if (term.length >= 3 && doc.haystack.includes(term)) bump(BREED_SCORE.infix);

  // Tipeos: solo si nada literal fue mejor. El sinónimo descuenta un error más
  // que el nombre, para que un apodo aproximado nunca gane a un nombre aproximado.
  const max = typoTolerance(term);
  if (max && best < BREED_SCORE.fuzzy) {
    for (const word of doc.words) {
      const d = editDistance(term, word, max);
      if (d <= max) bump(BREED_SCORE.fuzzy - (d - 1) * BREED_SCORE.typoPenalty);
    }
    for (const word of doc.aliasWords) {
      const d = editDistance(term, word, max);
      if (d <= max) bump(BREED_SCORE.fuzzy - d * BREED_SCORE.typoPenalty);
    }
  }

  return best;
}

/**
 * Puntaje de la consulta COMPLETA pegada, contra el nombre pegado. Rescata las
 * dos formas en que se escribe una raza de varias palabras: junta ("pitbull",
 * "shitzu") o con un error repartido entre ellas ("goldenretriver").
 */
function scoreWhole(doc: TextDoc, folded: string): number {
  const squashedQuery = folded.replace(/ /g, "");
  if (squashedQuery.length < 4) return 0;

  let best = 0;
  const max = typoTolerance(squashedQuery);
  for (const candidate of doc.squashed) {
    if (candidate.includes(squashedQuery)) return BREED_SCORE.wholeSquashed;
    if (!max) continue;
    const d = editDistance(squashedQuery, candidate, max);
    if (d <= max) {
      const points = BREED_SCORE.fuzzy - (d - 1) * BREED_SCORE.typoPenalty;
      if (points > best) best = points;
    }
  }
  return best;
}

/** Consulta ya preparada: palabras, cuáles se exigen y la forma plegada. */
interface BreedQuery {
  terms: string[];
  /** Un conector suelto ("de", "of") suma si coincide, pero nunca se exige. */
  required: boolean[];
  folded: string;
}

function parseBreedQuery(query: string): BreedQuery | null {
  const terms = tokenize(query);
  if (!terms.length) return null;
  // Si TODO lo escrito son conectores, se exigen: mejor buscar "de" literal que
  // declarar la consulta vacía y devolver la lista entera.
  const allStopwords = terms.every(isStopword);
  return { terms, required: terms.map((t) => allStopwords || !isStopword(t)), folded: terms.join(" ") };
}

/** Puntaje y cobertura de un candidato, o `null` si no coincide en nada. */
function scoreDoc(doc: TextDoc, query: BreedQuery): { score: number; coverage: number } | null {
  const whole = scoreWhole(doc, query.folded);
  let score = whole;
  let matched = 0;
  let requiredCount = 0;

  query.terms.forEach((term, i) => {
    const points = scoreTerm(doc, term);
    score += points;
    if (query.required[i]) {
      requiredCount++;
      if (points > 0) matched++;
    }
  });

  if (score === 0) return null;
  // La consulta entera pegada cubre por sí sola: quien escribe "pitbull" cubrió
  // "Pit Bull", aunque ninguna palabra suelta calce con las dos.
  const coverage = whole > 0 || requiredCount === 0 ? 1 : matched / requiredCount;
  return { score, coverage };
}

/**
 * Búsqueda de razas: sin consulta devuelve la lista ordenada (populares arriba).
 * Con consulta, devuelve por relevancia las razas que cubren TODO lo escrito; si
 * ninguna lo hace, cae a las que cubren parte —"pastor aleman negro" tiene que
 * llegar igual a Pastor Alemán— y solo devuelve vacío cuando de verdad no hay
 * nada, que es cuando "mi raza no aparece" es la respuesta correcta.
 */
export function searchBreeds(species: Species, query: string): Breed[] {
  const parsed = parseBreedQuery(query);
  if (!parsed) return orderedBreeds(species);

  const scored: { breed: Breed; score: number; coverage: number }[] = [];
  for (const { breed, text } of docsForSpecies(species)) {
    const result = scoreDoc(text, parsed);
    if (result) {
      scored.push({ breed, coverage: result.coverage, score: result.score + (breed.popular ? BREED_SCORE.popular : 0) });
    }
  }

  const full = scored.filter((r) => r.coverage === 1);
  const pool = full.length ? full : scored;
  return pool
    .sort(
      (a, b) =>
        b.coverage - a.coverage ||
        b.score - a.score ||
        a.breed.nombre.localeCompare(b.breed.nombre, "es"),
    )
    .map((r) => r.breed);
}

/**
 * ¿Este nombre responde a la consulta? Para candidatos que no están en las listas
 * curadas (hoy: Mestizo), con el mismo criterio que el resto del selector.
 */
export function matchesBreedQuery(query: string, nombre: string, sinonimos?: string[]): boolean {
  const parsed = parseBreedQuery(query);
  if (!parsed) return true;
  const scored = scoreDoc(buildTextDoc(nombre, sinonimos), parsed);
  return scored !== null && scored.coverage === 1;
}

/**
 * Busca una raza con rango de peso conocido, por nombre (para estimar peso en F3).
 * Devuelve `undefined` si el nombre no está en el catálogo O si la raza no tiene
 * rango curado → en ambos casos F3 cae a los buckets de tamaño (sin inventar).
 */
export function findBreed(species: Species, nombre?: string): BreedWithWeight | undefined {
  if (!nombre) return undefined;
  const n = normalize(nombre);
  const found = breedsForSpecies(species).find((b) => normalize(b.nombre) === n);
  return found?.pesoRangoAdulto ? (found as BreedWithWeight) : undefined;
}

/* -------------------- Buckets de tamaño (peso · F3) ---------------------- */

export interface SizeBucket {
  id: string;
  label: string;
  /** Rango representativo en kg [min, max]. */
  range: [number, number];
  /** Ejemplo cotidiano ("como un Beagle") para orientar sin báscula. */
  example: string;
}

/** Buckets de tamaño de perro (proxy de peso cuando no hay raza reconocida). */
export const DOG_SIZE_BUCKETS: SizeBucket[] = [
  { id: "toy", label: "Muy pequeño (Toy)", range: [1, 4], example: "como un Chihuahua" },
  { id: "pequeno", label: "Pequeño", range: [4, 10], example: "como un Beagle chico" },
  { id: "mediano", label: "Mediano", range: [10, 25], example: "como un Cocker" },
  { id: "grande", label: "Grande", range: [25, 40], example: "como un Labrador" },
  { id: "gigante", label: "Gigante", range: [40, 70], example: "como un San Bernardo" },
];

/** Buckets de tamaño de gato (la raza aporta menos → rango simple). */
export const CAT_SIZE_BUCKETS: SizeBucket[] = [
  { id: "pequeno", label: "Pequeño", range: [2.5, 3.5], example: "menos de 3,5 kg" },
  { id: "promedio", label: "Promedio", range: [3.5, 5.5], example: "entre 3,5 y 5,5 kg" },
  { id: "grande", label: "Grande", range: [5.5, 8], example: "más de 5,5 kg" },
];

export function sizeBucketsForSpecies(species: Species): SizeBucket[] {
  if (species === "gato") return CAT_SIZE_BUCKETS;
  return DOG_SIZE_BUCKETS; // perro (y fallback)
}

/** Redondea el peso estimado a 1 decimal para mostrarlo limpio. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Punto medio de un rango [min, max], redondeado (valor usable como peso). */
export function midpoint([min, max]: [number, number]): number {
  return round1((min + max) / 2);
}

/** Peso estimado a partir de una raza con rango conocido (punto medio del rango). */
export function estimateWeightFromBreed(breed: BreedWithWeight): number {
  return midpoint(breed.pesoRangoAdulto);
}

/* ---------------------------- Señal de sobrepeso ------------------------- */

/**
 * Margen sobre el máximo típico de la raza a partir del cual se levanta un aviso
 * de posible sobrepeso. 1.15 = 15% sobre el máximo del rango (guía de Carlos: usar
 * los rangos con ±15% antes de marcar bajo/sobrepeso). No es diagnóstico: es una
 * señal para invitar a revisar.
 */
const OVERWEIGHT_MARGIN = 1.15;

/**
 * Razas cuya condición corporal normal se aparta mucho del peso "promedio" para su
 * talla: muy robustas/musculosas (mastines, presas, dogos) o muy esbeltas
 * (lebreles). Para ellas NO auto-marcamos sobrepeso por peso —el peso solo no basta,
 * lo evalúa el veterinario—. Lista provista por Carlos; ampliable.
 */
const OVERWEIGHT_EXEMPT = new Set(
  [
    // Robustas / musculosas
    "Bullmastiff",
    "Mastín Napolitano",
    "Presa Canario",
    "Fila Brasileño",
    "Dogo Argentino",
    // Esbeltas / lebreles
    "Greyhound",
    "Whippet",
    "Vizsla",
  ].map(normalize),
);

export interface OverweightSignal {
  /** Máximo de peso típico de la raza (kg). */
  typicalMax: number;
  /** Cuánto excede el peso al máximo típico, en % (redondeado). */
  excessPct: number;
}

/**
 * Señal de posible sobrepeso a partir de datos YA disponibles (raza + peso). Solo
 * se activa cuando hay un rango curado para la raza, la raza NO está exenta, y el
 * peso supera su máximo típico con margen (`OVERWEIGHT_MARGIN`). Nunca inventa un
 * rango para razas sin dato ni para Mestizo (devuelve `null`), y NO altera el
 * cálculo nutricional: es puramente informativo.
 */
export function overweightSignal(
  species: Species,
  breed: string | undefined,
  weightKg: number | undefined,
): OverweightSignal | null {
  if (weightKg == null || !breed) return null;
  if (OVERWEIGHT_EXEMPT.has(normalize(breed))) return null;
  const b = findBreed(species, breed);
  if (!b) return null;
  const typicalMax = b.pesoRangoAdulto[1];
  if (weightKg <= typicalMax * OVERWEIGHT_MARGIN) return null;
  return { typicalMax, excessPct: Math.round(((weightKg - typicalMax) / typicalMax) * 100) };
}
