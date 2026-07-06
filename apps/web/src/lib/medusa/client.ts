import Medusa from "@medusajs/js-sdk";

/**
 * Cliente único del SDK de Medusa (Fase 5 · Etapa 1).
 *
 * Fuente de verdad del catálogo/carrito/orden = backend Medusa (`apps/backend`),
 * consumido SOLO por HTTP vía la Store API (regla arquitectónica ARCHITECTURE.md §2).
 * `apps/web` no contiene lógica de negocio ni acceso a la base de datos.
 *
 * La publishable key es de storefront (identifica el sales channel "Manada Web");
 * es segura en el bundle del cliente. El SDK funciona en servidor y navegador,
 * así que este mismo cliente sirve a los server components (catálogo) y, más
 * adelante, a los providers de carrito/sesión.
 */

export const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";

const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

if (!publishableKey && process.env.NODE_ENV !== "production") {
  console.warn(
    "[medusa] Falta NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY. La Store API rechazará las " +
      "peticiones. Copia apps/web/.env.example a .env.local (ver apps/backend/DEV.md).",
  );
}

export const medusa = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  publishableKey,
  debug: process.env.NODE_ENV === "development",
});
