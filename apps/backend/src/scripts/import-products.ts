import fs from "fs";
import path from "path";
import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import {
  DEFAULT_STOCKED_QUANTITY,
  FORMAT_OPTION_TITLE,
} from "../api/admin/products/[id]/formats/add-format";

/**
 * Carga masiva de catálogo desde un CSV (herramienta de operación, no de runtime).
 *
 * Corre con `medusa exec` (el mismo mecanismo con el que se sembró producción), así
 * reutiliza el contenedor real: sales channel, bodega, categorías y perfil de envío
 * salen del backend, no se hardcodean. Reemplaza el alta manual producto-por-producto
 * en el Admin (lo que tomaba mucho tiempo) por una operación repetible y versionada.
 *
 * Modelo de datos del CSV: **una fila = una variante (formato)**. Las filas que
 * comparten `Handle` se agrupan en UN producto con varias variantes (opción única
 * "Formato"), exactamente como el catálogo multi-formato del storefront (D48/D51).
 *
 * Columnas esperadas (nombres case-insensitive; el orden no importa):
 *   Title                 → título del producto (product.title)
 *   Handle                → slug base; se limpia a URL-safe (quita &, comas, espacios)
 *   formato               → título de la variante (p. ej. "18.3 KG"); deriva el peso
 *   precio_pvp_sugerido   → precio en CLP (entero, sin decimales)
 *   species               → "perro" | "gato" | "otro" (coma-separado) → metadata
 *   stage                 → "cachorro" | "adulto" | "senior" (coma-separado) → metadata
 *   brand                 → marca visible → metadata
 *   subscribable          → TRUE/FALSE → metadata
 *   SKU                   → SKU de la variante (único global en Medusa)
 *   Categories            → nombre de categoría de Medusa (p. ej. "Alimento")
 *
 * Columnas OPCIONALES que el script respeta si existen (para lotes futuros):
 *   description, kcal_per_kg, rating, review_count,
 *   suitable_conditions, not_for, subscription_discount_percentage
 *   (convención de metadata documentada en el seed y en ai-context/DATABASE.md).
 *
 * Idempotente: salta cualquier `Handle` que ya exista en el backend → re-ejecutar
 * es seguro (no duplica) y respeta los productos cargados a mano.
 *
 * Flags (variables de entorno):
 *   IMPORT_CSV=<ruta>     archivo a importar (default: src/scripts/data/productos.csv)
 *   IMPORT_DRY_RUN=1      solo imprime el plan; NO escribe nada (recomendado 1ª pasada)
 *   IMPORT_STATUS=draft   crea en borrador en vez de publicado (default: published)
 *
 * Uso:
 *   IMPORT_DRY_RUN=1 pnpm --filter @manada/backend exec medusa exec ./src/scripts/import-products.ts
 *   pnpm --filter @manada/backend exec medusa exec ./src/scripts/import-products.ts
 */

/* --------------------------------- CSV ------------------------------------- */

/** Parser CSV mínimo compatible con RFC 4180 (comillas dobles, comas y saltos escapados). */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  // Última fila si el archivo no termina en salto de línea.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const header = (rows.shift() ?? []).map((h) => h.trim());
  return rows
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      header.forEach((h, idx) => {
        obj[h] = (r[idx] ?? "").trim();
      });
      return obj;
    });
}

/** Lee una columna por nombre, tolerante a mayúsculas/minúsculas y espacios. */
function col(row: Record<string, string>, name: string): string {
  const key = Object.keys(row).find(
    (k) => k.trim().toLowerCase() === name.toLowerCase(),
  );
  return key ? row[key].trim() : "";
}

/* ------------------------------ utilidades --------------------------------- */

/** Idéntico al slugify del storefront (apps/web/src/lib/medusa/map-product.ts). */
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Peso real de la variante en gramos, para el registro de envío de Medusa.
 * "18 KG" → 18000 · "465 grs" → 465. NO afecta la etiqueta visible (esa es el
 * título de la variante); solo alimenta `variant.weight`. El storefront calcula
 * $/kg y ración desde el TÍTULO del formato, no desde este campo.
 */
function parseWeightGrams(formato: string): number | undefined {
  const kg = formato.match(/([\d.,]+)\s*kg/i);
  if (kg) {
    const v = parseFloat(kg[1].replace(",", "."));
    return Number.isFinite(v) ? Math.round(v * 1000) : undefined;
  }
  const g = formato.match(/([\d.,]+)\s*(?:grs?|gramos?|g)\b/i);
  if (g) {
    const v = parseFloat(g[1].replace(",", "."));
    return Number.isFinite(v) ? Math.round(v) : undefined;
  }
  return undefined;
}

function parsePriceClp(raw: string): number {
  const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : NaN;
}

function parseBool(raw: string): boolean {
  return /^(true|1|si|sí|yes)$/i.test(raw.trim());
}

