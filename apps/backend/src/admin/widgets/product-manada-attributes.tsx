import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminProduct, DetailWidgetProps } from "@medusajs/types";
import {
  Badge,
  Button,
  Checkbox,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui";
import { useMemo, useState } from "react";
import { sdk } from "../lib/sdk";

/**
 * Widget "Atributos Manada" (Fase 4 · bloque catálogo). Reemplaza el editor de
 * metadata CRUDA por inputs validados para los atributos de merchandising y
 * nutrición que hoy viven en `product.metadata` y que **deciden el comportamiento
 * del motor de recomendación** (RECOMMENDATION_ENGINE.md / DATABASE §5.2).
 *
 * La metadata sigue siendo metadata (sin tablas nuevas, sin migración): solo cambia
 * cómo se captura. Escribe tipos nativos (arrays/boolean/number) que el mapper del
 * front y el middleware de `subscription_price` ya toleran. Vive a nivel PRODUCTO:
 * estos atributos son del alimento, compartidos por todos sus formatos (variantes).
 */

// Vocabularios fuente (espejo de apps/web/src/lib/pet.ts; no se importa cross-app
// por la regla ARCHITECTURE §2). Un valor mal escrito rompía en silencio las
// puertas del motor → aquí solo se puede elegir de estas listas.
const SPECIES = [
  { value: "perro", label: "Perro" },
  { value: "gato", label: "Gato" },
  { value: "otro", label: "Otro" },
] as const;

const STAGES = [
  { value: "cachorro", label: "Cachorro" },
  { value: "adulto", label: "Adulto" },
  { value: "senior", label: "Senior" },
] as const;

const CONDITIONS = [
  "Sobrepeso",
  "Piel sensible",
  "Problemas renales",
  "Articulaciones",
  "Digestión sensible",
] as const;

type Meta = Record<string, unknown> | null | undefined;

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string")
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function parseBool(value: unknown): boolean {
  return value === true || value === "true";
}

function parseNumberString(value: unknown): string {
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return "";
}

function parseString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Chip-checkbox reutilizable para las multi-selecciones. */
function CheckRow({
  options,
  selected,
  onToggle,
}: {
  options: readonly { value: string; label: string }[] | readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5"
        >
          <Checkbox
            checked={selected.includes(o.value)}
            onCheckedChange={() => onToggle(o.value)}
          />
          <Text size="small">{o.label}</Text>
        </label>
      ))}
    </div>
  );
}

const ProductManadaAttributes = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const meta = data.metadata as Meta;

  const isAlimento = useMemo(
    () => (data.categories ?? []).some((c) => c?.name?.toLowerCase() === "alimento"),
    [data.categories],
  );

  const [brand, setBrand] = useState(() => parseString(meta?.brand));
  const [species, setSpecies] = useState<string[]>(() => parseList(meta?.species));
  const [stage, setStage] = useState<string[]>(() => parseList(meta?.stage));
  const [kcal, setKcal] = useState(() => parseNumberString(meta?.kcal_per_kg));
  const [suitable, setSuitable] = useState<string[]>(() =>
    parseList(meta?.suitable_conditions),
  );
  const [notFor, setNotFor] = useState<string[]>(() => parseList(meta?.not_for));
  const [ingredients, setIngredients] = useState(() => parseString(meta?.ingredients));
  const [subscribable, setSubscribable] = useState(() => parseBool(meta?.subscribable));
  const [discount, setDiscount] = useState(() =>
    parseNumberString(meta?.subscription_discount_percentage),
  );
  const [saving, setSaving] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const kcalMissing = isAlimento && kcal.trim() === "";

  async function handleSave() {
    setSaving(true);
    try {
      const next: Record<string, unknown> = { ...(data.metadata ?? {}) };
      const setOrDelete = (key: string, value: unknown) => {
        const empty =
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0);
        if (empty) delete next[key];
        else next[key] = value;
      };

      setOrDelete("brand", brand.trim());
      setOrDelete("species", species);
      setOrDelete("stage", stage);
      setOrDelete("kcal_per_kg", kcal.trim() === "" ? undefined : Number(kcal));
      setOrDelete("suitable_conditions", suitable);
      setOrDelete("not_for", notFor);
      setOrDelete("ingredients", ingredients.trim());
      next.subscribable = subscribable;
      setOrDelete(
        "subscription_discount_percentage",
        subscribable && discount.trim() !== "" ? Number(discount) : undefined,
      );

      // Limpieza: rating/review_count son dead weight (reseñas ocultas, D28).
      delete next.rating;
      delete next.review_count;

      await sdk.admin.product.update(data.id, { metadata: next });
      toast.success("Atributos de Manada guardados");
    } catch (error) {
      toast.error("No se pudieron guardar los atributos");
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Atributos Manada</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Merchandising y nutrición del alimento — compartidos por todos los formatos
          </Text>
        </div>
        <Button size="small" onClick={handleSave} isLoading={saving}>
          Guardar
        </Button>
      </div>

      <div className="flex flex-col gap-y-6 px-6 py-6">
        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus">
            Marca
          </Label>
          <Input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Royal Canin"
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus">
            Especie
          </Label>
          <CheckRow
            options={SPECIES}
            selected={species}
            onToggle={(v) => toggle(species, setSpecies, v)}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus">
            Etapa de vida
          </Label>
          <CheckRow
            options={STAGES}
            selected={stage}
            onToggle={(v) => toggle(stage, setStage, v)}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <div className="flex items-center gap-x-2">
            <Label size="small" weight="plus">
              Energía metabolizable (kcal/kg)
            </Label>
            {kcalMissing && (
              <Badge size="2xsmall" color="orange">
                Requerido para calcular la ración
              </Badge>
            )}
          </div>
          <Input
            type="number"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            placeholder="3700"
            className="max-w-[220px]"
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus">
            Formulado para (condiciones)
          </Label>
          <CheckRow
            options={CONDITIONS}
            selected={suitable}
            onToggle={(v) => toggle(suitable, setSuitable, v)}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <div className="flex items-center gap-x-2">
            <Label size="small" weight="plus">
              No apto para (contraindicaciones)
            </Label>
            <Badge size="2xsmall" color="red">
              Puerta de seguridad: nunca se recomienda si calza
            </Badge>
          </div>
          <CheckRow
            options={CONDITIONS}
            selected={notFor}
            onToggle={(v) => toggle(notFor, setNotFor, v)}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus">
            Ingredientes
          </Label>
          <Textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Lista de ingredientes del alimento…"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-y-3">
          <div className="flex items-center gap-x-3">
            <Switch checked={subscribable} onCheckedChange={setSubscribable} />
            <Label size="small" weight="plus">
              Admite suscripción
            </Label>
          </div>
          {subscribable && (
            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus">
                Descuento de suscripción (%)
              </Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="15"
                className="max-w-[220px]"
              />
              <Text size="xsmall" className="text-ui-fg-subtle">
                El precio de suscripción lo calcula el backend por variante; no se
                escribe a mano.
              </Text>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductManadaAttributes;
