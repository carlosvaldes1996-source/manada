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

const nextConfig: NextConfig = {
  // No exponer la versión de Next en las respuestas.
  poweredByHeader: false,
  // `sharp` (normalizador de packshots, `/api/packshot`) es un módulo nativo:
  // debe quedar FUERA del bundle de la función para que Vercel trace y adjunte
  // su binario `.node`. Sin esto la función crashea al importar sharp (500).
  serverExternalPackages: ["sharp"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
