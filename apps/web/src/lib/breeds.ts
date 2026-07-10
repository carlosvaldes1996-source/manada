import type { Species } from "@/types";

/**
 * Razas curadas para el onboarding (funnel F2/F3) — MVP local.
 *
 * Lista acotada de razas comunes en Chile por especie, cada una con su tamaño y
 * el rango de peso adulto típico. Alimenta dos cosas del onboarding:
 *  - F2: el buscador de raza (`BreedCombobox`), con Mestizo/Quiltro fijado.
 *  - F3: la estimación de peso ("los {raza} pesan ~X–Y kg"), sin obligar a un valor.
 *
 * No es taxonomía completa ni fuente de verdad: es una tabla curada para reducir
 * fricción. La versión definitiva (catálogo completo, origen backend) es posterior
 * y está listada en FUNNEL_TARGET.md · "Notas de integración".
 */

export type BreedSize = "toy" | "pequeno" | "mediano" | "grande" | "gigante";

export interface Breed {
  nombre: string;
  especie: "perro" | "gato";
  tamano: BreedSize;
  /** Rango de peso adulto típico en kg [min, max]. */
  pesoRangoAdulto: [number, number];
  /** Fijada arriba en el selector (las más buscadas en Chile). */
  popular?: boolean;
}

/* --------------------------------- Perros -------------------------------- */

const DOG_BREEDS: Breed[] = [
  { nombre: "Labrador Retriever", especie: "perro", tamano: "grande", pesoRangoAdulto: [25, 36], popular: true },
  { nombre: "Golden Retriever", especie: "perro", tamano: "grande", pesoRangoAdulto: [25, 34], popular: true },
  { nombre: "Poodle / Caniche", especie: "perro", tamano: "pequeno", pesoRangoAdulto: [5, 10], popular: true },
  { nombre: "Bulldog Francés", especie: "perro", tamano: "pequeno", pesoRangoAdulto: [8, 14], popular: true },
  { nombre: "Chihuahua", especie: "perro", tamano: "toy", pesoRangoAdulto: [1.5, 3], popular: true },
  { nombre: "Pastor Alemán", especie: "perro", tamano: "grande", pesoRangoAdulto: [22, 40], popular: true },
  { nombre: "Beagle", especie: "perro", tamano: "mediano", pesoRangoAdulto: [9, 13], popular: true },
  { nombre: "Cocker Spaniel", especie: "perro", tamano: "mediano", pesoRangoAdulto: [10, 15], popular: true },
  { nombre: "Schnauzer Miniatura", especie: "perro", tamano: "pequeno", pesoRangoAdulto: [5, 9], popular: true },
  { nombre: "Yorkshire Terrier", especie: "perro", tamano: "toy", pesoRangoAdulto: [2, 3.5], popular: true },
  { nombre: "Pug / Carlino", especie: "perro", tamano: "pequeno", pesoRangoAdulto: [6, 9], popular: true },
  { nombre: "Rottweiler", especie: "perro", tamano: "grande", pesoRangoAdulto: [35, 60] },
  { nombre: "Bóxer", especie: "perro", tamano: "grande", pesoRangoAdulto: [25, 32] },
  { nombre: "Bulldog Inglés", especie: "perro", tamano: "mediano", pesoRangoAdulto: [18, 25] },
  { nombre: "Dálmata", especie: "perro", tamano: "grande", pesoRangoAdulto: [20, 32] },
  { nombre: "Dóberman", especie: "perro", tamano: "grande", pesoRangoAdulto: [30, 40] },
  { nombre: "Husky Siberiano", especie: "perro", tamano: "grande", pesoRangoAdulto: [16, 27] },
  { nombre: "Shih Tzu", especie: "perro", tamano: "pequeno", pesoRangoAdulto: [4, 8] },
  { nombre: "Maltés", especie: "perro", tamano: "toy", pesoRangoAdulto: [3, 4] },
  { nombre: "Pomerania", especie: "perro", tamano: "toy", pesoRangoAdulto: [1.5, 3.5] },
  { nombre: "Border Collie", especie: "perro", tamano: "mediano", pesoRangoAdulto: [14, 20] },
  { nombre: "Schnauzer Estándar", especie: "perro", tamano: "mediano", pesoRangoAdulto: [14, 20] },
  { nombre: "San Bernardo", especie: "perro", tamano: "gigante", pesoRangoAdulto: [60, 90] },
  { nombre: "Gran Danés", especie: "perro", tamano: "gigante", pesoRangoAdulto: [50, 80] },
  { nombre: "Basset Hound", especie: "perro", tamano: "mediano", pesoRangoAdulto: [20, 29] },
  { nombre: "Dachshund / Salchicha", especie: "perro", tamano: "pequeno", pesoRangoAdulto: [4, 9] },
  { nombre: "Jack Russell Terrier", especie: "perro", tamano: "pequeno", pesoRangoAdulto: [5, 8] },
  { nombre: "Fox Terrier", especie: "perro", tamano: "pequeno", pesoRangoAdulto: [6, 9] },
  { nombre: "Bull Terrier", especie: "perro", tamano: "mediano", pesoRangoAdulto: [22, 32] },
  { nombre: "Pitbull", especie: "perro", tamano: "mediano", pesoRangoAdulto: [16, 30] },
  { nombre: "American Bully", especie: "perro", tamano: "mediano", pesoRangoAdulto: [20, 30] },
  { nombre: "Staffordshire Bull Terrier", especie: "perro", tamano: "mediano", pesoRangoAdulto: [11, 17] },
  { nombre: "Weimaraner", especie: "perro", tamano: "grande", pesoRangoAdulto: [25, 40] },
  { nombre: "Setter Irlandés", especie: "perro", tamano: "grande", pesoRangoAdulto: [25, 32] },
  { nombre: "Pointer", especie: "perro", tamano: "grande", pesoRangoAdulto: [20, 34] },
  { nombre: "Collie", especie: "perro", tamano: "grande", pesoRangoAdulto: [18, 30] },
  { nombre: "Samoyedo", especie: "perro", tamano: "grande", pesoRangoAdulto: [16, 30] },
  { nombre: "Akita", especie: "perro", tamano: "grande", pesoRangoAdulto: [32, 50] },
  { nombre: "Chow Chow", especie: "perro", tamano: "mediano", pesoRangoAdulto: [20, 32] },
  { nombre: "Shar Pei", especie: "perro", tamano: "mediano", pesoRangoAdulto: [18, 29] },
  { nombre: "Bichón Frisé", especie: "perro", tamano: "toy", pesoRangoAdulto: [3, 5] },
  { nombre: "Pekinés", especie: "perro", tamano: "pequeno", pesoRangoAdulto: [3, 6] },
  { nombre: "Galgo", especie: "perro", tamano: "grande", pesoRangoAdulto: [20, 30] },
  { nombre: "Braco Alemán", especie: "perro", tamano: "grande", pesoRangoAdulto: [20, 32] },
  { nombre: "Terranova", especie: "perro", tamano: "gigante", pesoRangoAdulto: [45, 70] },
  { nombre: "Mastín", especie: "perro", tamano: "gigante", pesoRangoAdulto: [50, 90] },
];

