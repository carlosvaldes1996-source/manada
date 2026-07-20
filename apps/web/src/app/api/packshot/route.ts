import type { NextRequest } from "next/server";
import { PACKSHOT } from "@/lib/media/packshot";

// `sharp` se importa PEREZOSAMENTE dentro del handler (no en el top-level): si
// su binario nativo no carga en el runtime, la falla queda dentro del try/catch
// y degradamos a la imagen original en vez de tumbar la función con un 500.

/**
 * `/api/packshot?src=<url>&w=<px>` — normalizador de packshots (D…).
 *
 * Descarga la imagen del backend Medusa (server-side, sin problema de CORS),
 * la aplana sobre blanco, recorta el borde sobrante y la re-encuadra en un
 * cuadrado con margen uniforme. Sirve un WebP cacheable por el CDN. Con esto
 * todo producto —fondo blanco o transparente— se ve al mismo tamaño y encuadre
 * sin editar el asset. Ver `@/lib/media/packshot` para el porqué y el loader.
 *
 * Degradación: ante cualquier fallo (red, decodificación, imagen de un solo
 * color) redirige a la imagen original — nunca rompe una imagen que hoy carga.
 */

export const runtime = "nodejs";

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 } as const;
const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";

function backendOrigin(): string | null {
  try {
    return new URL(BACKEND).origin;
  } catch {
    return null;
  }
}

/**
 * Solo normalizamos imágenes del backend Medusa (o localhost en dev): así este
 * endpoint no puede usarse como proxy abierto (SSRF). Devuelve la URL absoluta
 * permitida o `null`.
 */
function resolveSource(raw: string): URL | null {
  let url: URL;
  try {
    url = raw.startsWith("/") ? new URL(raw, BACKEND) : new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const isBackend = url.origin === backendOrigin();
  const isLocal = /^(localhost|127\.0\.0\.1)$/.test(url.hostname);
  return isBackend || isLocal ? url : null;
}

function clampWidth(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return PACKSHOT.defaultWidth;
  return Math.min(Math.max(n, PACKSHOT.minWidth), PACKSHOT.maxWidth);
}

async function normalize(input: Buffer, size: number): Promise<Buffer> {
  const { default: sharp } = await import("sharp");
  const pad = Math.round(size * PACKSHOT.marginRatio);
  const content = Math.max(1, size - pad * 2);

  /** Recorta (opcional) y re-encuadra el buffer ya aplanado a un cuadrado `size`. */
  const frame = (flat: Buffer, trim: boolean): Promise<Buffer> => {
    let pipeline = sharp(flat, { failOn: "none" });
    if (trim) pipeline = pipeline.trim({ background: WHITE, threshold: PACKSHOT.trimThreshold });
    return pipeline
      .resize(content, content, { fit: "contain", background: WHITE })
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: WHITE })
      .flatten({ background: WHITE })
      .webp({ quality: PACKSHOT.quality })
      .toBuffer();
  };

  // 1) Aplanar sobre blanco: transparentes → blanco; con fondo blanco es no-op.
  //    Deja UN solo color de fondo, así el recorte funciona para ambos tipos.
  const flat = await sharp(input, { failOn: "none" }).flatten({ background: WHITE }).toBuffer();
  // 2) Recortar el borde blanco y re-encuadrar. `trim()` lanza si la imagen es
  //    de un solo color → en ese caso re-encuadramos sin recortar.
  try {
    return await frame(flat, true);
  } catch {
    return await frame(flat, false);
  }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("src");
  if (!raw) return new Response("missing src", { status: 400 });
  const width = clampWidth(req.nextUrl.searchParams.get("w"));

  const source = resolveSource(raw);
  if (!source) {
    // Fuera de la whitelist: no hacemos de proxy. Si es absoluta, que el
    // navegador la cargue directo (no rompemos imágenes externas).
    return /^https?:\/\//.test(raw)
      ? Response.redirect(raw, 302)
      : new Response("forbidden source", { status: 400 });
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const upstream = await fetch(source, { signal: ctrl.signal, cache: "no-store" }).finally(() =>
      clearTimeout(timer),
    );
    if (!upstream.ok) return Response.redirect(source.toString(), 302);

    const input = Buffer.from(await upstream.arrayBuffer());
    const output = await normalize(input, width);
    return new Response(new Uint8Array(output), {
      headers: {
        "Content-Type": "image/webp",
        // Nombres de archivo de Medusa son inmutables (hash/ID) → cache larga.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    // Red/decodificación: degradar a la imagen original para no romper la card.
    return Response.redirect(source.toString(), 302);
  }
}
