// Recorta los composites de fotos (grid de íconos y banners apilados) en tiles
// individuales que consume el front. Usa sharp (resuelto desde el store de pnpm,
// porque no está linkeado al top-level de node_modules).
//
// Uso (desde la raíz del repo):  node apps/web/scripts/split-fotos.mjs
//
// Entra:  public/fotos/_raw/banners.(png|jpg)  ·  public/fotos/_raw/iconos.(png|jpg)
// Sale:   public/fotos/cat-*.jpg  ·  public/fotos/icono-*.jpg

import { createRequire } from "node:module";
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

// Resolver sharp desde el virtual store de pnpm.
const sharpDir = readdirSync(path.join(repoRoot, "node_modules/.pnpm"))
  .filter((d) => d.startsWith("sharp@"))
  .map((d) => path.join(repoRoot, "node_modules/.pnpm", d, "node_modules/sharp"))
  .find(existsSync);
if (!sharpDir) throw new Error("No encontré sharp en node_modules/.pnpm");
const sharp = require(sharpDir);

const FOTOS = path.join(repoRoot, "apps/web/public/fotos");
const RAW = path.join(FOTOS, "_raw");

/** Encuentra un archivo raw por nombre base, aceptando .png/.jpg/.jpeg/.webp. */
function findRaw(base) {
  for (const ext of [".png", ".jpg", ".jpeg", ".webp"]) {
    const p = path.join(RAW, base + ext);
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * Corta `input` en una grilla rows×cols (orden por filas) y guarda cada celda
 * con el nombre de `names`. `inset` (0-1) recorta un margen de cada celda para
 * eliminar las líneas blancas (gutters) entre tiles del composite.
 */
async function tileGrid(input, rows, cols, names, inset = 0.014) {
  const img = sharp(input);
  const { width: W, height: H } = await img.metadata();
  const cw = W / cols;
  const ch = H / rows;
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const name = names[i++];
      if (!name) continue;
      const ix = Math.round(cw * inset);
      const iy = Math.round(ch * inset);
      const left = Math.round(c * cw) + ix;
      const top = Math.round(r * ch) + iy;
      const width = Math.round(cw) - ix * 2;
      const height = Math.round(ch) - iy * 2;
      const out = path.join(FOTOS, name);
      await sharp(input)
        .extract({ left, top, width, height })
        .jpeg({ quality: 82 })
        .toFile(out);
      console.log(`  ✓ ${name}  (${width}×${height})`);
    }
  }
}

const banners = findRaw("banners");
const iconos = findRaw("iconos");

if (banners) {
  console.log("Banners (5 filas):");
  await tileGrid(banners, 5, 1, [
    "cat-perro.jpg",
    "cat-gato.jpg",
    "cat-farmacia.jpg",
    "cat-accesorios.jpg",
    "cat-higiene.jpg",
  ]);
} else {
  console.log("· No hay _raw/banners.(png|jpg) — omito banners.");
}

if (iconos) {
  console.log("Íconos (grid 2×2):");
  await tileGrid(iconos, 2, 2, [
    "icono-alimento.jpg", // arriba-izq
    "icono-accesorios.jpg", // arriba-der
    "icono-farmacia.jpg", // abajo-izq
    "icono-higiene.jpg", // abajo-der
  ]);
} else {
  console.log("· No hay _raw/iconos.(png|jpg) — omito íconos.");
}

console.log("Listo.");
