import type { NextRequest } from "next/server";
import { PACKSHOT } from "@/lib/media/packshot";

/**
 * `/api/packshot?src=<url>&w=<px>` — normalizador de packshots (D52).
 *
 * Descarga la imagen del backend Medusa (server-side, sin problema de CORS),
 * la aplana sobre blanco, recorta el borde sobrante y la re-encuadra en un
 * cuadrado con margen uniforme. Sirve un JPEG cacheable por el CDN. Con esto
 * todo producto —fondo blanco o transparente— se ve al mismo tamaño y encuadre
 * sin editar el asset. Ver `@/lib/media/packshot` para el porqué y el loader.
 *
 * Procesa con `jimp` (JS puro, sin binario nativo). Antes usaba `sharp`, pero su
 * binario no cargaba en la función serverless de Vercel (500) → se cambió a jimp,
 * que corre en cualquier runtime. El import es perezoso y todo va dentro de un
 * try/catch: ante cualquier fallo (red, decodificación, imagen de un solo color)
 * redirige a la imagen original — nunca rompe una imagen que hoy carga.
 */

export const runtime = "nodejs";

const WHITE_INT = 0xffffffff; // RGBA blanco opaco (formato de color de jimp)
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
  const { Jimp, JimpMime } = await import("jimp");
  const src = await Jimp.read(input);

  // 1) Aplanar sobre blanco: transparente → blanco; con fondo blanco, no-op.
  //    Deja UN solo color de fondo, así el recorte funciona para ambos tipos.
  const flat = new Jimp({ width: src.width, height: src.height, color: WHITE_INT });
  flat.composite(src, 0, 0);
  // 2) Recortar el borde blanco (autocrop). La tolerancia absorbe el near-white
  //    de compresión JPEG. En imagen de un solo color no recorta (queda blanca).
  flat.autocrop({ tolerance: PACKSHOT.trimTolerance });
  // 3) Escalar el lado mayor al recuadro de contenido (preserva aspecto → no deforma).
  const pad = Math.round(size * PACKSHOT.marginRatio);
  const content = Math.max(1, size - pad * 2);
  flat.scaleToFit({ w: content, h: content });
  // 4) Centrar en un lienzo blanco size×size → margen uniforme para todo producto.
  const canvas = new Jimp({ width: size, height: size, color: WHITE_INT });
  canvas.composite(flat, Math.round((size - flat.width) / 2), Math.round((size - flat.height) / 2));
  return canvas.getBuffer(JimpMime.jpeg, { quality: PACKSHOT.quality });
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
        "Content-Type": "image/jpeg",
        // Nombres de archivo de Medusa son inmutables (hash/ID) → cache larga.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    // Red/decodificación: degradar a la imagen original para no romper la card.
    return Response.redirect(source.toString(), 302);
  }
}
