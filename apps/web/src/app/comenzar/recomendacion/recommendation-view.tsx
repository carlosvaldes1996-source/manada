"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  BellRing,
  Check,
  Search,
  Store,
  Repeat,
  RotateCcw,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { FunnelShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { ProductImage } from "@/components/commerce/product-image";
import { PetAvatar } from "@/components/pet/pet-avatar";
import { usePet, useCart, useSession } from "@/components/providers";
import { fade, fadeInUp } from "@/lib/motion";
import { trackRecommendationShown, trackSubscription } from "@/lib/analytics";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import {
  recommendFoodRanked,
  recommendFoodAlternatives,
  foodPlan,
  foodReasons,
  alternativeAngle,
  pricePerKg,
  type FoodPlan,
} from "@/lib/recommend";
import { formatCLP, formatDeliveryDate, pluralize } from "@/lib/format";

/** Entrada a la tienda que preserva el journey (nunca la landing — FUNNEL_TARGET §1.5). */
const STORE_HREF = "/categoria/todo";

/** De qué comida está hecho el plan que se muestra:
 *  - `recommended` — la que elegiríamos o una alternativa que el usuario prefirió (la COMPRA).
 *  - `owned` — su marca de siempre (declaró "ya come otra marca"): ya la tiene en casa, así
 *    que el plan se GUARDA (no se agrega al carrito). Misma anticipación, otra forma válida
 *    de completar el journey (FUNNEL_TARGET §1.5, puerta de lealtad de marca). */
type PlanMode = "recommended" | "owned";

/**
 * Recomendación consultiva — "El plan de {mascota}" (Funnel F4, FUNNEL_TARGET §1.5).
 *
 * REDISEÑO 2026-07-12 (2ª iteración): el onboarding ya convenció → esta pantalla NO persuade,
 * solo se decide. Principio operativo: "¿esto ayuda a decidir AHORA o puede aparecer después?".
 * En desktop la altura se convierte en ancho con dos columnas ("decidir" | "el valor"); las
 * razones viven bajo demanda; la anticipación se comprime a ~2 líneas sin perder su lugar
 * reservado (ahí crecerá la suscripción). Cuatro salidas de primer nivel (§1.5):
 *  1. Me gusta → "Sumar al pedido" (primary).
 *  2. No me convence → "Ver otras opciones (N)" → Sheet.
 *  3. Seguir mirando → "Seguir en la tienda".
 *  4. Ya come otra marca → Sheet buscador (search + exploración): su marca REARMA el plan
 *     (mismos cálculos, misma anticipación) y se GUARDA sin empujar el cambio.
 *
 * Catálogo REAL (Store API, O5): sumar/guardar registra qué come (`assignFood`, seam B6) →
 * enciende su anticipación real. Límite honesto D29: recordatorio, no cobro ni envío recurrente.
 */
export function RecommendationView({ products }: { products: Product[] }) {
  const router = useRouter();
  const { activePet, assignFood } = usePet();
  const { addItem } = useCart();
  const { toast } = useToast();
  const reduced = usePrefersReducedMotion();
  // Con sesión (alta de 2ª mascota): el pedido va directo al carrito, sin pasar
  // por el registro "valor primero" (que es solo para visitantes).
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  // Alimentos ELEGIBLES (ranking) para la recomendada y sus alternativas.
  const ranked = useMemo(
    () => (activePet ? recommendFoodRanked(activePet, products) : []),
    [activePet, products],
  );
  const recommended = ranked[0];
  // TODOS los alimentos de su especie: la "otra marca" que ya come puede no ser
  // elegible (p. ej. no declara su etapa) y aun así es su realidad — la aceptamos.
  const speciesFoods = useMemo(
    () =>
      activePet
        ? products.filter((p) => p.category === "alimento" && p.species.includes(activePet.species))
        : [],
    [activePet, products],
  );

  // La comida del plan: por defecto la que elegiríamos; el usuario puede rearmarla
  // eligiendo una alternativa (recommended) o su marca de siempre (owned).
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [planMode, setPlanMode] = useState<PlanMode>("recommended");
  const [brandOpen, setBrandOpen] = useState(false);

  const food = useMemo(
    () => speciesFoods.find((f) => f.id === selectedId) ?? recommended,
    [speciesFoods, selectedId, recommended],
  );
  const isRecommended = Boolean(food && recommended && food.id === recommended.id);
  const isOwned = planMode === "owned";

  const plan = useMemo(
    () => (activePet && food ? foodPlan(activePet, food) : undefined),
    [activePet, food],
  );
  // Razones "por qué esta" — solo las cualitativas: la ración vive en la línea de
  // valor, así que la sacamos de aquí para no repetir el mismo número (síntesis).
  const whyReasons = useMemo(
    () =>
      activePet && food
        ? foodReasons(activePet, food).filter((r) => !r.includes("g/día") && !r.includes("kcal/día"))
        : [],
    [activePet, food],
  );
  const alternatives = useMemo(
    () => (activePet && food ? recommendFoodAlternatives(activePet, products, food, 3) : []),
    [activePet, products, food],
  );

  // Sin mascota (entrada directa a la URL) → al alta.
  useEffect(() => {
    if (!activePet) router.replace("/comenzar");
  }, [activePet, router]);

  // Momento "aha" del embudo: se mostró la recomendación (una vez por producto
  // recomendado, para no re-disparar al re-render).
  const shownRef = useRef<string | null>(null);
  useEffect(() => {
    if (activePet && recommended && shownRef.current !== recommended.id) {
      shownRef.current = recommended.id;
      trackRecommendationShown(activePet, recommended);
    }
  }, [activePet, recommended]);

  if (!activePet) return null;

  // Salir sin descartar el journey: tienda (invitado) o sus mascotas (con sesión).
  // NUNCA la landing (FUNNEL_TARGET §1.5, principio 4).
  const exitHref = isAuthed ? "/cuenta/mascotas" : STORE_HREF;
  const weightEstimated = Boolean(activePet.weightSource && activePet.weightSource !== "exacto");

  /** Elegir una alternativa igual de válida (la COMPRA): rearma el plan. */
  function chooseAlternative(id: string) {
    setSelectedId(id);
    setPlanMode("recommended");
  }

  /** Elegir la marca que ya come (la TIENE): rearma el plan en modo "owned" y cierra. */
  function chooseOwnedFood(id: string) {
    setSelectedId(id);
    setPlanMode("owned");
    setBrandOpen(false);
  }

  /** Volver a la que elegiríamos (deshace una elección propia). */
  function resetToRecommended() {
    setSelectedId(undefined);
    setPlanMode("recommended");
  }

  /** Me gusta / reponer: sumar la comida mostrada al pedido real + aprender qué come. */
  function addToOrder() {
    if (!food) return;
    addItem(food, { quantity: 1 });
    assignFood(activePet!.id, food.id);
    router.push(isAuthed ? "/carrito" : "/crear-cuenta");
  }

  /** Ya la tiene en casa: guardar su plan (asigna current_food) sin tocar el carrito. */
  function savePlan() {
    if (!food) return;
    assignFood(activePet!.id, food.id);
    toast({
      title: `Guardamos el plan de ${activePet!.name}`,
      description: "Te avisaremos antes de que se le acabe, sea la marca que sea.",
      variant: "success",
    });
    router.push(exitHref);
  }

  // Catálogo sin alimento para esta especie (p. ej. "otro"): igual celebramos.
  if (!food) {
    return (
      <FunnelShell exitHref={exitHref}>
        <Section spacing="lg">
          <Stack gap={5} align="center" className="mx-auto max-w-xl text-center">
            <PetAvatar pet={activePet} size="xl" />
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

  // Hasta 2 alternativas lado a lado con la destacada — no una lista larga.
  const sideAlternatives = alternatives.slice(0, 2);

  return (
    <FunnelShell exitHref={exitHref}>
      <Section spacing="sm">
        <motion.div
          variants={reduced ? fade : fadeInUp}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-2xl"
        >
          <Stack gap={5}>
            {/* Cierre del onboarding: check + "plan listo", con la ración como prueba concreta. */}
            <Stack gap={1} align="center" className="text-center">
              <span className="grid size-10 place-items-center rounded-full bg-success-soft text-success-strong">
                <Check className="size-5" aria-hidden />
              </span>
              <h1 className="display-l text-text-primary">
                ¡Plan listo para <span className="pet-name">{activePet.name}</span>!
              </h1>
              {plan && (
                <p className="body-m text-text-secondary">
                  Según su perfil, necesita{" "}
                  <strong className="text-text-primary">{plan.rationGrams}g</strong> al día
                  {weightEstimated && " (estimado)"}
                </p>
              )}
            </Stack>

            {/* Tarjeta destacada */}
            <FeaturedFoodCard
              key={food.id}
              petName={activePet.name}
              food={food}
              plan={plan}
              isRecommended={isRecommended}
              isOwned={isOwned}
              weightEstimated={weightEstimated}
              reasons={whyReasons}
              onResetToRecommended={resetToRecommended}
              onAddToOrder={addToOrder}
              onSavePlan={savePlan}
            />

            {/* Alternativas: lista vertical compacta */}
            {sideAlternatives.length > 0 && (
              <Stack gap={3}>
                {sideAlternatives.map((alt) => (
                  <AltCard
                    key={alt.id}
                    product={alt}
                    angle={alternativeAngle(alt, food, activePet)}
                    petName={activePet.name}
                    onChoose={() => chooseAlternative(alt.id)}
                  />
                ))}
              </Stack>
            )}

            {/* Salidas de segundo nivel */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="ghost" block asChild>
                <Link href={STORE_HREF}>
                  <Store className="size-4" aria-hidden /> Seguir en la tienda
                </Link>
              </Button>
              <Button
                variant="ghost"
                block
                onClick={() => setBrandOpen(true)}
                leadingIcon={<Search className="size-4" aria-hidden />}
              >
                {activePet.name} ya come otra marca
              </Button>
            </div>
          </Stack>
        </motion.div>
      </Section>

      {/* Sheet "ya come otra marca": buscador inteligente — su marca rearma y guarda el plan */}
      <BrandFoodSheet
        open={brandOpen}
        onOpenChange={setBrandOpen}
        petName={activePet.name}
        foods={speciesFoods}
        currentId={food.id}
        onChoose={chooseOwnedFood}
      />
    </FunnelShell>
  );
}

/* ------------------------------- Tarjeta destacada ------------------------------- */

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
 * Tarjeta destacada — la comida elegida (recomendada, otra elegida, o la que ya tiene)
 * con su ración y el CTA principal. "Suscribirme a este" es visualmente una suscripción
 * pero por dentro es el mismo recordatorio de siempre (D29: nunca cobro ni envío
 * recurrente) — el aviso real de qué implica vive junto al botón cuando se confirma.
 * Sumar el pedido real (comprar ahora) queda como salida secundaria, sin desaparecer.
 */
function FeaturedFoodCard({
  petName,
  food,
  plan,
  isRecommended,
  isOwned,
  weightEstimated,
  reasons,
  onResetToRecommended,
  onAddToOrder,
  onSavePlan,
}: {
  petName: string;
  food: Product;
  plan?: FoodPlan;
  isRecommended: boolean;
  isOwned: boolean;
  weightEstimated: boolean;
  reasons: string[];
  onResetToRecommended: () => void;
  onAddToOrder: () => void;
  onSavePlan: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [leadDays, setLeadDays] = useState(5);

  /** "Suscribirme" = confirmar el recordatorio (proxy de intención de recompra, D29). */
  function confirmReminder() {
    setConfirmed(true);
    trackSubscription(food, "reminder");
  }

  const compareAt = food.price.compareAt;
  const savingsPct =
    compareAt && compareAt > food.price.current
      ? Math.round((1 - food.price.current / compareAt) * 100)
      : undefined;
  const reminderDate = plan ? minusDays(plan.estimate.runOutDate, leadDays) : undefined;

  // Días que dura el saco y frecuencia de envío sugerida (con 3 días de margen).
  const daysLeft = plan?.estimate.daysLeft;
  const sendEvery = daysLeft ? Math.max(daysLeft - 3, 1) : undefined;
  const savingsAmt = compareAt && compareAt > food.price.current ? compareAt - food.price.current : undefined;

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border-2 border-terracota-300 bg-surface shadow-md">
      {/* Banda encabezado */}
      <div className="flex items-center justify-center gap-2 bg-terracota-400 px-5 py-2">
        {isOwned ? (
          <>
            <span className="overline text-white">La comida de {petName}</span>
            <button
              type="button"
              onClick={onResetToRecommended}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/80 underline-offset-2 hover:underline"
            >
              <RotateCcw className="size-3" aria-hidden /> ver la sugerida
            </button>
          </>
        ) : isRecommended ? (
          <span className="overline tracking-widest text-white">NUESTRA MEJOR RECOMENDACIÓN</span>
        ) : (
          <>
            <span className="overline text-white">Tu elección para {petName}</span>
            <button
              type="button"
              onClick={onResetToRecommended}
              className="text-[12px] font-semibold text-white/80 underline-offset-2 hover:underline"
            >
              ver la sugerida
            </button>
          </>
        )}
      </div>

      {/* Cuerpo: imagen | info | precio+CTA */}
      <div className="flex gap-4 p-5">
        {/* Imagen */}
        <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-gradient-to-b from-canvas to-subtle">
          <ProductImage
            image={food.imageUrl}
            alt={`${food.brand.name} ${food.name}`}
            className="p-2"
            emojiClassName="text-5xl"
          />
        </div>

        {/* Info central */}
        <div className="min-w-0 flex-1">
          <span className="overline text-text-secondary">{food.brand.name}</span>
          <h2 className="heading-3 text-text-primary">{food.name}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {food.format && (
              <span className="inline-flex items-center rounded-[var(--radius-pill)] border border-border-default px-2.5 py-0.5 text-[12px] font-semibold text-text-secondary">
                {food.format}
              </span>
            )}
            {daysLeft && (
              <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-terracota-100 px-2.5 py-0.5 text-[12px] font-semibold text-terracota-700">
                Dura {daysLeft} días
              </span>
            )}
          </div>
          {daysLeft && sendEvery && !isOwned && (
            <p className="mt-2 text-[13px] leading-snug text-text-secondary">
              El saco le dura <strong className="text-text-primary">{daysLeft} días</strong> a {petName}. Te lo
              enviamos cada <strong className="text-text-primary">{sendEvery} días</strong> para que nunca le falte.
            </p>
          )}
          {weightEstimated && (
            <p className="mt-1 text-[12px] text-text-muted">Estimado con su peso aproximado.</p>
          )}
          {!isOwned && reasons.length > 0 && <WhyDisclosure petName={petName} reasons={reasons} />}
        </div>

        {/* Columna precio + CTA */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {isOwned ? (
            <>
              <Price now={food.price.current} was={compareAt} size="lg" />
              <Button size="md" onClick={onSavePlan} trailingIcon={<Check className="size-4" aria-hidden />}>
                Guardar plan
              </Button>
              <button
                type="button"
                onClick={onAddToOrder}
                className="text-[13px] font-semibold text-text-brand underline-offset-4 hover:underline"
              >
                <Repeat className="mr-1 inline size-3.5" aria-hidden />
                o reponer ahora
              </button>
            </>
          ) : !plan ? (
            <>
              <Price now={food.price.current} was={compareAt} size="lg" />
              <Button size="md" onClick={onAddToOrder} trailingIcon={<ArrowRight className="size-4" aria-hidden />}>
                Sumar al pedido
              </Button>
            </>
          ) : confirmed ? (
            <>
              <div className="flex items-start gap-1.5 rounded-[var(--radius-md)] bg-accent-soft p-2.5 text-left">
                <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--success)]" aria-hidden />
                <p className="text-[13px] text-text-primary">
                  Te avisamos el{" "}
                  <strong>{formatDeliveryDate(reminderDate!)}</strong>.{" "}
                  <button
                    type="button"
                    onClick={() => setConfirmed(false)}
                    className="font-semibold text-text-brand underline-offset-4 hover:underline"
                  >
                    Cambiar
                  </button>
                </p>
              </div>
              <button
                type="button"
                onClick={onAddToOrder}
                className="text-[13px] font-semibold text-text-brand underline-offset-4 hover:underline"
              >
                <ArrowRight className="mr-1 inline size-3.5" aria-hidden />
                o sumar al pedido
              </button>
            </>
          ) : (
            <>
              {compareAt && compareAt > food.price.current && (
                <span className="text-sm text-text-muted line-through">{formatCLP(compareAt)}</span>
              )}
              <span className="price text-2xl font-bold text-terracota-500">{formatCLP(food.price.current)}</span>
              {savingsAmt && savingsPct !== undefined && (
                <Badge variant="success">
                  Ahorras {formatCLP(savingsAmt)} ({savingsPct}%)
                </Badge>
              )}
              <Button
                variant="subscribe"
                size="md"
                leadingIcon={<BellRing className="size-4" aria-hidden />}
                onClick={confirmReminder}
              >
                Suscribirme a este
              </Button>
              <Popover>
                <PopoverTrigger className="text-[12px] font-semibold text-text-secondary underline-offset-4 hover:text-text-brand hover:underline">
                  Ajustar aviso
                </PopoverTrigger>
                <PopoverContent className="w-auto">
                  <div className="flex flex-col gap-2">
                    <span className="caption text-text-secondary">Avisarme…</span>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Cuándo avisarte">
                      {LEAD_OPTIONS.map((opt) => (
                        <button
                          key={opt.days}
                          type="button"
                          aria-pressed={leadDays === opt.days}
                          onClick={() => setLeadDays(opt.days)}
                          className={
                            "rounded-[var(--radius-pill)] border px-3 py-1.5 text-[13px] font-semibold transition-colors " +
                            (leadDays === opt.days
                              ? "border-miel-500 bg-miel-100 text-neutral-800"
                              : "border-border-default text-text-secondary hover:bg-subtle")
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <button
                type="button"
                onClick={onAddToOrder}
                className="text-[13px] font-semibold text-text-brand underline-offset-4 hover:underline"
              >
                <ArrowRight className="mr-1 inline size-3.5" aria-hidden />
                o sumar al pedido
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Tarjeta lateral de una alternativa igual de válida (no de segunda): elegirla
 * promueve esa comida a destacada y rearma el plan completo.
 */
function AltCard({
  product,
  angle,
  petName,
  onChoose,
}: {
  product: Product;
  angle: string;
  petName: string;
  onChoose: () => void;
}) {
  const compareAt = product.price.compareAt;
  return (
    <div className="flex gap-4 rounded-[var(--radius-xl)] border border-border-default bg-surface p-4">
      {/* Imagen */}
      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-gradient-to-b from-canvas to-subtle">
        <ProductImage image={product.imageUrl} alt={product.name} className="p-1.5" emojiClassName="text-3xl" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <span className="overline text-text-secondary">{product.brand.name}</span>
        <p className="font-semibold leading-snug text-text-primary">{product.name}</p>
        <p className="mt-0.5 text-[13px] text-text-brand">{angle}</p>
        <button
          type="button"
          onClick={onChoose}
          className="mt-2 text-[13px] font-semibold text-text-secondary underline-offset-4 hover:text-text-brand hover:underline"
        >
          Elegir para {petName}
        </button>
      </div>

      {/* Precio */}
      <div className="flex shrink-0 flex-col items-end justify-center gap-0.5">
        {compareAt && compareAt > product.price.current && (
          <span className="text-sm text-text-muted line-through">{formatCLP(compareAt)}</span>
        )}
        <span className="price text-xl font-bold text-terracota-500">{formatCLP(product.price.current)}</span>
      </div>
    </div>
  );
}

/* ----------------------------------- Piezas ------------------------------------- */

/** "¿Por qué esta?" — razones cualitativas bajo demanda (no persuade por defecto). */
function WhyDisclosure({ petName, reasons }: { petName: string; reasons: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-text-secondary transition-colors hover:text-text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]"
      >
        <HelpCircle className="size-4" aria-hidden />
        ¿Por qué esta para {petName}?
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {reasons.map((r) => (
            <li key={r} className="flex items-start gap-2 text-[13px] text-text-secondary">
              <Check className="mt-0.5 size-3.5 shrink-0 text-text-brand" aria-hidden />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}



/** Búsqueda tolerante a acentos (mismo criterio que el buscador de razas/alimento). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Sheet "ya come otra marca" (salida 4): buscador inteligente = búsqueda + exploración.
 * Se enfoca solo al abrir, filtra en vivo mientras escribe y, sin texto, deja explorar el
 * catálogo completo (misma experiencia que buscar un alimento dentro de Manada). Elegir su
 * marca de siempre rearma el plan (mismos cálculos, misma anticipación) sin empujar el cambio
 * (FUNNEL_TARGET §1.5, puerta de lealtad). El copy de confianza vive aquí, donde importa.
 */
function BrandFoodSheet({
  open,
  onOpenChange,
  petName,
  foods,
  currentId,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petName: string;
  foods: Product[];
  currentId: string;
  onChoose: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const q = normalize(query.trim());
  const results = q
    ? foods.filter((p) => normalize(`${p.brand.name} ${p.name} ${p.format ?? ""}`).includes(q))
    : foods;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={`¿Qué come ${petName} hoy?`}
        description="Elige su marca de siempre — Manada lo cuida igual y te avisa cuándo reponer."
        onOpenAutoFocus={(e) => {
          // Buscador enfocado de inmediato (no el botón de cerrar): experiencia de "search".
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {foods.length === 0 ? (
          <p className="body-m text-text-secondary">
            Aún no tenemos alimento para su especie en el catálogo.{" "}
            <Link
              href={STORE_HREF}
              className="font-semibold text-text-brand underline-offset-4 hover:underline"
            >
              Explorar la tienda
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="sticky top-0 z-10 -mt-1 bg-surface pb-2 pt-1">
              <Input
                ref={inputRef}
                leading={<Search className="size-4" aria-hidden />}
                placeholder="Busca su marca (ej. Royal Canin)…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar alimento"
              />
            </div>

            <span className="overline text-text-secondary">
              {q ? pluralize(results.length, "resultado") : "Todo el catálogo"}
            </span>

            {results.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-text-secondary">Nada calza con “{query.trim()}”.</p>
                <Link
                  href={STORE_HREF}
                  className="mt-1 inline-block text-sm font-semibold text-text-brand underline-offset-4 hover:underline"
                >
                  Explorar la tienda
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {results.map((p) => {
                  const isCurrent = p.id === currentId;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border-default bg-surface p-3"
                    >
                      <span
                        className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-white text-2xl"
                        aria-hidden
                      >
                        <ProductImage image={p.imageUrl} alt={p.name} sizes="48px" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="overline text-text-secondary">{p.brand.name}</span>
                        <p className="truncate text-sm font-semibold text-text-primary">{p.name}</p>
                        {p.format && <span className="text-[13px] text-text-muted">{p.format}</span>}
                      </div>
                      <Button
                        size="sm"
                        variant={isCurrent ? "ghost" : "secondary"}
                        onClick={() => onChoose(p.id)}
                      >
                        {isCurrent ? "Elegida" : "Elegir"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
