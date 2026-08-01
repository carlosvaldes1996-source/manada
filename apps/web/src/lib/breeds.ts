import type { Species } from "@/types";

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
  { nombre: "American Staffordshire Terrier", especie: "perro", pesoRangoAdulto: [18, 32] },
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
  { nombre: "Braco Alemán", especie: "perro", pesoRangoAdulto: [20, 32] },
  { nombre: "Braco de Weimar (Weimaraner)", especie: "perro", pesoRangoAdulto: [25, 40] },
  { nombre: "Bull Terrier", especie: "perro", pesoRangoAdulto: [22, 32] },
  { nombre: "Bulldog Americano", especie: "perro", pesoRangoAdulto: [27, 54] },
  { nombre: "Bulldog Francés", especie: "perro", pesoRangoAdulto: [8, 14], popular: true },
  { nombre: "Bulldog Inglés", especie: "perro", pesoRangoAdulto: [18, 25] },
  { nombre: "Bullmastiff", especie: "perro", pesoRangoAdulto: [45, 59] },
  { nombre: "Cairn Terrier", especie: "perro", pesoRangoAdulto: [6, 8] },
  { nombre: "Caniche (Poodle) Toy", especie: "perro", pesoRangoAdulto: [2, 4] },
  { nombre: "Caniche (Poodle) Miniatura", especie: "perro", pesoRangoAdulto: [5, 9] },
  { nombre: "Caniche (Poodle) Estándar", especie: "perro", pesoRangoAdulto: [20, 32] },
  { nombre: "Cavalier King Charles Spaniel", especie: "perro", pesoRangoAdulto: [6, 8] },
  { nombre: "Chihuahua", especie: "perro", pesoRangoAdulto: [1.5, 3], popular: true },
  { nombre: "Chow Chow", especie: "perro", pesoRangoAdulto: [20, 32] },
  { nombre: "Cocker Spaniel Americano", especie: "perro", pesoRangoAdulto: [9, 14] },
  { nombre: "Cocker Spaniel Inglés", especie: "perro", pesoRangoAdulto: [13, 16] },
  { nombre: "Collie", especie: "perro", pesoRangoAdulto: [18, 30] },
  { nombre: "Corgi Galés (Pembroke)", especie: "perro", pesoRangoAdulto: [10, 14] },
  { nombre: "Corgi Galés (Cardigan)", especie: "perro", pesoRangoAdulto: [11, 17] },
  { nombre: "Dachshund (Teckel)", especie: "perro", pesoRangoAdulto: [4, 9] },
  { nombre: "Dálmata", especie: "perro", pesoRangoAdulto: [20, 32] },
  { nombre: "Doberman", especie: "perro", pesoRangoAdulto: [30, 40] },
  { nombre: "Dogo Argentino", especie: "perro", pesoRangoAdulto: [35, 45] },
  { nombre: "Fila Brasileño", especie: "perro", pesoRangoAdulto: [40, 50] },
  { nombre: "Fox Terrier", especie: "perro", pesoRangoAdulto: [6, 9] },
  { nombre: "Galgo", especie: "perro", pesoRangoAdulto: [20, 30] },
  { nombre: "Golden Retriever", especie: "perro", pesoRangoAdulto: [25, 34], popular: true },
  { nombre: "Gran Danés", especie: "perro", pesoRangoAdulto: [50, 80] },
  { nombre: "Greyhound", especie: "perro", pesoRangoAdulto: [27, 40] },
  { nombre: "Husky Siberiano", especie: "perro", pesoRangoAdulto: [16, 27] },
  { nombre: "Jack Russell Terrier", especie: "perro", pesoRangoAdulto: [5, 8] },
  { nombre: "Labrador Retriever", especie: "perro", pesoRangoAdulto: [25, 36], popular: true },
  { nombre: "Lhasa Apso", especie: "perro", pesoRangoAdulto: [5, 8] },
  { nombre: "Mastín Napolitano", especie: "perro", pesoRangoAdulto: [50, 70] },
  { nombre: "Ovejero Alemán (Pastor Alemán)", especie: "perro", pesoRangoAdulto: [22, 40], popular: true },
  { nombre: "Papillón", especie: "perro", pesoRangoAdulto: [2, 5] },
  { nombre: "Pastor Australiano", especie: "perro", pesoRangoAdulto: [18, 30] },
  { nombre: "Pastor Belga Malinois", especie: "perro", pesoRangoAdulto: [20, 30] },
  { nombre: "Pastor de Shetland", especie: "perro", pesoRangoAdulto: [6, 12] },
  { nombre: "Pastor Suizo Blanco", especie: "perro", pesoRangoAdulto: [25, 40] },
  { nombre: "Pekinés", especie: "perro", pesoRangoAdulto: [3, 6] },
  { nombre: "Pinscher Miniatura", especie: "perro", pesoRangoAdulto: [4, 6] },
  { nombre: "Pit Bull Terrier", especie: "perro", pesoRangoAdulto: [16, 30] },
  { nombre: "Pointer Inglés", especie: "perro", pesoRangoAdulto: [20, 34] },
  { nombre: "Pomerania", especie: "perro", pesoRangoAdulto: [1.5, 3.5] },
  { nombre: "Presa Canario", especie: "perro", pesoRangoAdulto: [40, 65] },
  { nombre: "Pug (Carlino)", especie: "perro", pesoRangoAdulto: [6, 9], popular: true },
  { nombre: "Rat Terrier", especie: "perro", pesoRangoAdulto: [4, 11] },
  { nombre: "Rhodesian Ridgeback", especie: "perro", pesoRangoAdulto: [29, 41] },
  { nombre: "Rottweiler", especie: "perro", pesoRangoAdulto: [35, 60] },
  { nombre: "Samoyedo", especie: "perro", pesoRangoAdulto: [16, 30] },
  { nombre: "San Bernardo", especie: "perro", pesoRangoAdulto: [60, 90] },
  { nombre: "Schnauzer Miniatura", especie: "perro", pesoRangoAdulto: [5, 9] },
  { nombre: "Schnauzer Estándar", especie: "perro", pesoRangoAdulto: [14, 20] },
  { nombre: "Schnauzer Gigante", especie: "perro", pesoRangoAdulto: [25, 48] },
  { nombre: "Setter Irlandés", especie: "perro", pesoRangoAdulto: [25, 32] },
  { nombre: "Shar Pei", especie: "perro", pesoRangoAdulto: [18, 29] },
  { nombre: "Shiba Inu", especie: "perro", pesoRangoAdulto: [7, 11] },
  { nombre: "Shih Tzu", especie: "perro", pesoRangoAdulto: [4, 8] },
  { nombre: "Springer Spaniel Inglés", especie: "perro", pesoRangoAdulto: [18, 25] },
  { nombre: "Staffordshire Bull Terrier", especie: "perro", pesoRangoAdulto: [11, 17] },
  { nombre: "Terra Nova (Newfoundland)", especie: "perro", pesoRangoAdulto: [45, 70] },
  { nombre: "Vizsla", especie: "perro", pesoRangoAdulto: [20, 30] },
  { nombre: "West Highland White Terrier", especie: "perro", pesoRangoAdulto: [6, 10] },
  { nombre: "Whippet", especie: "perro", pesoRangoAdulto: [9, 19] },
  { nombre: "Yorkshire Terrier", especie: "perro", pesoRangoAdulto: [2, 3.5], popular: true },
];

