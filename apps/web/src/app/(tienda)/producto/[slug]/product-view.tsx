"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingDown } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Separator } from "@/components/ui/separator";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { useToast } from "@/components/ui/toast";
import {
  ShippingPolicyNote,
  ProductImage,
  ProductRail,
  StockBadge,
  VariantSelector,
} from "@/components/commerce";
import { PlanManadaCard } from "./plan-manada-card";
import { usePet, useCart } from "@/components/providers";
import { dailyRationGrams } from "@/lib/anticipation";
import { formatCLP, pluralize } from "@/lib/format";
import { categoryLabel } from "@/lib/catalog";
import type { ShippingPolicy } from "@/lib/medusa";
import type { Product, SubscriptionFrequencyWeeks } from "@/types";

/**
 * PDP — ficha de producto.
 *
 * Decisiones de IA (AUDIT_UI_UX):
 * - U044/U096: las specs de valor (ración/día, duración del saco, $/kg) van en
 *   un módulo destacado ARRIBA, no enterradas en una pestaña.
 * - U045: la página jerarquiza hacia la suscripción (recurrente = margen): la
 *   caja de suscripción precede al CTA y el precio del botón refleja su estado.
 * - U046: el reaseguro "pausa/cancela cuando quieras" es visible en el punto de
 *   decisión, no solo en el checkout.
 * - U052: un ÚNICO riel de cross-sell ("Suele combinarse con").
 * - U064: el criterio de "para tu mascota" es transparente en el copy.
 */
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Frecuencias de suscripción ofrecidas, en semanas (espejo del hook). */
const OFFERED_WEEKS: SubscriptionFrequencyWeeks[] = [2, 4, 6, 8];

/**
 * Frecuencia "natural" sugerida por defecto en la card: la más cercana a cuánto
 * dura el saco (D55). Si no hay duración (sin mascota/peso), cae a 4 semanas.
 */
function naturalFrequencyWeeks(durationDays?: number): SubscriptionFrequencyWeeks {
  if (!durationDays) return 4;
  const weeks = durationDays / 7;
  return OFFERED_WEEKS.reduce((best, w) =>
    Math.abs(w - weeks) < Math.abs(best - weeks) ? w : best,
  );
}

