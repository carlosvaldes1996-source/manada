import { ImageResponse } from "next/og";

/**
 * Favicon de marca en alta resolución (SEO/reputación, auditoría D48). Al vivir en
 * `app/`, Next lo auto-enlaza como `<link rel="icon">` y lo usa Google en los
 * resultados de búsqueda. Complementa el `favicon.ico` clásico con un PNG nítido
 * (letramarca "M" sobre Terracota) y da a `Organization.logo` (JSON-LD) una imagen
 * cuadrada crawleable. Generado con `next/og`, sin assets externos.
 */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

const ARENA = "#faf6f0";
const TERRACOTA = "#a54e31";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: TERRACOTA,
          color: ARENA,
          fontSize: "340px",
          fontWeight: 700,
          fontFamily: "serif",
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