function parseNumber(raw: string): number | undefined {
  if (!raw) return undefined;
  const n = parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

/* ------------------------------- tipos ------------------------------------- */

type VariantPlan = {
  format: string;
  sku: string;
  price: number;
  weight?: number;
};

type ProductPlan = {
  handle: string;
  title: string;
  brand: string;
  species: string;
  stage: string;
  category: string;
  subscribable: boolean;
  description?: string;
  kcalPerKg?: number;
  rating?: number;
  reviewCount?: number;
  suitableConditions?: string;
  notFor?: string;
  subscriptionDiscount?: number;
  variants: VariantPlan[];
};

/* ------------------------------- main -------------------------------------- */

export default async function importProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  const dryRun = !!process.env.IMPORT_DRY_RUN;
  const status =
    (process.env.IMPORT_STATUS || "").toLowerCase() === "draft"
      ? ProductStatus.DRAFT
      : ProductStatus.PUBLISHED;

  // 1) Localizar y leer el CSV.
  const candidates = [
    process.env.IMPORT_CSV,
    path.resolve(__dirname, "data", "productos.csv"),
    path.resolve(process.cwd(), "src/scripts/data/productos.csv"),
    path.resolve(process.cwd(), "apps/backend/src/scripts/data/productos.csv"),
  ].filter(Boolean) as string[];
  const csvPath = candidates.find((p) => fs.existsSync(p));
  if (!csvPath) {
    throw new Error(
      `No se encontró el CSV. Buscado en:\n  ${candidates.join("\n  ")}\n` +
        `Setea IMPORT_CSV=<ruta> o deja el archivo en src/scripts/data/productos.csv.`,
    );
  }
  logger.info(`[import] Leyendo ${csvPath}${dryRun ? " (DRY RUN)" : ""}`);
  const rows = parseCsv(fs.readFileSync(csvPath, "utf-8"));
  if (!rows.length) throw new Error("El CSV no tiene filas de datos.");

  // 2) Agrupar filas por handle limpio → un producto con N variantes.
  const plans = new Map<string, ProductPlan>();
  const problems: string[] = [];
  const seenSku = new Set<string>();

  for (const [i, row] of rows.entries()) {
    const line = i + 2; // +1 header, +1 base-1
    const rawHandle = col(row, "Handle") || slugify(col(row, "Title"));
    const handle = slugify(rawHandle);
    const title = col(row, "Title");
    const format = col(row, "formato") || "Único";
    const sku = col(row, "SKU");
    const price = parsePriceClp(col(row, "precio_pvp_sugerido"));

    if (!title) {
      problems.push(`Fila ${line}: sin Title → se salta.`);
      continue;
    }
    if (!Number.isFinite(price)) {
      problems.push(`Fila ${line} (${title}): precio inválido → se salta.`);
      continue;
    }
    if (sku && seenSku.has(sku)) {
      problems.push(`Fila ${line} (${title}): SKU duplicado "${sku}" en el CSV.`);
    }
    if (sku) seenSku.add(sku);

    let plan = plans.get(handle);
    if (!plan) {
      plan = {
        handle,
        title,
        brand: col(row, "brand") || "Manada",
        species: col(row, "species"),
        stage: col(row, "stage"),
        category: col(row, "Categories") || "Alimento",
        subscribable: parseBool(col(row, "subscribable")),
        description: col(row, "description") || undefined,
        kcalPerKg: parseNumber(col(row, "kcal_per_kg")),
        rating: parseNumber(col(row, "rating")),
        reviewCount: parseNumber(col(row, "review_count")),
        suitableConditions: col(row, "suitable_conditions") || undefined,
        notFor: col(row, "not_for") || undefined,
        subscriptionDiscount: parseNumber(
          col(row, "subscription_discount_percentage"),
        ),
        variants: [],
      };
      plans.set(handle, plan);
    }

    if (plan.variants.some((v) => v.format.toLowerCase() === format.toLowerCase())) {
      problems.push(
        `Fila ${line} (${title}): formato "${format}" repetido en el mismo producto → se salta.`,
      );
      continue;
    }
    plan.variants.push({
      format,
      sku,
      price,
      weight: parseWeightGrams(format),
    });
  }

  // 3) ¿Cuáles handles ya existen? (idempotencia)
  const handles = [...plans.keys()];
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["handle"],
    filters: { handle: handles },
  });
  const existingHandles = new Set(
    (existing ?? []).map((p: { handle: string }) => p.handle),
  );

  const toCreate = [...plans.values()].filter((p) => !existingHandles.has(p.handle));
  const skipped = [...plans.values()].filter((p) => existingHandles.has(p.handle));

  // 4) Reporte del plan.
  logger.info(
    `[import] ${rows.length} filas → ${plans.size} productos · ` +
      `${toCreate.length} a crear · ${skipped.length} ya existen (se saltan)`,
  );
  for (const p of toCreate) {
    const formatos = p.variants.map((v) => v.format).join(", ");
    logger.info(`  + ${p.title}  [${p.variants.length} var: ${formatos}]  → /${p.handle}`);
  }
  for (const p of skipped) {
    logger.info(`  = (ya existe) ${p.title} → /${p.handle}`);
  }
  if (problems.length) {
    logger.warn(`[import] ${problems.length} avisos de datos:`);
    for (const w of problems) logger.warn(`    ⚠ ${w}`);
  }

  if (dryRun) {
    logger.info("[import] DRY RUN — no se escribió nada. Quita IMPORT_DRY_RUN para cargar.");
    return;
  }
  if (!toCreate.length) {
    logger.info("[import] Nada nuevo que crear. Listo.");
    return;
  }

  // 5) Dependencias del contexto (sales channel, categorías, perfil de envío).
  const [salesChannel] = await salesChannelModuleService.listSalesChannels({});
  if (!salesChannel) {
    throw new Error("No hay sales channel. Corre el seed antes de importar.");
  }
  const salesChannelLink = [{ id: salesChannel.id }];

  const [shippingProfile] = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  if (!shippingProfile) {
    throw new Error("No hay perfil de envío 'default'. Corre el seed antes de importar.");
  }

  // Mapa de categorías: reutiliza las existentes; crea las que falten.
  const wantedCats = [...new Set(toCreate.map((p) => p.category).filter(Boolean))];
  const { data: existingCats } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });
  const catByName = new Map<string, string>(
    (existingCats ?? []).map((c: { id: string; name: string }) => [
      c.name.toLowerCase(),
      c.id,
    ]),
  );
  const missingCats = wantedCats.filter((n) => !catByName.has(n.toLowerCase()));
  if (missingCats.length) {
    const { result: created } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingCats.map((name) => ({ name, is_active: true })),
      },
    });
    for (const c of created) catByName.set(c.name.toLowerCase(), c.id);
  }

  // 6) Crear producto por producto (así un fallo aislado no bota el lote entero).
  let ok = 0;
  const failed: string[] = [];
  for (const p of toCreate) {
    const categoryId = catByName.get(p.category.toLowerCase());
    const metadata: Record<string, unknown> = {
      brand: p.brand,
      species: p.species,
      stage: p.stage,
      subscribable: p.subscribable,
    };
    if (p.kcalPerKg !== undefined) metadata.kcal_per_kg = p.kcalPerKg;
    if (p.rating !== undefined) metadata.rating = p.rating;
    if (p.reviewCount !== undefined) metadata.review_count = p.reviewCount;
    if (p.suitableConditions) metadata.suitable_conditions = p.suitableConditions;
    if (p.notFor) metadata.not_for = p.notFor;
    if (p.subscribable && p.subscriptionDiscount !== undefined) {
      metadata.subscription_discount_percentage = p.subscriptionDiscount;
    }

    try {
      await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: p.title,
              handle: p.handle,
              description: p.description,
              status,
              category_ids: categoryId ? [categoryId] : [],
              shipping_profile_id: shippingProfile.id,
              metadata,
              options: [
                {
                  title: FORMAT_OPTION_TITLE,
                  values: p.variants.map((v) => v.format),
                },
              ],
              variants: p.variants.map((v) => ({
                title: v.format,
                ...(v.sku ? { sku: v.sku } : {}),
                ...(v.weight ? { weight: v.weight } : {}),
                options: { [FORMAT_OPTION_TITLE]: v.format },
                prices: [{ amount: v.price, currency_code: "clp" }],
              })),
              sales_channels: salesChannelLink,
            },
          ],
        },
      });
      ok++;
      logger.info(`  ✓ ${p.title}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      failed.push(`${p.title} (/${p.handle}): ${msg}`);
      logger.error(`  ✗ ${p.title}: ${msg}`);
    }
  }

  // 7) Sembrar stock inicial (100) para toda variante nueva sin nivel de bodega.
  //    Mismo default y semántica que el widget "Formatos" del Admin (D48/add-format.ts).
  const [stockLocation] = (
    await query.graph({ entity: "stock_location", fields: ["id"] })
  ).data;
  if (stockLocation) {
    const { data: inventoryItems } = await query.graph({
      entity: "inventory_item",
      fields: ["id", "location_levels.id"],
    });
    const items = (inventoryItems ?? []) as {
      id: string;
      location_levels?: unknown[];
    }[];
    const levels: CreateInventoryLevelInput[] = items
      .filter((it) => (it.location_levels ?? []).length === 0)
      .map((it) => ({
        location_id: (stockLocation as { id: string }).id,
        inventory_item_id: it.id,
        stocked_quantity: DEFAULT_STOCKED_QUANTITY,
      }));
    if (levels.length) {
      await createInventoryLevelsWorkflow(container).run({
        input: { inventory_levels: levels },
      });
      logger.info(`[import] Stock inicial ${DEFAULT_STOCKED_QUANTITY} → ${levels.length} variantes nuevas.`);
    }
  }

  logger.info(
    `[import] Listo. Creados ${ok}/${toCreate.length}` +
      (failed.length ? ` · ${failed.length} con error` : "") +
      ` · estado=${status}.`,
  );
  if (failed.length) {
    logger.warn("[import] Fallidos:");
    for (const f of failed) logger.warn(`    ✗ ${f}`);
  }
}
