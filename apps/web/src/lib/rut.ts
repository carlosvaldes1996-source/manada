/**
 * RUT chileno: validación (dígito verificador módulo 11) y formateo. Sin
 * dependencias — se usa en el checkout para validar y persistir el RUT del
 * comprador (necesario para la boleta). El RUT nunca cambia para una persona,
 * por eso conviene guardarlo en el cliente para prellenar futuras compras.
 */

/** Deja solo dígitos y K (sin puntos ni guion), con la K en mayúscula. */
export function cleanRut(value: string): string {
  return value.replace(/[^0-9kK]/g, "").toUpperCase();
}

/** Dígito verificador esperado para un cuerpo numérico (módulo 11). */
function computeDv(body: string): string {
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const rest = 11 - (sum % 11);
  if (rest === 11) return "0";
  if (rest === 10) return "K";
  return String(rest);
}

/** Valida un RUT chileno (cuerpo numérico + dígito verificador módulo 11). */
export function isValidRut(value: string): boolean {
  const clean = cleanRut(value);
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  return computeDv(body) === dv;
}

/** "123456789" → "12.345.678-9" (formato de visualización, al perder el foco). */
export function formatRut(value: string): string {
  const clean = cleanRut(value);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots}-${dv}`;
}
