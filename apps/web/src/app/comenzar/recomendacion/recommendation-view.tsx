"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Utensils,
  CalendarClock,
  Coins,
  ArrowRight,
  BellRing,
  Check,
  ShieldCheck,
} from "lucide-react";
import { FunnelShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { ProductRail } from "@/components/commerce/product-rail";
import { usePet, useCart, useSession } from "@/components/providers";
import type { Product } from "@/types";
import {
  recommendFoodRanked,
  recommendFoodAlternatives,
  recommendComplements,
  foodPlan,
  foodReasons,
  alternativeAngle,
  pricePerKg,
  type FoodPlan,
} from "@/lib/recommend";
import { formatCLP, formatDeliveryDate, pluralize } from "@/lib/format";

/** Entrada a la tienda que preserva el journey (nunca la landing — FUNNEL_TARGET §1.5). */
const STORE_HREF = "/categoria/todo";

/**
 * Recomendación consultiva — "El plan de {mascota}" (Funnel F4, FUNNEL_TARGET §1.5).
 *
 * No vende una sola opción: asesora. Presenta la que elegiríamos (con 3 razones
 * atadas al perfil), **alternativas igual de válidas** que el usuario puede elegir
 * para rearmar el plan, una **puerta de lealtad de marca** (no forzamos el cambio)
 * y la **anticipación como propuesta central** (el sistema sabe cuándo se acaba;
 * el usuario solo confirma o ajusta). Límite honesto de D29: recordatorio, no
 * cobro ni envío recurrente. Corre sobre el catálogo REAL (Store API, O5): el
 * producto sumado tiene `variantId` y llena el carrito real; al sumar registramos
 * qué come la mascota (`assignFood`, seam de Pet Experience B6) → enciende su
 * anticipación en dashboard/perfil.
 */
export function RecommendationView({ products }: { products: Product[] }) {
  const router = useRouter();
  const { activePet, assignFood } = usePet();
  const { addItem } = useCart();
  // Con sesión (alta de 2ª mascota): el pedido va directo al carrito, sin pasar
  // por el registro "valor primero" (que es solo para visitantes).
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  const foods = useMemo(
    () => (activePet ? recommendFoodRanked(activePet, products) : []),
    [activePet, products],
  );
  const recommended = foods[0];
  // El usuario puede rearmar el plan eligiendo una alternativa; por defecto = la
  // que elegiríamos. Si el id queda huérfano (cambió la mascota) cae a la recomendada.
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const food = useMemo(
    () => foods.find((f) => f.id === selectedId) ?? recommended,
    [foods, selectedId, recommended],
  );
  const isRecommended = Boolean(food && recommended && food.id === recommended.id);

  const plan = useMemo(
    () => (activePet && food ? foodPlan(activePet, food) : undefined),
    [activePet, food],
  );
  const reasons = useMemo(
    () => (activePet && food ? foodReasons(activePet, food) : []),
    [activePet, food],
  );
  const alternatives = useMemo(
    () => (activePet && food ? recommendFoodAlternatives(activePet, products, food, 3) : []),
    [activePet, products, food],
  );
  const complements = useMemo(
    () => (activePet ? recommendComplements(activePet, products).filter((p) => p.stock > 0) : []),
    [activePet, products],
  );

  // Sin mascota (entrada directa a la URL) → al alta.
  useEffect(() => {
    if (!activePet) router.replace("/comenzar");
  }, [activePet, router]);
  if (!activePet) return null;

  // Salir/perfil sin descartar el journey: tienda (invitado) o sus mascotas (con
  // sesión). NUNCA la landing (FUNNEL_TARGET §1.5, principio 4).
  const exitHref = isAuthed ? "/cuenta/mascotas" : STORE_HREF;
  const weightEstimated = Boolean(activePet.weightSource && activePet.weightSource !== "exacto");

  function addToOrder() {
    if (!food || !activePet) return;
    addItem(food, { quantity: 1 });
    // Manada aprende qué come la mascota (seam B6): llena "su alimento" en el
    // perfil y enciende la anticipación real en dashboard/perfil.
    assignFood(activePet.id, food.id);
    router.push(isAuthed ? "/carrito" : "/crear-cuenta");
  }

  // Catálogo sin alimento para esta especie (p. ej. "otro"): igual celebramos.
  if (!food) {
    return (
      <FunnelShell exitHref={exitHref}>
        <Section spacing="lg">
          <Stack gap={5} align="center" className="mx-auto max-w-xl text-center">
            <span className="text-5xl" aria-hidden>🐾</span>
            <h1 className="heading-1 text-text-primary">Ya conocemos a {activePet.name}</h1>
            <p className="body-l text-text-secondary">
              Aún no tenemos un alimento ideal para su especie en el catálogo, pero su perfil ya
              vive en Manada: te avisaremos cuando lleguen novedades para {activePet.name}.
            </p>
            <Button size="lg" asChild>
              {isAuthed ? (
                <Link href="/cuenta/mascotas">Ir a su perfil</Link>
              ) : (
                <Link href={STORE_HREF}>Seguir viendo la tienda</Link>
              )}
            </Button>
          </Stack>
        </Section>
      </FunnelShell>
    );
  }

  return (
    <FunnelShell exitHref={exitHref}>
      <Section spacing="md">
        <Stack gap={8}>
          {/* Hero: el plan, no "la única comida" — asesor, no vendedor */}
          <Stack gap={2} className="max-w-2xl">
            <span className="overline inline-flex items-center gap-1.5 text-text-brand">
              <Sparkles className="size-3.5" aria-hidden /> Hecho para {activePet.name}
            </span>
            <h1 className="display-l text-text-primary">
              El plan de <span className="pet-name">{activePet.name}</span>
            </h1>
            <p className="body-l text-text-secondary">
              Esto es lo que le daríamos según lo que nos contaste — y también otras opciones igual
              de buenas. Tú decides; nosotros nos anticipamos a cuándo reponer.
            </p>
          </Stack>

          {/* Recomendación principal (elegible: cambiar a una alternativa rearma el plan) */}
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
                {isRecommended ? (
                  <Badge variant="brand" icon={<Sparkles className="size-3.5" aria-hidden />}>
                    La que elegiríamos para {activePet.name}
                  </Badge>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">Tu elección para {activePet.name}</Badge>
                    <button
                      type="button"
                      onClick={() => setSelectedId(recommended?.id)}
                      className="text-[13px] font-semibold text-text-brand underline-offset-4 hover:underline"
                    >
                      ver la que sugerimos ({recommended?.name})
                    </button>
                  </div>
                )}
                {food.rating && <Rating value={food.rating.value} count={food.rating.count} />}
              </Stack>

              <Price now={food.price.current} was={food.price.compareAt} size="xl" />

              {/* Por qué se la recomendamos: 3 razones atadas al perfil (transparencia) */}
              {reasons.length > 0 && (
                <div className="rounded-[var(--radius-lg)] border border-terracota-200 bg-brand-soft p-4">
                  <span className="overline inline-flex items-center gap-1.5 text-text-brand">
                    <Sparkles className="size-3.5" aria-hidden /> Por qué se la recomendamos
                  </span>
                  <ul className="mt-3 flex flex-col gap-2">
                    {reasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-text-brand" aria-hidden />
                        <span className="text-sm text-text-primary">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specs de valor: cuánto come, cuánto dura, $/kg */}
              {plan && (
                <Grid cols={1} sm={3} gap={3}>
                  <Spec icon={<Utensils className="size-4" aria-hidden />} value={`~${plan.rationGrams} g`} label="Come al día" />
                  <Spec icon={<CalendarClock className="size-4" aria-hidden />} value={`~${pluralize(plan.estimate.daysLeft, "día")}`} label={`Le dura a ${activePet.name}`} />
                  {plan.pricePerKg && <Spec icon={<Coins className="size-4" aria-hidden />} value={formatCLP(plan.pricePerKg)} label="Precio por kilo" />}
                </Grid>
              )}
              {weightEstimated && (
                <p className="text-[13px] text-text-secondary">
                  Estimado con el peso aproximado de {activePet.name} — cuando lo confirmes, afinamos
                  el plan.
                </p>
              )}

              {/* Anticipación: el corazón de la propuesta (confirmar/ajustar, no opt-in en frío) */}
              <AnticipationProposal key={food.id} petName={activePet.name} plan={plan} />

              {/* Salidas sin trampa: sumar (primario) · seguir mirando (secundario) */}
              <Stack gap={3}>
                <Button
                  size="lg"
                  block
                  onClick={addToOrder}
                  trailingIcon={<ArrowRight className="size-4" aria-hidden />}
                >
                  Sumar al pedido de {activePet.name}
                </Button>
                <Button variant="ghost" block asChild>
                  <Link href={STORE_HREF}>Seguir viendo la tienda</Link>
                </Button>
              </Stack>
            </Stack>
          </div>

          {/* Alternativas igual de válidas (no de segunda): elegir una rearma el plan */}
          {alternatives.length > 0 && (
            <Stack gap={4}>
              <Stack gap={1}>
                <span className="overline text-text-secondary">Y no es la única buena opción</span>
                <h2 className="heading-3 text-text-primary">
                  Otras opciones igual de válidas para {activePet.name}
                </h2>
              </Stack>
              <Stack gap={3}>
                {alternatives.map((alt) => (
                  <AltCard
                    key={alt.id}
                    product={alt}
                    angle={alternativeAngle(alt, food, activePet)}
                    isTopPick={alt.id === recommended?.id}
                    petName={activePet.name}
                    onChoose={() => setSelectedId(alt.id)}
                  />
                ))}
              </Stack>
            </Stack>
          )}

          {/* Puerta de lealtad de marca: no forzamos el cambio */}
          <div className="rounded-[var(--radius-xl)] border border-border-default bg-subtle p-6">
            <Row gap={3} align="start">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-text-brand" aria-hidden />
              <Stack gap={1}>
                <p className="font-semibold text-text-primary">
                  ¿Ya le das una marca que le hace bien?
                </p>
                <p className="text-sm text-text-secondary">
                  Mantenla. No hace falta cambiar de alimento para que Manada cuide a{" "}
                  {activePet.name}: guardamos su plan y te avisamos cuándo reponer, sea la marca que
                  sea.
                </p>
              </Stack>
            </Row>
          </div>

          {/* Complementos de cuidado */}
          {complements.length > 0 && (
            <ProductRail
              overline="Para completar su cuidado"
              title={`También podría servirle a ${activePet.name}`}
              products={complements}
            />
          )}
        </Stack>
      </Section>
    </FunnelShell>
  );
}

/** Días antes de que se acabe en que ofrecemos avisar (preferencia local). */
const LEAD_OPTIONS: { days: number; label: string }[] = [
  { days: 3, label: "3 días antes" },
  { days: 5, label: "5 días antes" },
  { days: 7, label: "1 semana antes" },
];

function minusDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

/**
 * Anticipación como propuesta central (FUNNEL_TARGET §1.5, principio 2). El sistema
 * ya sabe cuándo se acaba: propone la fecha del aviso; el usuario solo confirma o
 * ajusta. Límite honesto (D29): es un recordatorio para reponer de un toque, NUNCA
 * un cobro ni un envío recurrente.
 */
function AnticipationProposal({ petName, plan }: { petName: string; plan?: FoodPlan }) {
  const [confirmed, setConfirmed] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [leadDays, setLeadDays] = useState(5);

  // Sin peso no hay fecha: invitamos a completarlo (honesto, sin inventar).
  if (!plan) {
    return (
      <div className="rounded-[var(--radius-lg)] border-[1.5px] border-miel-400 bg-accent-soft p-4">
        <span className="overline inline-flex items-center gap-1.5 text-miel-700">
          <BellRing className="size-3.5" aria-hidden /> Nos anticipamos por {petName}
        </span>
        <p className="mt-2 text-sm text-text-primary">
          Cuéntanos su peso y calculamos exactamente cuándo se le acaba para avisarte a tiempo — sin
          apuros.
        </p>
      </div>
    );
  }

  const reminderDate = minusDays(plan.estimate.runOutDate, leadDays);

  return (
    <div className="rounded-[var(--radius-lg)] border-[1.5px] border-miel-400 bg-accent-soft p-4">
      <span className="overline inline-flex items-center gap-1.5 text-miel-700">
        <BellRing className="size-3.5" aria-hidden /> Nos anticipamos por {petName}
      </span>

      {confirmed ? (
        <div className="mt-2 flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-[var(--success)]" aria-hidden />
          <p className="text-sm text-text-primary">
            Listo. Te avisaremos alrededor del{" "}
            <strong className="font-semibold">{formatDeliveryDate(reminderDate)}</strong> para
            reponer, sin apuros.{" "}
            <button
              type="button"
              onClick={() => setConfirmed(false)}
              className="font-semibold text-text-brand underline-offset-4 hover:underline"
            >
              Cambiar
            </button>
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-text-primary">
            Le durará <strong className="font-semibold">~{pluralize(plan.estimate.daysLeft, "día")}</strong>.
            Te avisamos alrededor del{" "}
            <strong className="font-semibold">{formatDeliveryDate(reminderDate)}</strong> para
            reponer de un toque — sin cobros automáticos ni permanencia.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="subscribe"
              size="sm"
              leadingIcon={<Check className="size-4" aria-hidden />}
              onClick={() => setConfirmed(true)}
            >
              Confirmar recordatorio
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAdjusting((a) => !a)}>
              Ajustar cuándo
            </Button>
          </div>
          {adjusting && (
            <div
              className="mt-3 flex flex-wrap gap-2 border-t border-miel-200 pt-3"
              role="group"
              aria-label="Cuándo avisarte"
            >
              {LEAD_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  aria-pressed={leadDays === opt.days}
                  onClick={() => setLeadDays(opt.days)}
                  className={
                    "rounded-[var(--radius-pill)] border px-3 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] " +
                    (leadDays === opt.days
                      ? "border-miel-500 bg-miel-100 text-neutral-800"
                      : "border-border-default text-text-secondary hover:bg-subtle")
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
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

/**
 * Alternativa "igual de válida": marca + nombre + "mejor si…" + precio; elegirla
 * rearma el plan. Marca la recomendada cuando el usuario ya cambió de opción.
 */
function AltCard({
  product,
  angle,
  isTopPick,
  petName,
  onChoose,
}: {
  product: Product;
  angle: string;
  isTopPick: boolean;
  petName: string;
  onChoose: () => void;
}) {
  const perKg = pricePerKg(product);
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface p-4 sm:flex-row sm:items-center">
      <span className="grid size-14 shrink-0 place-items-center rounded-[var(--radius-md)] bg-subtle text-3xl" aria-hidden>
        {product.imageUrl ?? "📦"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="overline text-text-secondary">{product.brand.name}</span>
          {isTopPick && <Badge variant="brand">La que elegiríamos</Badge>}
        </div>
        <p className="font-semibold text-text-primary">{product.name}</p>
        <p className="mt-0.5 text-[13px] text-text-brand">{angle}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <Price now={product.price.current} size="sm" />
          {perKg && <span className="text-[13px] text-text-secondary">· {formatCLP(perKg)}/kg</span>}
        </div>
      </div>
      <Stack gap={2} className="shrink-0">
        <Button size="sm" variant="secondary" onClick={onChoose}>
          Elegir para {petName}
        </Button>
        <Button size="sm" variant="link" asChild>
          <Link href={`/producto/${product.slug}`}>Ver detalle</Link>
        </Button>
      </Stack>
    </div>
  );
}
