import { ImageResponse } from "next/og";

/**
 * Apple touch icon (SEO/reputación, auditoría D48). Es el ícono que iOS/iPadOS
 * usan al añadir el sitio a la pantalla de inicio y en varios previews; su
 * ausencia deja a Apple recortando un screenshot borroso. Fondo sólido (iOS le
 * aplica esquinas redondeadas). Auto-enlazado por Next al vivir en `app/`.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const ARENA = "#faf6f0";
const TERRACOTA = "#a54e31";

export default function AppleIcon() {
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
          fontSize: "120px",
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
