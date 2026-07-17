import Medusa from "@medusajs/js-sdk"

/**
 * Cliente del Admin de Manada (js-sdk de Medusa). Las extensiones del Admin
 * (widgets / UI routes) consumen la API con la SESIÓN del operador ya logueado.
 *
 * `baseUrl: "/"` = mismo origen que sirve el Admin (el propio backend Medusa),
 * válido en dev (`medusa develop`) y en producción (Railway sirve `/app` desde el
 * backend). No se hardcodea host: las llamadas son relativas al origen actual.
 */
export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: { type: "session" },
})
