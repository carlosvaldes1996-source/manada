"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CalendarClock, ShieldCheck, Truck } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Separator } from "@/components/ui/separator";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  ShippingPolicyNote,
  ProductImage,
  ProductRail,
  StockBadge,
} from "@/components/commerce";
import { usePet, useCart } from "@/components/providers";
import { useSubscription } from "@/hooks/use-subscription";
import { dailyRationGrams } from "@/lib/anticipation";
import { formatCLP, pluralize } from "@/lib/format";
import { categoryLabel } from "@/lib/catalog";
import type { ShippingPolicy } from "@/lib/medusa";
import type { Product, ProductVariant } from "@/types";
import { cn } from "@/lib/utils";

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

  // Variant selection: initialise to first variant (primary) if multi-variant product.
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product.variants?.[0]?.variantId ?? product.variantId,
  );
  const [qty, setQty] = useState(1);

  // Derive current price/stock/format from the selected variant or fall back to base product.
  const selectedVariant: ProductVariant | undefined = product.variants?.find(
    (v) => v.variantId === selectedVariantId,
  );
  const currentPrice = selectedVariant?.price ?? product.price;
  const currentStock = selectedVariant?.stock ?? product.stock;
  const currentVariantId = selectedVariantId ?? product.variantId;
  const currentFormat = selectedVariant?.title ?? product.format;

  const soldOut = currentStock <= 0;

  // Suscripción: se alimenta del precio de la variante seleccionada.
  const productForSub = { ...product, price: currentPrice };
  const sub = useSubscription(productForSub);

  // Specs de valor (U044): ración diaria, duración del saco y precio por kilo.
  const bagKg =
    currentFormat && /kg/i.test(currentFormat)
      ? parseFloat(currentFormat)
      : undefined;
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
          product.kcalPerKg,
        )
      : undefined;
  const duration =
    isFood && bagKg && ration ? Math.round((bagKg * 1000) / ration) : undefined;
  const pricePerKg = bagKg ? Math.round(currentPrice.current / bagKg) : undefined;

  // Cross-sell: misma especie, categoría diferente.
  const related = products
    .filter(
      (p) =>
        p.id !== product.id &&
        p.species.some((s) => product.species.includes(s)) &&
        p.category !== product.category,
    )
    .slice(0, 6);

  // Beneficios de suscripción dinámicos.
  const subscriptionBenefits = [
    "Envío automático antes que se acabe",
    sub.savings > 0
      ? `Ahorras ${formatCLP(sub.savings)} por saco`
      : "Precio preferente en cada entrega",
    "Modifica o cancela con un click",
  ];

  function showAddedToast(subscribed: boolean) {
    const canOfferAssign =
      isFood && activePet && activePet.currentFoodId !== product.id;
    if (canOfferAssign && !subscribed) {
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
        title: subscribed ? "Suscripción iniciada" : "Agregado al carrito",
        description: `${product.brand.name} · ${product.name}`,
        variant: "success",
        action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
      });
    }
  }

  function addSubscribed() {
    addItem(
      { ...product, variantId: currentVariantId, price: currentPrice, stock: currentStock },
      { quantity: qty, subscriptionWeeks: sub.frequency },
    );
    showAddedToast(true);
  }

  function addSingle() {
    addItem(
      { ...product, variantId: currentVariantId, price: currentPrice, stock: currentStock },
      { quantity: qty },
    );
    showAddedToast(false);
  }

  const specs: { label: string; value: string }[] = [];
  if (ration) specs.push({ label: "Ración diaria", value: `~${ration} g` });
  if (duration)
    specs.push({
      label: `Le dura a ${activePet?.name ?? "tu mascota"}`,
      value: `~${pluralize(duration, "día")}`,
    });

  return (
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
          {/* Galería */}
          <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-gradient-to-b from-canvas to-subtle lg:aspect-square">
            <ProductImage
              image={product.imageUrl}
              alt={`${product.brand.name} ${product.name}`}
              imgClassName="p-10"
              emojiClassName="text-[9rem] drop-shadow-[0_20px_28px_rgba(42,39,34,0.14)]"
            />
          </div>

          {/* Caja de compra */}
          <Stack gap={4}>
            {/* Encabezado */}
            <Stack gap={2}>
              <span className="overline text-text-secondary">{product.brand.name}</span>
              <h1 className="heading-1 text-text-primary">{product.name}</h1>
            </Stack>

            {/* Tags: etapa de vida */}
            {(product.stage?.length || product.species?.length) && (
              <Row gap={2} wrap>
                {product.stage?.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border-default bg-subtle px-3 py-0.5 text-xs text-text-secondary"
                  >
                    {s}
                  </span>
                ))}
                {product.species?.length === 1 && (
                  <span className="rounded-full border border-border-default bg-subtle px-3 py-0.5 text-xs text-text-secondary capitalize">
                    {product.species[0]}
                  </span>
                )}
              </Row>
            )}

            {/* Descripción */}
            {product.description ? (
              <p className="body-m text-text-secondary">{product.description}</p>
            ) : (
              isFood && (
                <p className="body-m text-text-secondary">
                  {product.name} de {product.brand.name}. Una fórmula pensada para acompañar a{" "}
                  {activePet?.name ?? "tu mascota"} en su día a día.
                </p>
              )
            )}

            {/* Specs de valor (cuando hay perfil de mascota) */}
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

            {/* Invitación contextual */}
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

            {/* ── Selector de tamaño ───────────────────────────── */}
            {product.variants && product.variants.length > 1 && (
              <Stack gap={2}>
                <p className="text-sm font-semibold text-text-primary">Selecciona el tamaño:</p>
                <Row gap={2} wrap>
                  {product.variants.map((v) => (
                    <button
                      key={v.variantId}
                      onClick={() => setSelectedVariantId(v.variantId)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                        selectedVariantId === v.variantId
                          ? "border-[1.5px] border-miel-500 text-miel-700 bg-transparent"
                          : "border border-border-default text-text-secondary hover:border-miel-300 hover:text-miel-600 bg-transparent",
                      )}
                    >
                      {v.title}
                    </button>
                  ))}
                </Row>
              </Stack>
            )}

            {/* ── Sección de compra ────────────────────────────── */}
            {product.subscribable ? (
              <Stack gap={3}>
                {/* Tarjeta de suscripción */}
                <div className="relative rounded-[var(--radius-lg)] border-[1.5px] border-miel-500 bg-surface p-5 pt-7">
                  {/* Badge flotante */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="rounded-full bg-miel-500 px-3 py-1 text-[11px] font-semibold text-white">
                      Recomendado: Suscripción
                    </span>
                  </div>

                  {/* Encabezado del plan */}
                  <div className="flex items-center justify-between gap-2">
                    <Row gap={2} align="center">
                      <CalendarClock className="size-5 shrink-0 text-miel-600" aria-hidden />
                      <span className="font-semibold text-text-primary">Plan Manada</span>
                    </Row>
                    <span className="price text-xl text-miel-600">
                      {formatCLP(sub.subscribedPrice)}
                    </span>
                  </div>

                  {/* Beneficios */}
                  <ul className="mt-3 space-y-1.5">
                    {subscriptionBenefits.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 text-sm text-text-secondary"
                      >
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-miel-600"
                          aria-hidden
                        />
                        {b}
                      </li>
                    ))}
                  </ul>

                  {/* CTA principal */}
                  <Button
                    size="lg"
                    block
                    onClick={addSubscribed}
                    disabled={soldOut}
                    className="mt-4"
                  >
                    {soldOut
                      ? "Sin stock por ahora"
                      : `Suscribirme (Ahorra ${sub.discountPct}%)`}
                  </Button>
                </div>

                {/* Compra única (secundaria) */}
                <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border-default bg-surface px-4 py-3">
                  <div>
                    <p className="text-xs text-text-secondary">Compra única</p>
                    <p className="price text-lg text-text-primary">
                      {formatCLP(currentPrice.current)}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addSingle}
                    disabled={soldOut}
                  >
                    Agregar al carrito
                  </Button>
                </div>
              </Stack>
            ) : (
              /* Para productos sin suscripción: UI estándar */
              <Stack gap={3}>
                <Separator />
                <div className="flex items-center gap-2">
                  <Price now={currentPrice.current} was={currentPrice.compareAt} size="xl" />
                  <StockBadge stock={currentStock} />
                </div>
                <Row gap={3} align="stretch">
                  {!soldOut && (
                    <QuantitySelector
                      value={qty}
                      onChange={setQty}
                      min={1}
                      max={Math.min(currentStock, 10)}
                    />
                  )}
                  <Button size="lg" block onClick={addSingle} disabled={soldOut}>
                    {soldOut ? "Sin stock por ahora" : "Agregar al carrito"}
                  </Button>
                </Row>
              </Stack>
            )}

            <ShippingPolicyNote policy={policy} size="md" />

            <Row gap={2} className="gap-2 text-[13px] text-text-secondary">
              <Truck className="size-4 text-text-brand" aria-hidden />
              Devolución sin costo si no le gusta a {activePet?.name ?? "tu mascota"}.
            </Row>

            {/* Reaseguro (sin permanencia) — solo si hay suscripción */}
            {product.subscribable && (
              <p className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
                <ShieldCheck className="size-4 text-[var(--success)]" aria-hidden />
                Sin permanencia: pausa o cancela cuando quieras, sin costo.
              </p>
            )}
          </Stack>
        </div>

        {/* Detalle en pestañas */}
        <Tabs defaultValue="descripcion" className="mt-2">
          <TabsList>
            <TabsTrigger value="descripcion">Descripción</TabsTrigger>
            <TabsTrigger value="detalle">Ficha técnica</TabsTrigger>
          </TabsList>

          <TabsContent value="descripcion">
            <p className="body-m max-w-2xl text-text-secondary">
              {product.description ??
                `${product.name} de ${product.brand.name}. Una fórmula pensada para acompañar a ${activePet?.name ?? "tu mascota"} en su día a día. Te avisamos antes de que se acabe para que nunca le falte.`}
            </p>
          </TabsContent>

          <TabsContent value="detalle">
            <dl className="grid max-w-md grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt className="text-text-secondary">Marca</dt>
              <dd className="text-text-primary">{product.brand.name}</dd>
              <dt className="text-text-secondary">Formato</dt>
              <dd className="text-text-primary">{currentFormat ?? "—"}</dd>
              <dt className="text-text-secondary">Para</dt>
              <dd className="text-text-primary">{product.species.join(", ")}</dd>
              {product.stage && (
                <>
                  <dt className="text-text-secondary">Etapa</dt>
                  <dd className="text-text-primary">{product.stage.join(", ")}</dd>
                </>
              )}
            </dl>
          </TabsContent>
        </Tabs>

        {/* Cross-sell único (U052) */}
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
