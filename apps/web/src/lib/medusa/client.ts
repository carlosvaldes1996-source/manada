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
 * así que este mismo cliente sirve a los server components (catálogo) y a los
 * providers de carrito/sesión.
 *
 * **Auth (Fase 5 · Etapa A):** `type: "jwt"` → el token del cliente se envía como
 * `Authorization: Bearer` y el SDK lo persiste solo (localStorage) en el navegador,
 * por lo que la **sesión sobrevive recargas**. En el servidor no hay localStorage:
 * el SDK cae a `nostore` (sin token) automáticamente, así que el catálogo
 * `force-dynamic` se sigue leyendo con la publishable key, sin romper el SSR. No se
 * fija `jwtTokenStorageMethod` a propósito (fijarlo a "local" haría throw en server).
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
  auth: { type: "jwt" },
  debug: process.env.NODE_ENV === "development",
});
