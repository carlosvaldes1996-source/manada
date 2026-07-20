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
  ChevronRight,
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
import type { Pet, Product } from "@/types";
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
  const [altOpen, setAltOpen] = useState(false);
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

  /** Elegir una alternativa igual de válida (la COMPRA): rearma el plan y cierra el sheet. */
  function chooseAlternative(id: string) {
    setSelectedId(id);
    setPlanMode("recommended");
    setAltOpen(false);
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

  return (
    <FunnelShell exitHref={exitHref}>
      <Section spacing="md">
        <motion.div
          variants={reduced ? fade : fadeInUp}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-4xl"
        >
          <Stack gap={6}>
            {/* Cierre del onboarding: no "paso 6" sino "listo". Sin párrafo: ya convenció. */}
            <Stack gap={2} align="center" className="text-center">
              <span className="overline inline-flex items-center gap-1.5 text-text-brand">
                <Sparkles className="size-3.5" aria-hidden /> El perfil de {activePet.name} está listo
              </span>
              <h1 className="display-l text-text-primary">
                El plan de <span className="pet-name">{activePet.name}</span>
              </h1>
            </Stack>

            {/* LA CARTA DE PLAN — dos columnas en desktop: "decidir" | "el valor".
                Convierte altura en ancho; el CTA queda arriba a la vista sin scroll. */}
            <div className="flex flex-col gap-6 rounded-[var(--radius-xl)] border border-border-default bg-surface p-6 shadow-sm lg:flex-row lg:gap-8 lg:p-8">
              {/* Columna A — decidir */}
              <Stack gap={4} className="min-w-0 flex-1">
                <Row gap={4} align="start">
                  <div className="relative grid size-[84px] shrink-0 place-items-center overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-white">
                    <ProductImage
                      image={food.imageUrl}
                      alt={`${food.brand.name} ${food.name}`}
                      sizes="84px"
                      emojiClassName="text-4xl"
                    />
                  </div>
                  <Stack gap={1} className="min-w-0 flex-1">
                    <span className="overline text-text-secondary">{food.brand.name}</span>
                    <h2 className="heading-3 text-text-primary">{food.name}</h2>
                    {food.rating && <Rating value={food.rating.value} count={food.rating.count} />}
                    <Price now={food.price.current} was={food.price.compareAt} size="lg" />
                  </Stack>
                </Row>

                {/* Etiqueta del plan, según de qué comida esté hecho */}
                <div className="flex flex-wrap items-center gap-2">
                  {isOwned ? (
                    <>
                      <Badge variant="neutral">La comida de {activePet.name}</Badge>
                      <button
                        type="button"
                        onClick={resetToRecommended}
                        className="inline-flex items-center gap-1 text-[13px] font-semibold text-text-brand underline-offset-4 hover:underline"
                      >
                        <RotateCcw className="size-3.5" aria-hidden /> ver la que sugerimos
                      </button>
                    </>
                  ) : isRecommended ? (
                    <Badge variant="brand" icon={<Sparkles className="size-3.5" aria-hidden />}>
                      La que elegiríamos para {activePet.name}
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="neutral">Tu elección para {activePet.name}</Badge>
                      <button
                        type="button"
                        onClick={resetToRecommended}
                        className="text-[13px] font-semibold text-text-brand underline-offset-4 hover:underline"
                      >
                        ver la que sugerimos
                      </button>
                    </>
                  )}
                </div>

                {/* Salidas 1 y 2: me gusta (primary) · no me convence (bajo demanda) */}
                <Stack gap={2} className="border-t border-border-default pt-4">
                  {isOwned ? (
                    <>
                      <Button
                        size="lg"
                        block
                        onClick={savePlan}
                        trailingIcon={<Check className="size-4" aria-hidden />}
                      >
                        Guardar el plan de {activePet.name}
                      </Button>
                      <button
                        type="button"
                        onClick={addToOrder}
                        className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-text-brand underline-offset-4 hover:underline"
                      >
                        <Repeat className="size-4" aria-hidden /> o reponerla ahora
                      </button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        block
                        onClick={addToOrder}
                        trailingIcon={<ArrowRight className="size-4" aria-hidden />}
                      >
                        Sumar al pedido de {activePet.name}
                      </Button>
                      {alternatives.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setAltOpen(true)}
                          className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-text-brand underline-offset-4 hover:underline"
                        >
                          ¿No te convence? Ver otras opciones ({alternatives.length})
                          <ChevronRight className="size-4" aria-hidden />
                        </button>
                      )}
                    </>
                  )}
                </Stack>

                {/* Razones bajo demanda: el onboarding ya convenció, no las mostramos por defecto */}
                {!isOwned && whyReasons.length > 0 && (
                  <WhyDisclosure petName={activePet.name} reasons={whyReasons} />
                )}
              </Stack>

              {/* Columna B — el valor: anticipación (reservada) + una línea de datos */}
              <Stack gap={3} className="lg:w-[320px] lg:shrink-0 lg:border-l lg:border-border-default lg:pl-8">
                <AnticipationProposal key={food.id} petName={activePet.name} plan={plan} food={food} />
                {plan && (
                  <p className="text-sm text-text-secondary">
                    Come <strong className="text-text-primary">~{plan.rationGrams} g</strong>/día
                    {plan.pricePerKg && (
                      <>
                        {" · rinde "}
                        <strong className="text-text-primary">{formatCLP(plan.pricePerKg)}</strong>/kg
                      </>
                    )}
                  </p>
                )}
                {weightEstimated && (
                  <p className="text-[13px] text-text-muted">
                    Estimado con su peso aproximado — al confirmarlo, afinamos el plan.
                  </p>
                )}
              </Stack>
            </div>

            {/* Salidas 3 y 4: seguir mirando · ya come otra marca — de primer nivel, no enterradas */}
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

      {/* Sheet "no me convence": alternativas igual de válidas, bajo demanda */}
      <AlternativesSheet
        open={altOpen}
        onOpenChange={setAltOpen}
        petName={activePet.name}
        alternatives={alternatives}
        chosen={food}
        pet={activePet}
        onChoose={chooseAlternative}
      />

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

