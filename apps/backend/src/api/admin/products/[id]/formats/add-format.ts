import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import {
  createProductOptionsWorkflow,
  createProductVariantsWorkflow,
  deleteProductOptionsWorkflow,
  deleteProductVariantsWorkflow,
  updateProductOptionsWorkflow,
} from "@medusajs/core-flows";

/**
 * Núcleo de "agregar un formato a un producto" (extensión de Manada). Encapsula
 * todo el baile de Medusa v2 (opción → valor → variante, + limpieza de la
 * "Default variant") en una operación idempotente por formato.
 *
 * Se extrae de la route para poder ejercitarlo tanto desde `POST /admin/products/:id/formats`
 * como desde un script de prueba (`medusa exec`) contra una DB, sin duplicar lógica.
 *
 * Postcondición: el producto queda con UNA sola opción "Formato" y una variante
 * por formato, cada una con su precio en CLP (convención del seed).
 */

/** Nombre canónico de la opción de presentación en el catálogo de Manada. */
export const FORMAT_OPTION_TITLE = "Formato";

const norm = (s: string) => s.trim().toLowerCase();

export type AddFormatInput = {
  format: string;
  price_clp: number;
  sku?: string;
  manage_inventory?: boolean;
};

type ProductShape = {
  id: string;
  options?: { id: string; title: string; values?: { value: string }[] }[];
  variants?: { id: string; title: string | null }[];
};

async function loadProduct(
  container: MedusaContainer,
  productId: string,
): Promise<ProductShape | undefined> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "options.id",
      "options.title",
      "options.values.value",
      "variants.id",
      "variants.title",
    ],
    filters: { id: productId },
  });
  return data?.[0] as ProductShape | undefined;
}

export async function addProductFormat(
  container: MedusaContainer,
  productId: string,
  input: AddFormatInput,
): Promise<{ id: string; title: string | null }[]> {
  const { format, price_clp, sku, manage_inventory } = input;

  const product = await loadProduct(container, productId);
  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `El producto ${productId} no existe.`);
  }

  const options = product.options ?? [];
  const variants = product.variants ?? [];
  const formatOption = options.find((o) => norm(o.title) === norm(FORMAT_OPTION_TITLE));

  // La variante nueva, compartida por ambos caminos. `manage_inventory` solo se
  // envía si el caller lo especifica: así hereda el mismo default que el resto del
  // catálogo (seed) y no introduce una variante con comportamiento de stock distinto.
  const newVariant = {
    product_id: productId,
    title: format,
    ...(sku ? { sku } : {}),
    ...(manage_inventory === undefined ? {} : { manage_inventory }),
    options: { [FORMAT_OPTION_TITLE]: format },
    prices: [{ amount: price_clp, currency_code: "clp" }],
  };

  if (formatOption) {
    // ── Camino A: el producto ya tiene la opción "Formato" ────────────────────
    // Solo hay que sumar el valor (si falta) y crear la variante.
    const existingValues = (formatOption.values ?? []).map((v) => v.value);
    if (existingValues.some((v) => norm(v) === norm(format))) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `El formato "${format}" ya existe en este producto.`,
      );
    }
    await updateProductOptionsWorkflow(container).run({
      input: {
        selector: { id: formatOption.id },
        // `values` reemplaza el set → se pasa la unión (nunca se quita un valor en uso).
        update: { values: [...existingValues, format] },
      },
    });
    await createProductVariantsWorkflow(container).run({
      input: { product_variants: [newVariant] },
    });
  } else {
    // ── Camino B: no hay opción "Formato" (producto recién creado, típicamente
    // con la "Default variant" sin opciones) → se configura desde cero. ─────────
    // Fuera de alcance el caso avanzado multi-variante/multi-opción: se deriva al
    // editor nativo para no arriesgar datos ya estructurados.
    if (variants.length > 1 || options.length > 1) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Este producto ya tiene variantes u opciones configuradas de otra forma. " +
          "Agrega el formato desde el editor de variantes nativo de Medusa.",
      );
    }

    // Se limpia primero la variante y la opción por defecto (si existen): así el
    // producto queda con UNA sola opción "Formato". Se borra la variante antes que
    // la opción para que ningún valor quede referenciado.
    const placeholderVariantIds = variants.map((v) => v.id);
    if (placeholderVariantIds.length) {
      await deleteProductVariantsWorkflow(container).run({
        input: { ids: placeholderVariantIds },
      });
    }
    const staleOptionIds = options.map((o) => o.id);
    if (staleOptionIds.length) {
      await deleteProductOptionsWorkflow(container).run({
        input: { ids: staleOptionIds },
      });
    }

    await createProductOptionsWorkflow(container).run({
      input: {
        product_options: [
          { product_id: productId, title: FORMAT_OPTION_TITLE, values: [format] },
        ],
      },
    });
    await createProductVariantsWorkflow(container).run({
      input: { product_variants: [newVariant] },
    });
  }

  const updated = await loadProduct(container, productId);
  return (updated?.variants ?? []).map((v) => ({ id: v.id, title: v.title }));
}
