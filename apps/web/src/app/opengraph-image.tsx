import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";

/**
 * Imagen Open Graph por defecto (SEO técnico, D46). Al vivir en `app/`, Next la
 * aplica a TODO el sitio como imagen de compartir (OG + Twitter) salvo que una
 * ruta declare la suya. Se genera con `next/og` (sin assets externos), así que
 * compartir cualquier enlace de Manada muestra una tarjeta de marca correcta.
 */
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Paleta de marca (DESIGN_SYSTEM): Arena, Terracota, Carbón, Miel.
const ARENA = "#faf6f0";
const TERRACOTA = "#a54e31";
const CARBON = "#2a2722";
const NEUTRAL = "#5a5249";
const MIEL = "#a0681f";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: ARENA,
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              backgroundColor: TERRACOTA,
              color: ARENA,
              fontSize: "44px",
            }}
          >
            🐾
          </div>
          <div style={{ fontSize: "44px", fontWeight: 700, color: TERRACOTA }}>
            {SITE.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: "72px",
              lineHeight: 1.1,
              fontWeight: 700,
              color: CARBON,
              maxWidth: "900px",
            }}
          >
            {SITE.tagline}
          </div>
          <div style={{ fontSize: "30px", color: NEUTRAL, maxWidth: "820px" }}>
            {`${SITE.messages.knowledge} y ${SITE.messages.anticipation.toLowerCase()}.`}
          </div>
        </div>

        <div style={{ fontSize: "28px", fontWeight: 600, color: MIEL }}>
          {SITE.domain}
        </div>
      </div>
    ),
    { ...size },
  );
}