/* --------------------------------- Anticipación --------------------------------- */

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
 * Módulo de anticipación — el corazón de la propuesta (FUNNEL_TARGET §1.5, principio 2),
 * comprimido a ~2 líneas pero con su lugar reservado: aquí crecerá la suscripción/recompra
 * recurrente post-tracción, sin rediseñar la pantalla. El sistema ya sabe cuándo se acaba;
 * el usuario solo confirma o ajusta (los días de aviso viven en un popover para no sumar
 * altura). Límite honesto (D29): recordatorio, nunca cobro ni envío recurrente.
 */
function AnticipationProposal({ petName, plan, food }: { petName: string; plan?: FoodPlan; food?: Product }) {
  const [confirmed, setConfirmed] = useState(false);
  const [leadDays, setLeadDays] = useState(5);

  /**
   * Confirmar el recordatorio = intención de recompra recurrente. Es el proxy
   * de "suscripción" del embudo mientras el moat recurrente sigue diferido (D29).
   */
  function confirm() {
    setConfirmed(true);
    if (food) trackSubscription(food, "reminder");
  }

  const eyebrow = (
    <span className="overline inline-flex items-center gap-1.5 text-miel-700">
      <BellRing className="size-3.5" aria-hidden /> Nos anticipamos por {petName}
    </span>
  );

  // Sin peso no hay fecha: invitamos a completarlo (honesto, sin inventar).
  if (!plan) {
    return (
      <div className="rounded-[var(--radius-lg)] border-[1.5px] border-miel-300 bg-accent-soft p-4">
        {eyebrow}
        <p className="mt-1.5 text-sm text-text-primary">
          Confirma su peso y calculamos cuándo se le acaba para avisarte a tiempo.
        </p>
      </div>
    );
  }

  const reminderDate = minusDays(plan.estimate.runOutDate, leadDays);

  return (
    <div className="rounded-[var(--radius-lg)] border-[1.5px] border-miel-300 bg-accent-soft p-4">
      {eyebrow}
      {confirmed ? (
        <div className="mt-1.5 flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-[var(--success)]" aria-hidden />
          <p className="text-sm text-text-primary">
            Te avisaremos alrededor del{" "}
            <strong className="font-semibold">{formatDeliveryDate(reminderDate)}</strong>.{" "}
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
          <p className="mt-1.5 text-sm text-text-primary">
            <strong className="price text-lg">Le durará ~{pluralize(plan.estimate.daysLeft, "día")}</strong>
            <span className="text-text-secondary"> · aviso {formatDeliveryDate(reminderDate)}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Button
              variant="subscribe"
              size="sm"
              leadingIcon={<Check className="size-4" aria-hidden />}
              onClick={confirm}
            >
              Confirmar recordatorio
            </Button>
            <Popover>
              <PopoverTrigger className="text-[13px] font-semibold text-text-secondary underline-offset-4 hover:text-text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]">
                Ajustar
              </PopoverTrigger>
              <PopoverContent className="w-auto">
                <div className="flex flex-col gap-2">
                  <span className="caption text-text-secondary">Avisarme…</span>
                  <div
                    className="flex flex-wrap gap-2"
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
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}
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

/**
 * Sheet "no me convence" (salida 2): alternativas igual de válidas (no de segunda).
 * Elegir una rearma el plan y cierra. Bajo demanda: no infla el scroll de la pantalla.
 */
function AlternativesSheet({
  open,
  onOpenChange,
  petName,
  alternatives,
  chosen,
  pet,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petName: string;
  alternatives: Product[];
  chosen: Product;
  pet: Pet;
  onChoose: (id: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={`Otras opciones para ${petName}`}
        description="Igual de válidas — elige la que prefieras y rearmamos su plan."
      >
        <Stack gap={3}>
          {alternatives.map((alt) => (
            <AltRow
              key={alt.id}
              product={alt}
              angle={alternativeAngle(alt, chosen, pet)}
              petName={petName}
              onChoose={() => onChoose(alt.id)}
            />
          ))}
        </Stack>
      </SheetContent>
    </Sheet>
  );
}

/** Alternativa "igual de válida": marca + nombre + "mejor si…" + precio; elegirla rearma el plan. */
function AltRow({
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
  const perKg = pricePerKg(product);
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface p-4 sm:flex-row sm:items-center">
      <span
        className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] bg-white text-3xl"
        aria-hidden
      >
        <ProductImage image={product.imageUrl} alt={product.name} sizes="56px" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="overline text-text-secondary">{product.brand.name}</span>
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