/* --------------------------------- Gatos --------------------------------- */

const CAT_BREEDS: Breed[] = [
  { nombre: "Siamés", especie: "gato", tamano: "mediano", pesoRangoAdulto: [3, 5], popular: true },
  { nombre: "Persa", especie: "gato", tamano: "mediano", pesoRangoAdulto: [3, 5.5], popular: true },
  { nombre: "Maine Coon", especie: "gato", tamano: "grande", pesoRangoAdulto: [5, 9], popular: true },
  { nombre: "Angora", especie: "gato", tamano: "mediano", pesoRangoAdulto: [3, 5], popular: true },
  { nombre: "British Shorthair", especie: "gato", tamano: "mediano", pesoRangoAdulto: [4, 8], popular: true },
  { nombre: "Bengalí", especie: "gato", tamano: "mediano", pesoRangoAdulto: [4, 7] },
  { nombre: "Ragdoll", especie: "gato", tamano: "grande", pesoRangoAdulto: [4.5, 9] },
  { nombre: "Sphynx", especie: "gato", tamano: "mediano", pesoRangoAdulto: [3, 5] },
  { nombre: "Scottish Fold", especie: "gato", tamano: "mediano", pesoRangoAdulto: [3, 6] },
  { nombre: "Azul Ruso", especie: "gato", tamano: "mediano", pesoRangoAdulto: [3, 5.5] },
  { nombre: "Abisinio", especie: "gato", tamano: "mediano", pesoRangoAdulto: [3, 5] },
  { nombre: "Bosque de Noruega", especie: "gato", tamano: "grande", pesoRangoAdulto: [4, 7.5] },
  { nombre: "Exótico de Pelo Corto", especie: "gato", tamano: "mediano", pesoRangoAdulto: [3, 6] },
  { nombre: "Oriental", especie: "gato", tamano: "mediano", pesoRangoAdulto: [3, 5] },
  { nombre: "Himalayo", especie: "gato", tamano: "mediano", pesoRangoAdulto: [3, 5.5] },
  { nombre: "Birmano", especie: "gato", tamano: "mediano", pesoRangoAdulto: [3, 5.5] },
  { nombre: "Devon Rex", especie: "gato", tamano: "pequeno", pesoRangoAdulto: [2.5, 4.5] },
];

/* -------------------------- Mestizo / Quiltro ---------------------------- */

/**
 * Etiqueta de "sin raza definida", fijada arriba del selector. No está en las
 * listas anteriores porque no tiene un rango de peso único → dispara los buckets
 * de tamaño en el paso de peso (F3).
 */
export function mestizoLabel(species: Species): string {
  return species === "gato" ? "Mestizo / Doméstico" : "Mestizo / Quiltro";
}

export function isMestizo(species: Species, nombre: string): boolean {
  return normalize(nombre) === normalize(mestizoLabel(species));
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

/** Busca una raza reconocida por nombre (para estimar peso en F3). */
export function findBreed(species: Species, nombre?: string): Breed | undefined {
  if (!nombre) return undefined;
  const n = normalize(nombre);
  return breedsForSpecies(species).find((b) => normalize(b.nombre) === n);
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

/** Peso estimado a partir de una raza reconocida (punto medio del rango adulto). */
export function estimateWeightFromBreed(breed: Breed): number {
  return midpoint(breed.pesoRangoAdulto);
}
