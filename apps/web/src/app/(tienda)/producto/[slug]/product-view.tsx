"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, ShieldCheck, Truck } from "lucide-react";
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
  SubscriptionBox,
  ShippingPolicyNote,
  ProductImage,
  ProductRail,
  StockBadge,
} from "@/components/commerce";
import { PetAvatar } from "@/components/pet";
import { usePet, useCart } from "@/components/providers";
import { useSubscription } from "@/hooks/use-subscription";
import { dailyRationGrams } from "@/lib/anticipation";
import { formatCLP, pluralize } from "@/lib/format";
import { categoryLabel } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { ShippingPolicy } from "@/lib/medusa";
import type { Product } from "@/types";

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
export function ProductView({
  product,
  products,
  policy,
}: {
  product: Product;
  products: Product[];
  policy: ShippingPolicy;
}) {
  const { activePet, pets, assignFood } = usePet();
  const { addItem } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const sub = useSubscription(product);
  const [qty, setQty] = useState(1);
  // "¿Para quién?" (§1.3): con ≥2 mascotas el dueño elige antes de agregar.
  const [targetPetId, setTargetPetId] = useState<string | null>(null);

  const soldOut = product.stock <= 0;

  // Specs de valor (U044): ración diaria, duración del saco y precio por kilo.
  const bagKg = product.format && /kg/i.test(product.format) ? parseFloat(product.format) : undefined;
  const isFood = product.category === "alimento";
  // La mascota destino: la elegida (≥2) o la activa. Las specs recalculan por ella.
  const targetPet = pets.find((p) => p.id === targetPetId) ?? activePet;
  const ration = isFood && targetPet?.weightKg ? dailyRationGrams(targetPet.weightKg, targetPet.stage) : undefined;
  const duration = isFood && bagKg && ration ? Math.round((bagKg * 1000) / ration) : undefined;
  const pricePerKg = bagKg ? Math.round(product.price.current / bagKg) : undefined;

  const unitPrice = sub.isSubscribed ? sub.effectivePrice : product.price.current;

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
    addItem(product, {
      quantity: qty,
      subscriptionWeeks: sub.isSubscribed ? sub.frequency : undefined,
    });
    // Alimento + mascota → aprendemos qué come y encendemos la anticipación (§1.3).
    // El toast es donde el dueño entiende que Manada acaba de aprender algo suyo.
    if (isFood && targetPet) assignFood(targetPet.id, product.id);
    toast(
      isFood && targetPet
        ? {
            title: `Guardamos que ${targetPet.name} come esto`,
            description: "Te avisaremos antes de que se le acabe.",
            variant: "success",
            action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
          }
        : {
            title: sub.isSubscribed ? "Suscripción iniciada" : "Agregado al carrito",
            description: `${product.brand.name} · ${product.name}`,
            variant: "success",
            action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
          },
    );
  }

  const specs: { label: string; value: string }[] = [];
  if (ration) specs.push({ label: "Ración diaria", value: `~${ration} g` });
  if (duration) specs.push({ label: `Le dura a ${targetPet?.name ?? "tu mascota"}`, value: `~${pluralize(duration, "día")}` });
  if (pricePerKg) specs.push({ label: "Precio por kilo", value: formatCLP(pricePerKg) });
  if (specs.length === 0 && product.format) specs.push({ label: "Formato", value: product.format });

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
              cálido (dirección de arte real = Polish 3.4 / U090) */}
          <div className="grid aspect-square place-items-center overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-gradient-to-b from-canvas to-subtle">
            <ProductImage
              image={product.imageUrl}
              alt={`${product.brand.name} ${product.name}`}
              imgClassName="p-10"
              emojiClassName="text-[9rem] drop-shadow-[0_20px_28px_rgba(42,39,34,0.14)]"
            />
          </div>

          {/* Caja de compra */}
          <Stack gap={4}>
            <Stack gap={2}>
              <span className="overline text-text-secondary">{product.brand.name}</span>
              <h1 className="heading-1 text-text-primary">{product.name}</h1>
            </Stack>

            <Row gap={3} wrap>
              <Price now={unitPrice} was={product.price.compareAt} size="xl" />
              <StockBadge stock={product.stock} />
            </Row>

            {/* Módulo de specs de valor ARRIBA (U044/U096). Grid responsive:
                apila en móvil para no truncar las etiquetas. */}
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

            {/* Suscripción primero (U045) + reaseguro visible (U046) */}
            {product.subscribable && (
              <Stack gap={2}>
                <SubscriptionBox product={product} controller={sub} />
                <p className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
                  <ShieldCheck className="size-4 text-[var(--success)]" aria-hidden />
                  Sin permanencia: pausa o cancela cuando quieras, sin costo.
                </p>
              </Stack>
            )}

            {/* "¿Para quién?" (§1.3): con ≥2 mascotas se elige antes del CTA; las
                specs de arriba ya recalculan por la mascota seleccionada. */}
            {isFood && pets.length >= 2 && (
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-text-secondary">¿Para quién es?</span>
                <div className="flex flex-wrap gap-2">
                  {pets.map((p) => {
                    const selected = p.id === targetPet?.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTargetPetId(p.id)}
                        aria-pressed={selected}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-[var(--radius-pill)] border px-2.5 py-1.5 text-sm font-semibold transition-colors",
                          selected
                            ? "border-terracota-300 bg-brand-soft text-text-brand"
                            : "border-border-default bg-surface text-text-secondary hover:border-terracota-200",
                        )}
                      >
                        <PetAvatar pet={p} size="xs" />
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* CTA único (U045): cantidad + acción primaria */}
            <Row gap={3} align="stretch" className="gap-3">
              {!soldOut && (
                <QuantitySelector value={qty} onChange={setQty} min={1} max={Math.min(product.stock, 10)} />
              )}
              <Button
                size="lg"
                block
                onClick={add}
                disabled={soldOut}
                leadingIcon={sub.isSubscribed ? <RefreshCw className="size-4" aria-hidden /> : undefined}
              >
                {soldOut
                  ? "Sin stock por ahora"
                  : sub.isSubscribed
                    ? "Suscribir y agregar"
                    : isFood && targetPet
                      ? `Agregar para ${targetPet.name}`
                      : "Agregar al carrito"}
              </Button>
            </Row>

            <ShippingPolicyNote policy={policy} size="md" />

            <Row gap={2} className="gap-2 text-[13px] text-text-secondary">
              <Truck className="size-4 text-text-brand" aria-hidden />
              Devolución sin costo si no le gusta a {activePet?.name ?? "tu mascota"}.
            </Row>
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
              {product.name} de {product.brand.name}. Una fórmula pensada para acompañar a{" "}
              {activePet?.name ?? "tu mascota"} en su día a día. Te avisamos antes de que se acabe
              para que nunca le falte.
            </p>
          </TabsContent>

          <TabsContent value="detalle">
            <dl className="grid max-w-md grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt className="text-text-secondary">Marca</dt>
              <dd className="text-text-primary">{product.brand.name}</dd>
              <dt className="text-text-secondary">Formato</dt>
              <dd className="text-text-primary">{product.format ?? "—"}</dd>
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
