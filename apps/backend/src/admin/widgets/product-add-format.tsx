import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types";
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  toast,
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { sdk } from "../lib/sdk";

/**
 * Widget "Formatos" en la ficha de producto del Admin (extensión de Manada).
 *
 * En Medusa v2 una variante es una combinación de valores de opción, y agregar un
 * formato a mano obliga a definir la opción → sumar el valor → crear la variante,
 * lo que deja a productos nuevos atascados en la "Default variant". Este widget lo
 * resuelve en un paso: escribes el formato (ej. "14 kg") + precio en CLP y listo.
 * Todo el enredo lo encapsula `POST /admin/products/:id/formats`.
 *
 * Se inyecta en `product.details.after` (bajo la ficha nativa). Es un atajo, no un
 * reemplazo: el editor de variantes nativo sigue disponible para casos avanzados.
 */

type VariantRow = {
  id: string;
  title: string | null;
  sku: string | null;
  prices?: { amount: number; currency_code: string }[];
};
type ProductFormatsResponse = {
  product: {
    id: string;
    options?: { title: string }[];
    variants?: VariantRow[];
  };
};

const FIELDS =
  "id,options.title,variants.id,variants.title,variants.sku,variants.prices.amount,variants.prices.currency_code";

/** CLP sin decimales: "$24.990". */
const clp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" });

function clpOf(variant: VariantRow): string | null {
  const price = variant.prices?.find((p) => p.currency_code === "clp");
  return price ? clp.format(price.amount) : null;
}

const ProductAddFormatWidget = ({
  data,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const productId = data.id;
  const queryClient = useQueryClient();
  const queryKey = ["manada-product-formats", productId];

  const [format, setFormat] = useState("");
  const [priceClp, setPriceClp] = useState("");
  const [sku, setSku] = useState("");

  const { data: product, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      sdk.client.fetch<ProductFormatsResponse>(`/admin/products/${productId}`, {
        query: { fields: FIELDS },
      }),
  });

  const variants = product?.product.variants ?? [];
  const options = product?.product.options ?? [];
  // "Sin configurar": sin opción "Formato" y con la única variante por defecto.
  const hasFormatOption = options.some((o) => o.title?.trim().toLowerCase() === "formato");
  const looksUnconfigured =
    !hasFormatOption &&
    variants.length <= 1 &&
    (variants.length === 0 ||
      variants[0].title?.trim().toLowerCase() === "default variant");

  const addFormat = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/products/${productId}/formats`, {
        method: "POST",
        body: {
          format: format.trim(),
          price_clp: Number(priceClp),
          sku: sku.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Formato agregado", {
        description: `"${format.trim()}" quedó como variante con su precio.`,
      });
      setFormat("");
      setPriceClp("");
      setSku("");
      queryClient.invalidateQueries({ queryKey });
      // Refresca también la ficha nativa (sección Variants / Options).
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { message?: string })?.message ?? "No se pudo agregar el formato.";
      toast.error("Error al agregar formato", { description: message });
    },
  });

  const priceValue = Number(priceClp);
  const canSubmit =
    format.trim().length > 0 &&
    Number.isFinite(priceValue) &&
    priceValue > 0 &&
    !addFormat.isPending;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Formatos</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Agrega presentaciones (ej. 14 kg) sin pelear con opciones y variantes
          </Text>
        </div>
        {looksUnconfigured && !isLoading && (
          <Badge color="orange" size="2xsmall">
            Sin formatos
          </Badge>
        )}
      </div>

      {/* Formatos actuales */}
      <div className="px-6 py-4">
        {isLoading ? (
          <Text className="text-ui-fg-subtle" size="small">
            Cargando…
          </Text>
        ) : looksUnconfigured ? (
          <Text className="text-ui-fg-subtle" size="small">
            Este producto aún no tiene formatos reales (quedó con la variante por
            defecto). Agrega el primero abajo y se reemplaza por una variante con
            nombre y precio.
          </Text>
        ) : (
          <div className="flex flex-col gap-2">
            {variants.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Text size="small" weight="plus">
                    {v.title || "—"}
                  </Text>
                  {v.sku && (
                    <Text className="text-ui-fg-subtle" size="xsmall">
                      {v.sku}
                    </Text>
                  )}
                </div>
                <Text size="small" className="text-ui-fg-subtle">
                  {clpOf(v) ?? "sin precio"}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alta de formato */}
      <form
        className="flex flex-col gap-3 px-6 py-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) addFormat.mutate();
        }}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label size="xsmall" weight="plus" htmlFor="manada-format">
              Formato
            </Label>
            <Input
              id="manada-format"
              placeholder="14 kg"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label size="xsmall" weight="plus" htmlFor="manada-price">
              Precio (CLP)
            </Label>
            <Input
              id="manada-price"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="54990"
              value={priceClp}
              onChange={(e) => setPriceClp(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label size="xsmall" weight="plus" htmlFor="manada-sku">
              SKU (opcional)
            </Label>
            <Input
              id="manada-sku"
              placeholder="AMITY-LG-CHICKEN-PUPPY-14KG"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" isLoading={addFormat.isPending} disabled={!canSubmit}>
            Agregar formato
          </Button>
        </div>
      </form>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductAddFormatWidget;