export function ProductView({
  product,
  products,
  policy,
}: {
  product: Product;
  products: Product[];
  policy: ShippingPolicy;
}) {
  const { activePet, assignFood } = usePet();
  const { addItem } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [qty, setQty] = useState(1);

  // Variante (formato/talla) elegida. Por defecto, la primaria: la misma que
  // muestra la tarjeta de catálogo, para que no haya salto de precio al abrir.
  const variants = product.variants ?? [];
  const [selectedVariantId, setSelectedVariantId] = useState(product.variantId);
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  // Producto según la variante elegida: precio, formato, stock y variantId reflejan
  // la talla seleccionada. Todo lo que cotiza o agrega al carrito usa `selected`.
  const selected: Product = selectedVariant
    ? {
        ...product,
        variantId: selectedVariant.id,
        price: selectedVariant.price,
        format: selectedVariant.format,
        stock: selectedVariant.stock,
      }
    : product;

  const soldOut = selected.stock <= 0;

  // Specs de valor (U044): ración diaria, duración del saco y precio por kilo.
  // Se recalculan para la VARIANTE elegida (bagKg y precio cambian con el formato)
  // y la MASCOTA ACTIVA del header — informativas, no transaccionales (D39).
  const bagKg = selected.format && /kg/i.test(selected.format) ? parseFloat(selected.format) : undefined;
  const isFood = product.category === "alimento";
  const ration =
    isFood && activePet?.weightKg
      ? dailyRationGrams(
          {
            species: activePet.species,
            stage: activePet.stage,
            weightKg: activePet.weightKg,
            neutered: activePet.neutered,
          },
          selected.kcalPerKg,
        )
      : undefined;
  const duration = isFood && bagKg && ration ? Math.round((bagKg * 1000) / ration) : undefined;
  const pricePerKg = bagKg ? Math.round(selected.price.current / bagKg) : undefined;

  // "Rinde más": el formato con menor precio por kilo (el saco grande casi siempre
  // sale más barato/kg). Habilita un empujón honesto al mejor valor, clickeable.
  const perKgOf = (fmt: string, price: number) => {
    const kg = /kg/i.test(fmt) ? parseFloat(fmt) : undefined;
    return kg ? Math.round(price / kg) : undefined;
  };
  const bestValue = variants
    .map((v) => ({ v, perKg: perKgOf(v.format, v.price.current) }))
    .filter((x): x is { v: (typeof variants)[number]; perKg: number } => x.perKg !== undefined)
    .sort((a, b) => a.perKg - b.perKg)[0];
  const betterFormat =
    isFood && bestValue && pricePerKg && bestValue.perKg < pricePerKg ? bestValue : undefined;

  // La compra única cotiza siempre al precio de la variante. La suscripción vive
  // en su propia card (Plan Manada), con su precio y CTA separados (D55).
  const unitPrice = selected.price.current;
  const naturalFreq = naturalFrequencyWeeks(duration);

  // Cross-sell único y RELEVANTE: comparte especie con el producto y es de otra
  // categoría (complemento, no otro saco igual) → "completar su rutina".
  const related = products
    .filter(
      (p) =>
        p.id !== product.id &&
        p.species.some((s) => product.species.includes(s)) &&
        p.category !== product.category,
    )
    .slice(0, 6);

  function add() {
    addItem(selected, { quantity: qty });
    // El puente comprar→perfil (D39): comprar NO asigna; si es alimento y no es
    // el suyo, el toast ofrece definirlo con UN tap. Comprar y definir qué come
    // se sienten relacionados, pero no son el mismo flujo.
    const canOfferAssign = isFood && activePet && activePet.currentFoodId !== product.id;
    if (canOfferAssign) {
      const pet = activePet;
      toast({
        title: "Agregado al carrito",
        description: `¿Es el alimento que come ${pet.name}?`,
        variant: "success",
        action: {
          label: "Sí, es el suyo",
          onClick: () => {
            assignFood(pet.id, product.id);
            toast({
              title: `Guardamos que ${pet.name} come esto`,
              description: "Te avisaremos antes de que se le acabe.",
              variant: "success",
            });
          },
        },
      });
    } else {
      toast({
        title: "Agregado al carrito",
        description: `${product.brand.name} · ${product.name}`,
        variant: "success",
        action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
      });
    }
  }

  // Tiles de valor: SOLO lo personalizado a la mascota (ración/día y duración del
  // saco). El precio por kilo dejó de ser una tile suelta —ahora va como precio
  // unitario bajo el precio, que es donde el usuario lo compara (más abajo).
  const specs: { label: string; value: string }[] = [];
  if (ration) specs.push({ label: "Ración diaria", value: `~${ration} g` });
  if (duration) specs.push({ label: `Le dura a ${activePet?.name ?? "tu mascota"}`, value: `~${pluralize(duration, "día")}` });

  return (
    // pt reducido (mismo criterio que la PLP): breadcrumb cerca del nav.
    <Section spacing="md" className="pt-6 lg:pt-10">
      <Stack gap={6}>
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Comprar", href: "/categoria/todo" },
            { label: categoryLabel(product.category), href: `/categoria/${product.category}` },
            { label: product.name },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Galería: foto real del Admin si existe; si no, packshot placeholder
              cálido (dirección de arte real = Polish 3.4 / U090).
              4:3 en móvil: la galería cuadrada a todo el ancho empujaba precio y
              CTA bajo el fold; cuadrada en desktop. */}
          <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-white lg:aspect-square">
            <ProductImage
              image={product.imageUrl}
              alt={`${product.brand.name} ${product.name}`}
              sizes="(min-width: 1024px) 42vw, (min-width: 640px) 90vw, 100vw"
              priority
              emojiClassName="text-[9rem] drop-shadow-[0_20px_28px_rgba(42,39,34,0.14)]"
            />
          </div>

          {/* Caja de compra — orden del boceto: nombre → descripción → formato →
              specs de valor → [Plan Manada] → Compra única */}
          <Stack gap={5}>
            <Stack gap={2}>
              <span className="overline text-text-secondary">{product.brand.name}</span>
              <h1 className="heading-1 text-text-primary">{product.name}</h1>
              {(product.species.length > 0 || (product.stage?.length ?? 0) > 0) && (
                <Row gap={2} wrap className="pt-0.5">
                  {product.stage?.map((s) => (
                    <Badge key={s} variant="neutral">
                      {capitalize(s)}
                    </Badge>
                  ))}
                  {product.species.map((s) => (
                    <Badge key={s} variant="neutral">
                      {capitalize(s)}
                    </Badge>
                  ))}
                </Row>
              )}
            </Stack>

            {/* Descripción real del catálogo, arriba (como el boceto). */}
            {product.description && (
              <p className="body-m text-text-secondary">{product.description}</p>
            )}

            {/* Selector de formato/talla: solo aparece si el producto tiene más de
                una variante; si tiene una sola, se muestra en las specs. */}
            <VariantSelector
              variants={variants}
              selectedId={selected.variantId}
              onSelect={setSelectedVariantId}
              label="Selecciona el tamaño"
            />

            {/* Módulo de specs de valor (U044/U096) — recalculado por variante.
                Grid responsive: apila en móvil para no truncar las etiquetas. */}
            {specs.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {specs.map((s) => (
                  <div
                    key={s.label}
                    className="min-w-0 rounded-[var(--radius-md)] border border-border-default bg-surface px-4 py-3"
                  >
                    <p className="price text-lg text-text-primary">{s.value}</p>
                    <p className="text-[13px] text-text-secondary">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Invitación contextual (anónimo): el perfil desbloquea la ración
                y la duración de ESTE saco — valor evidente, no un registro seco. */}
            {isFood && !activePet && (
              <p className="text-[13px] text-text-secondary">
                <Link
                  href="/comenzar"
                  className="font-semibold text-text-brand underline-offset-2 hover:underline"
                >
                  Crea el perfil de tu mascota
                </Link>{" "}
                y te decimos su ración diaria y cuánto le dura este saco.
              </p>
            )}

            {/* Suscripción primero (U045): la card "Plan Manada" es el patrón único
                (D55). Gated por `subscribable` (SUBSCRIPTIONS_ENABLED, backend): con
                el flag apagado no se renderiza y la PDP queda como compra única. La
                frecuencia por defecto es la natural (cuánto dura el saco). */}
            {product.subscribable && (
              <PlanManadaCard product={selected} defaultFrequencyWeeks={naturalFreq} />
            )}

            <Separator />

            {/* Compra única (U045): precio de la variante elegida + cantidad + CTA */}
            <Stack gap={3}>
              <Row justify="between" align="end" wrap gap={3}>
                <Stack gap={1}>
                  <span className="overline text-text-secondary">Compra única</span>
                  <Price now={unitPrice} was={selected.price.compareAt} size="xl" />
                  {pricePerKg && (
                    <span className="text-[13px] text-text-secondary">
                      {formatCLP(pricePerKg)} por kilo
                    </span>
                  )}
                </Stack>
                <StockBadge stock={selected.stock} />
              </Row>
              {betterFormat && (
                <button
                  type="button"
                  onClick={() => setSelectedVariantId(betterFormat.v.id)}
                  className="-mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--subscribe-soft)] px-3 py-1.5 text-left text-[13px] font-medium text-[var(--subscribe-strong)] transition-[filter] hover:brightness-95"
                >
                  <TrendingDown className="size-3.5 shrink-0" aria-hidden />
                  El saco de {betterFormat.v.format} rinde más: {formatCLP(betterFormat.perKg)}/kg
                </button>
              )}
              <Row gap={3} align="stretch" className="gap-3">
                {!soldOut && (
                  <QuantitySelector value={qty} onChange={setQty} min={1} max={Math.min(selected.stock, 10)} />
                )}
                <Button size="lg" block onClick={add} disabled={soldOut}>
                  {soldOut ? "Sin stock por ahora" : "Agregar al carrito"}
                </Button>
              </Row>
            </Stack>

            <ShippingPolicyNote policy={policy} size="md" />
          </Stack>
        </div>

        {/* Ficha técnica (la descripción ya vive arriba, junto al nombre). */}
        <div className="mt-2 max-w-md">
          <h2 className="heading-3 mb-3 text-text-primary">Ficha técnica</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-text-secondary">Marca</dt>
            <dd className="text-text-primary">{product.brand.name}</dd>
            <dt className="text-text-secondary">{variants.length > 1 ? "Formatos" : "Formato"}</dt>
            <dd className="text-text-primary">
              {variants.length > 1
                ? variants.map((v) => v.format).join(" · ")
                : (product.format ?? "—")}
            </dd>
            <dt className="text-text-secondary">Para</dt>
            <dd className="text-text-primary">{product.species.join(", ")}</dd>
            {product.stage && (
              <>
                <dt className="text-text-secondary">Etapa</dt>
                <dd className="text-text-primary">{product.stage.join(", ")}</dd>
              </>
            )}
          </dl>
        </div>

        {/* Cross-sell ÚNICO (U052) */}
        {related.length > 0 && (
          <ProductRail
            overline="Suele combinarse con"
            title="Para completar su rutina"
            products={related}
          />
        )}
      </Stack>
    </Section>
  );
}