/* --------------------------------- Gatos --------------------------------- */

const CAT_BREEDS: Breed[] = [
  { nombre: "Abisinio", especie: "gato", pesoRangoAdulto: [3, 5] },
  { nombre: "American Curl", especie: "gato", pesoRangoAdulto: [3, 5] },
  { nombre: "American Shorthair", especie: "gato", pesoRangoAdulto: [3, 7] },
  { nombre: "Angora Turco", especie: "gato", pesoRangoAdulto: [3, 5], popular: true },
  { nombre: "Bengalí", especie: "gato", pesoRangoAdulto: [4, 7] },
  { nombre: "Birmano (Birman)", especie: "gato", pesoRangoAdulto: [3, 5.5] },
  { nombre: "Bombay", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "British Shorthair", especie: "gato", pesoRangoAdulto: [4, 8], popular: true },
  { nombre: "British Longhair", especie: "gato", pesoRangoAdulto: [4, 8] },
  { nombre: "Burmés", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "Chartreux", especie: "gato", pesoRangoAdulto: [4, 7] },
  { nombre: "Cornish Rex", especie: "gato", pesoRangoAdulto: [2, 4.5] },
  { nombre: "Devon Rex", especie: "gato", pesoRangoAdulto: [2.5, 4.5] },
  { nombre: "Exótico de Pelo Corto", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "Himalayo", especie: "gato", pesoRangoAdulto: [3, 5.5] },
  { nombre: "Maine Coon", especie: "gato", pesoRangoAdulto: [5, 9], popular: true },
  { nombre: "Manx", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "Munchkin", especie: "gato", pesoRangoAdulto: [2, 4] },
  { nombre: "Noruego de Bosque", especie: "gato", pesoRangoAdulto: [4, 7.5] },
  { nombre: "Ocicat", especie: "gato", pesoRangoAdulto: [3, 7] },
  { nombre: "Persa", especie: "gato", pesoRangoAdulto: [3, 5.5], popular: true },
  { nombre: "Ragdoll", especie: "gato", pesoRangoAdulto: [4.5, 9] },
  { nombre: "Ruso Azul", especie: "gato", pesoRangoAdulto: [3, 5.5] },
  { nombre: "Scottish Fold", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "Siamés", especie: "gato", pesoRangoAdulto: [3, 5], popular: true },
  { nombre: "Siberiano", especie: "gato", pesoRangoAdulto: [4, 9] },
  { nombre: "Singapura", especie: "gato", pesoRangoAdulto: [2, 4] },
  { nombre: "Snowshoe", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "Somalí", especie: "gato", pesoRangoAdulto: [3, 6] },
  { nombre: "Sphynx (Sin pelo)", especie: "gato", pesoRangoAdulto: [3, 5] },
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

/** Búsqueda tolerante a acentos; sin query devuelve la lista ordenada. */
export function searchBreeds(species: Species, query: string): Breed[] {
  const q = normalize(query);
  if (!q) return orderedBreeds(species);
  return orderedBreeds(species).filter((b) => normalize(b.nombre).includes(q));
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
