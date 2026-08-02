import type { NextConfig } from "next";

/**
 * Cabeceras HTTP de seguridad básicas (endurecimiento de lanzamiento). NO incluyen
 * una CSP (se deja para después, requiere afinado por dominio para no romper). Son
 * conservadoras y no afectan el funcionamiento: evitan MIME-sniffing, framing de
 * terceros (clickjacking) y fuerzan HTTPS.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Host del backend Medusa (para `remotePatterns`): las fotos de producto se sirven
// desde ahí y el endpoint `/api/packshot` puede redirigir a la original si la
// normalización falla → el optimizer debe poder seguir ese redirect y optimizarla.
const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const backend = (() => {
  try {
    const { protocol, hostname } = new URL(backendUrl);
    return { protocol: protocol.replace(":", "") as "http" | "https", hostname };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // No exponer la versión de Next en las respuestas.
  poweredByHeader: false,
  images: {
    // Formatos modernos: el optimizer negocia AVIF (o WebP) por `Accept` del
    // navegador y cachea la variante. ~30–50% menos bytes que el JPEG base.
    formats: ["image/avif", "image/webp"],
    // Solo se optimiza el packshot como imagen LOCAL (Next 16 exige whitelistear
    // locales con query string). `search` omitido = cualquier `?src=&w=`; el SSRF
    // lo corta la propia ruta (`resolveSource`), no hace falta acotarlo aquí.
    localPatterns: [{ pathname: "/api/packshot" }],
    // Fotos remotas del backend (fallback del packshot + media futura del Admin).
    remotePatterns: backend ? [{ protocol: backend.protocol, hostname: backend.hostname }] : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
