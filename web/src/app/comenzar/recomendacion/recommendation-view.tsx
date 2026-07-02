"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Utensils, CalendarClock, Coins, ShieldCheck, ArrowRight } from "lucide-react";
import { FunnelShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { SubscriptionBox } from "@/components/commerce/subscription-box";
import { HonestShippingBlock } from "@/components/commerce/honest-shipping-block";
import { ProductRail } from "@/components/commerce/product-rail";
import { usePet, useCart } from "@/components/providers";
import { useSubscription } from "@/hooks/use-subscription";
import { recommendFood, recommendComplements, foodPlan } from "@/lib/recommend";
import { formatCLP, formatDeliveryDate, pluralize } from "@/lib/format";
import { DEMO_SHIPPING } from "@/lib/demo-data";

const STAGE_LABEL: Record<string, string> = { cachorro: "cachorro", adulto: "adulto", senior: "senior" };
const FALLBACK_PRODUCT = { price: { current: 0 }, subscriptionDiscount: undefined };

/**
 * Recomendación tras crear el perfil — el "se adelantó por mí" (UX.md §5).
 * No muestra un producto a secas: explica POR QUÉ ese alimento, CUÁNTO come al
 * día, CUÁNTO le dura y CUÁNDO reponerlo (motor de `lib/recommend`). La cuenta
 * se pide en el siguiente paso (registro "valor primero").
 */
export function RecommendationView() {
  const router = useRouter();
  const { activePet } = usePet();
  const { addItem } = useCart();

  const food = useMemo(() => (activePet ? recommendFood(activePet) : undefined), [activePet]);
  const plan = useMemo(() => (activePet && food ? foodPlan(activePet, food) : undefined), [activePet, food]);
  const complements = useMemo(() => (activePet ? recommendComplements(activePet) : []), [activePet]);
  const sub = useSubscription(food ?? FALLBACK_PRODUCT);

  // Sin mascota (entrada directa a la URL) → al alta.
  useEffect(() => {
    if (!activePet) router.replace("/comenzar");
  }, [activePet, router]);
  if (!activePet) return null;

  const shipping = { ...DEMO_SHIPPING, comuna: "tu comuna" };

  function addToOrder() {
    if (!food) return;
    addItem(food, { quantity: 1, subscriptionWeeks: sub.isSubscribed ? sub.frequency : undefined });
    router.push("/crear-cuenta");
  }

  // Catálogo demo sin alimento para esta especie (p. ej. "otro"): igual celebramos.
  if (!food) {
    return (
      <FunnelShell exitHref="/">
        <Section spacing="lg">
          <Stack gap={5} align="center" className="mx-auto max-w-xl text-center">
            <span className="text-5xl" aria-hidden>🐾</span>
            <h1 className="heading-1 text-text-primary">¡Listo! Ya conocemos a {activePet.name}</h1>
            <p className="body-l text-text-secondary">
              Aún no tenemos un alimento ideal para su especie en el catálogo, pero ya guardamos su
              perfil y te avisaremos cuando lleguen novedades para {activePet.name}.
            </p>
            <Button size="lg" asChild>
              <Link href="/crear-cuenta">Guardar su perfil y crear mi cuenta</Link>
            </Button>
          </Stack>
        </Section>
      </FunnelShell>
    );
  }

  const stageTxt = STAGE_LABEL[activePet.stage] ?? "su etapa";
  const reason = `Es ${food.brand.name} ${food.name}: una fórmula para ${activePet.species} ${stageTxt}${
    activePet.weightKg ? `, en el formato que mejor le rinde a sus ${activePet.weightKg} kg` : ""
  }. La elegimos por su perfil, no por inventario.`;

  return (
    <FunnelShell exitHref="/">
      <Section spacing="md">
        <Stack gap={8}>
          {/* Encabezado del momento mágico */}
          <Stack gap={2} className="max-w-2xl">
            <span className="overline inline-flex items-center gap-1.5 text-text-brand">
              <Sparkles className="size-3.5" aria-hidden /> Hecho para {activePet.name}
            </span>
            <h1 className="display-l text-text-primary">
              Listo, ya sabemos qué darle a <span className="pet-name">{activePet.name}</span>
            </h1>
            <p className="body-l text-text-secondary">
              Con lo que nos contaste, esta es la comida que mejor le calza. Mira cuánto le dura y
              cuándo se la repondríamos.
            </p>
          </Stack>

          {/* Recomendación principal */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Packshot (placeholder cálido — foto real = Polish U090) */}
            <div className="grid aspect-square place-items-center rounded-[var(--radius-xl)] border border-border-default bg-gradient-to-b from-canvas to-subtle">
              <span className="text-[9rem] drop-shadow-[0_20px_28px_rgba(42,39,34,0.14)]" aria-hidden>
                {food.imageUrl ?? "📦"}
              </span>
            </div>

            <Stack gap={4}>
              <Stack gap={2}>
                <span className="overline text-text-secondary">{food.brand.name}</span>
                <h2 className="heading-1 text-text-primary">{food.name}</h2>
                {food.rating && <Rating value={food.rating.value} count={food.rating.count} />}
              </Stack>

              <Price now={food.price.current} was={food.price.compareAt} size="xl" />

              {/* Por qué se lo recomendamos (transparencia = confianza) */}
              <div className="flex gap-3 rounded-[var(--radius-lg)] border border-miel-200 bg-accent-soft p-4">
                <Sparkles className="size-5 shrink-0 text-miel-700" aria-hidden />
                <p className="text-sm text-text-primary">{reason}</p>
              </div>

              {/* Specs de valor: cuánto come, cuánto dura, $/kg */}
              {plan && (
                <Grid cols={1} sm={3} gap={3}>
                  <Spec icon={<Utensils className="size-4" aria-hidden />} value={`~${plan.rationGrams} g`} label="Come al día" />
                  <Spec icon={<CalendarClock className="size-4" aria-hidden />} value={`~${pluralize(plan.estimate.daysLeft, "día")}`} label={`Le dura a ${activePet.name}`} />
                  {plan.pricePerKg && <Spec icon={<Coins className="size-4" aria-hidden />} value={formatCLP(plan.pricePerKg)} label="Precio por kilo" />}
                </Grid>
              )}

              {/* Anticipación: cuándo reponer */}
              {plan && (
                <Row gap={2} className="rounded-[var(--radius-md)] bg-brand-soft px-4 py-3 text-sm text-text-primary">
                  <CalendarClock className="size-4 shrink-0 text-text-brand" aria-hidden />
                  <span>
                    Se le acabaría <strong>{formatDeliveryDate(plan.estimate.runOutDate)}</strong>. Te
                    avisaremos antes para que a {activePet.name} nunca le falte.
                  </span>
                </Row>
              )}

              {/* Suscripción (margen recurrente) con reaseguro */}
              {food.subscribable && (
                <Stack gap={2}>
                  <SubscriptionBox product={food} controller={sub} />
                  <p className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
                    <ShieldCheck className="size-4 text-[var(--success)]" aria-hidden />
                    Sin permanencia: pausa o cancela cuando quieras, sin costo.
                  </p>
                </Stack>
              )}

              <Button
                size="lg"
                block
                onClick={addToOrder}
                trailingIcon={<ArrowRight className="size-4" aria-hidden />}
              >
                {sub.isSubscribed ? "Suscribir y armar mi pedido" : "Agregar a mi primer pedido"}
              </Button>

              <HonestShippingBlock date={shipping.date} cost={shipping.cost} comuna={shipping.comuna} size="md" />
            </Stack>
          </div>

          {/* Complementos de cuidado */}
          {complements.length > 0 && (
            <ProductRail
              overline="Para completar su cuidado"
              title={`También podría servirle a ${activePet.name}`}
              products={complements}
              shipping={shipping}
            />
          )}
        </Stack>
      </Section>
    </FunnelShell>
  );
}

/** Mini-spec de valor (ración, duración, $/kg). */
function Spec({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-default bg-surface px-4 py-3">
      <span className="inline-flex items-center gap-1.5 text-text-brand">{icon}</span>
      <p className="price mt-1 text-lg text-text-primary">{value}</p>
      <p className="text-[13px] text-text-secondary">{label}</p>
    </div>
  );
}
