/**
 * Normalización de texto del buscador — **primitivas puras**, sin dependencias.
 *
 * Todo el buscador compara texto en "forma plegada": minúsculas, sin tildes, sin
 * apóstrofes ni puntuación. Así "Salmón", "salmon" y "SALMON" son la misma cosa,
 * y "Hill's" se encuentra escribiendo "hills". La ñ se pliega a n a propósito
 * (nadie escribe "baños" en un buscador): es la convención de cualquier tienda.
 *
 * Un solo lugar pliega texto (aquí) para que el índice y la consulta se
 * normalicen EXACTAMENTE igual — si divergen, la búsqueda falla en silencio.
 */

/** Conectores que no aportan intención. Nunca se exigen para dar un resultado. */
const STOPWORDS = new Set([
  "a", "al", "con", "de", "del", "e", "el", "en", "la", "las", "lo", "los", "o",
  "para", "por", "sin", "un", "una", "unos", "unas", "y",
  // inglés: aparecen en nombres de marca ("Taste of the Wild")
  "and", "for", "of", "the", "with",
]);

export function isStopword(term: string): boolean {
  return STOPWORDS.has(term);
}

/**
 * Divide en tokens comparables. Conserva el punto DENTRO de un número para no
 * romper los formatos del catálogo ("11.4 kg" → ["11.4", "kg"]).
 */
export function tokenize(value: string): string[] {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes/diacríticos
    .toLowerCase()
    .replace(/['´`’]/g, "") // hill's → hills
    .replace(/[^a-z0-9.]+/g, " ")
    .split(" ")
    .map((token) => token.replace(/^\.+|\.+$/g, ""))
    .filter(Boolean);
}

/** Texto plegado y canonizado ("Acana — Puppy Recipe" → "acana puppy recipe"). */
export function fold(value: string): string {
  return tokenize(value).join(" ");
}

/**
 * Distancia de edición **Damerau-Levenshtein** (variante OSA) con corte
 * temprano: en cuanto la fila mínima supera `max` devuelve `max + 1` sin
 * terminar el cálculo.
 *
 * Cuenta la transposición como UN error, y eso no es un detalle: bailar dos
 * letras es el tipeo más común que existe. Con Levenshtein puro, "orijne" está
 * a distancia 2 de "orijen" y no se corrige; con transposición, a 1 y sí.
 */
export function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (!a.length || !b.length) return Math.max(a.length, b.length);

  let twoBack: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const current = new Array<number>(b.length + 1);
    current[0] = i;
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, twoBack[j - 2] + 1); // transposición
      }
      current[j] = value;
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return max + 1;
    twoBack = previous;
    previous = current;
  }

  return previous[b.length];
}

/**
 * Cuántos errores se toleran según el largo de la palabra. Palabras cortas no
 * toleran nada (con 3 letras, 1 error convierte "pez" en "paz" y el buscador
 * empieza a inventar); de 4 a 6 letras, un error; más largas, dos.
 */
export function typoTolerance(term: string): number {
  if (term.length <= 3) return 0;
  if (term.length <= 6) return 1;
  return 2;
}
