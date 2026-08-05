"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Search,
  Store,
  Repeat,
  RotateCcw,
  ChevronDown,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { FunnelShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { ProductImage, PlanManadaCard } from "@/components/commerce";
import { PetAvatar } from "@/components/pet/pet-avatar";
import { usePet, useCart, useSession } from "@/components/providers";
import { fade, fadeInUp } from "@/lib/motion";
import { trackRecommendationShown } from "@/lib/analytics";
import { setFunnelPetContext } from "@/lib/funnel-context";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import type { Product, SubscriptionFrequencyWeeks } from "@/types";
import {
  recommendFoodRanked,
  recommendFoodAlternatives,
  foodPlan,
  foodReasons,
  alternativeAngle,
  pricePerKg,
} from "@/lib/recommend";
import { formatCLP, pluralize } from "@/lib/format";
import { overweightSignal } from "@/lib/breeds";

/** Entrada a la tienda que preserva el journey (nunca la landing — FUNNEL_TARGET §1.5). */
const STORE_HREF = "/categoria/todo";

/** De qué comida está hecho el plan que se muestra:
 *  - `recommended` — la que elegiríamos o una alternativa que el usuario prefirió (la COMPRA).
 *  - `owned` — su marca de siempre (declaró "ya come otra marca"): ya la tiene en casa, así
 *    que el plan se GUARDA (no se agrega al carrito). Misma cadencia, otra forma válida
 *    de completar el journey (FUNNEL_TARGET §1.5, puerta de lealtad de marca). */
type PlanMode = "recommended" | "owned";

/**
 * Recomendación consultiva — "El plan de {mascota}" (Funnel F4, FUNNEL_TARGET §1.5).
 *
 * REDISEÑO 2026-07-31 (4ª iteración): adopta el DISEÑO validado en la rama de Cristóbal
 * —columna angosta mobile-first, cierre con check de éxito + ración como prueba, y una
 * "tarjeta destacada" con banda de color ("NUESTRA MEJOR RECOMENDACIÓN") + badges— sobre
 * la FUNCIONALIDAD real de nuestra rama. La tarjeta de Cristóbal se construyó sobre el
 * recordatorio proxy (D29); aquí ese lugar lo ocupa la SUSCRIPCIÓN REAL: `PlanManadaCard`
 * (el patrón único del sitio, D56) + compra única, exactamente como la PDP, para que
 * suscribirse se sienta idéntico en toda la tienda.
 *
 * Mobile primero: una sola columna que fluye — cierre → advertencia de peso (si aplica) →
 * tarjeta destacada (producto) → suscripción → compra única → "¿por qué?" → alternativas
 * en línea → salidas secundarias. Sin dos columnas que se corten en pantallas chicas.
 *
 * Cuatro salidas (§1.5):
 *  1. Me convence → Suscribirme (recomendada, `PlanManadaCard`) o Sumar al pedido (compra única).
 *  2. No me convence → alternativas igual de válidas EN LÍNEA (elegir rearma el plan).
 *  3. Seguir mirando → "Seguir en la tienda".
 *  4. Ya come otra marca → Sheet buscador: su marca REARMA el plan y se GUARDA (sin empujar
 *     el cambio, puerta de lealtad de marca).
 *
 * Catálogo REAL (Store API, O5): sumar/guardar registra qué come (`assignFood`, seam B6).
 */
export function RecommendationView({ products }: { products: Product[] }) {
  const router = useRouter();
  const { activePet, assignFood, isHydrating } = usePet();
  const { addItem } = useCart();
  const { toast } = useToast();
  const reduced = usePrefersReducedMotion();
  // La sesión decide solo el DESTINO DE SALIDA (tienda vs. sus mascotas), no el
  // camino de compra: sumar al pedido lleva SIEMPRE al carrito (invitado o cliente).
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

  // Razones "por qué esta" — solo las cualitativas: la ración vive en otra parte, así
  // que la sacamos de aquí para no repetir el mismo número (síntesis).
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
  // Plan nutricional del saco (RER/MER) — SOLO para mostrar (ración en el cierre y
  // "dura X días" en la tarjeta). No modifica el cálculo: lee la función pura existente.
  const plan = useMemo(
    () => (activePet && food ? foodPlan(activePet, food) : undefined),
    [activePet, food],
  );

  // Frecuencia de suscripción: por defecto 4 semanas en TODOS los flujos (decisión
  // de producto 2026-07). Fuente única con la PDP; el usuario puede cambiarla y su
  // elección se conserva al cambiar de comida.
  const [frequency, setFrequency] = useState<SubscriptionFrequencyWeeks>(4);

  // Sin mascota (entrada directa a la URL) → al alta. Se espera a que el perfil
  // termine de hidratar (espejo local del invitado, D-persistencia) para no
  // rebotar al onboarding en una recarga antes de restaurar la mascota.
  useEffect(() => {
    if (!isHydrating && !activePet) router.replace("/comenzar");
  }, [isHydrating, activePet, router]);

  // Momento "aha" del embudo: se mostró la recomendación (una vez por producto
  // recomendado, para no re-disparar al re-render).
  const shownRef = useRef<string | null>(null);
  useEffect(() => {
    if (activePet && recommended && shownRef.current !== recommended.id) {
      shownRef.current = recommended.id;
      trackRecommendationShown(activePet, recommended);
      // Especie y etapa al contexto de funnel (D75): es el momento en que se
      // conocen y lo que después permite segmentar el abandono por tipo de
      // mascota. Si el carrito nace más tarde, lo hereda de la sesión.
      setFunnelPetContext(activePet.species, activePet.stage);
    }
  }, [activePet, recommended]);

  if (!activePet) return null;

  // Señal de posible sobrepeso (advisory): raza de rango conocido + peso sobre su
  // máximo típico. No altera el plan ni la ración; solo invita a revisarlo.
  const overweight = overweightSignal(activePet.species, activePet.breed, activePet.weightKg);

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

  /**
   * Compra única / reponer: sumar la comida mostrada al pedido real + aprender qué come.
   *
   * Funnel unificado (cierre de F5, validado por Carlos 2026-07-26): se elimina el
   * muro invitado→`/crear-cuenta` que había ANTES del carrito. Todos van al carrito
   * (invitado o cliente), igual que desde la PDP y que "Suscribirme". El invitado
   * compra como invitado (D17/D26); la cuenta se materializa recién en el checkout y
   * solo donde es estructuralmente necesaria (la suscripción, que exige `customer_id`).
   */
  function addToOrder() {
    if (!food) return;
    addItem(food, { quantity: 1 });
    assignFood(activePet!.id, food.id);
    router.push("/carrito");
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

  const foodPerKg = pricePerKg(food);
  const subscribable = !isOwned && food.subscribable;
  const daysLeft = plan?.estimate.daysLeft;
  // Hasta 2 alternativas EN LÍNEA (diseño Cristóbal): no una lista larga ni un Sheet oculto.
  const sideAlternatives = alternatives.slice(0, 2);

  /** Banda superior de la tarjeta destacada, según de qué comida esté hecho el plan. */
  const bandLabel = isOwned ? (
    <>
      <span className="overline text-white">La comida de {activePet.name}</span>
      <button
        type="button"
        onClick={resetToRecommended}
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/85 underline-offset-2 hover:underline"
      >
        <RotateCcw className="size-3" aria-hidden /> ver la sugerida
      </button>
    </>
  ) : isRecommended ? (
    <span className="overline tracking-widest text-white">Nuestra mejor recomendación</span>
  ) : (
    <>
      <span className="overline text-white">Tu elección para {activePet.name}</span>
      <button
        type="button"
        onClick={resetToRecommended}
        className="text-[12px] font-semibold text-white/85 underline-offset-2 hover:underline"
      >
        ver la sugerida
      </button>
    </>
  );

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
            {/* Cierre del onboarding (diseño Cristóbal): check de éxito + "plan listo",
                con la ración como prueba concreta de que el perfil sirvió. */}
            <Stack gap={1} align="center" className="text-center">
              <span className="grid size-11 place-items-center rounded-full bg-success-soft text-success-strong">
                <Check className="size-5" aria-hidden />
              </span>
              <h1 className="display-l text-text-primary">
                ¡Plan listo para <span className="pet-name">{activePet.name}</span>!
              </h1>
              {plan && (
                <p className="body-m text-text-secondary">
                  Según su perfil, necesita{" "}
                  <strong className="text-text-primary">{plan.rationGrams} g</strong> al día
                  {weightEstimated && " (estimado)"}
                </p>
              )}
            </Stack>

            {overweight && (
              <Row
                gap={2}
                className="rounded-[var(--radius-md)] bg-urgency-soft px-3.5 py-2.5 text-sm text-text-primary"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-urgency-strong" aria-hidden />
                <span>
                  El peso de {activePet.name} (~{activePet.weightKg} kg) está ~{overweight.excessPct}% sobre el
                  máximo típico de su raza (~{overweight.typicalMax} kg). Podría indicar <strong>sobrepeso</strong>:
                  te sugerimos confirmarlo con tu veterinario. Su plan y ración se calculan con el peso indicado.
                </span>
              </Row>
            )}

            {/* TARJETA DESTACADA (diseño Cristóbal): banda de color + identidad del
                producto. Borde neutro para NO competir con la card de suscripción de
                abajo (el foco terracota es la suscripción). Una sola columna: en móvil
                fluye sin cortarse; el cuerpo mantiene la imagen shrink-0 y el texto min-w-0. */}
            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-surface shadow-sm">
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 bg-terracota-400 px-5 py-2 text-center">
                {bandLabel}
              </div>

              <div className="p-5 sm:p-6">
                <Row gap={4} align="start">
                  <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-gradient-to-b from-canvas to-subtle sm:size-28">
                    <ProductImage
                      image={food.imageUrl}
                      alt={`${food.brand.name} ${food.name}`}
                      className="p-2"
                      sizes="112px"
                      emojiClassName="text-5xl"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="overline text-text-secondary">{food.brand.name}</span>
                    <h2 className="heading-3 text-text-primary">{food.name}</h2>
                    {food.rating && <Rating value={food.rating.value} count={food.rating.count} />}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {food.format && (
                        <span className="inline-flex items-center rounded-[var(--radius-pill)] border border-border-default px-2.5 py-0.5 text-[12px] font-semibold text-text-secondary">
                          {food.format}
                        </span>
                      )}
                      {daysLeft && (
                        <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-terracota-100 px-2.5 py-0.5 text-[12px] font-semibold text-terracota-700">
                          Dura {pluralize(daysLeft, "día")}
                        </span>
                      )}
                    </div>
                    {weightEstimated && (
                      <p className="mt-1.5 text-[12px] text-text-muted">Estimado con su peso aproximado.</p>
                    )}
                  </div>
                </Row>

                {/* "¿Por qué?" — acordeón bajo el producto (el onboarding ya convenció;
                    aquí solo respalda la confianza para quien la busca). */}
                {!isOwned && whyReasons.length > 0 && (
                  <div className="mt-4 border-t border-border-default pt-4">
                    <WhyDisclosure reasons={whyReasons} />
                  </div>
                )}
              </div>
            </div>

            {/* DECISIÓN — MISMO patrón y componentes que la PDP (D56): suscripción real
                (PlanManadaCard) + compra única. Sin recordatorio/fechas: la cadencia vive
                en la frecuencia de la card. Suscribirse se siente idéntico en toda la tienda. */}
            {isOwned ? (
              /* Su marca de siempre: no se compra, se GUARDA el plan (puede reponer). */
              <Stack gap={3} className="rounded-[var(--radius-xl)] border border-border-default bg-surface p-5">
                <Stack gap={1}>
                  <span className="overline text-text-secondary">Su alimento de siempre</span>
                  <Price now={food.price.current} was={food.price.compareAt} size="xl" />
                  {foodPerKg && (
                    <span className="text-[13px] text-text-secondary">{formatCLP(foodPerKg)} por kilo</span>
                  )}
                </Stack>
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
              </Stack>
            ) : (
              <>
                {/* Suscripción primero (recomendada) — card idéntica a la PDP, precio y
                    frecuencia reactivos. La frecuencia por defecto es 4 semanas. */}
                {subscribable && (
                  <PlanManadaCard
                    product={food}
                    frequency={frequency}
                    onFrequencyChange={setFrequency}
                  />
                )}

                {/* Compra única — salida secundaria (D56) cuando hay suscripción; si el
                    producto no es suscribible, es el CTA principal. */}
                <div className="rounded-[var(--radius-xl)] border border-border-default bg-surface p-5">
                  {subscribable ? (
                    <Stack gap={3}>
                      <Row justify="between" align="center" gap={2} wrap>
                        <span className="overline text-text-secondary">Compra única</span>
                        <Price now={food.price.current} was={food.price.compareAt} size="md" />
                      </Row>
                      <Button
                        size="md"
                        block
                        variant="secondary"
                        onClick={addToOrder}
                        trailingIcon={<ArrowRight className="size-4" aria-hidden />}
                      >
                        Sumar al pedido
                      </Button>
                    </Stack>
                  ) : (
                    <Stack gap={3}>
                      <Stack gap={1}>
                        <span className="overline text-text-secondary">Compra única</span>
                        <Price now={food.price.current} was={food.price.compareAt} size="xl" />
                        {foodPerKg && (
                          <span className="text-[13px] text-text-secondary">
                            {formatCLP(foodPerKg)} por kilo
                          </span>
                        )}
                      </Stack>
                      <Button
                        size="lg"
                        block
                        onClick={addToOrder}
                        trailingIcon={<ArrowRight className="size-4" aria-hidden />}
                      >
                        Sumar al pedido de {activePet.name}
                      </Button>
                    </Stack>
                  )}
                </div>
              </>
            )}

            {/* Alternativas igual de válidas EN LÍNEA (diseño Cristóbal): elegir una
                promueve esa comida a destacada y rearma el plan completo. */}
            {!isOwned && sideAlternatives.length > 0 && (
              <Stack gap={3}>
                <span className="overline text-text-secondary">Otras opciones igual de válidas</span>
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

            {/* Salidas secundarias: ya come otra marca · seguir en la tienda. Apiladas
                en móvil, en dos columnas desde sm — nunca se cortan. */}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="ghost"
                block
                onClick={() => setBrandOpen(true)}
                leadingIcon={<Search className="size-4" aria-hidden />}
              >
                {activePet.name} ya come otra marca
              </Button>
              <Button variant="ghost" block asChild>
                <Link href={STORE_HREF}>
                  <Store className="size-4" aria-hidden /> Seguir en la tienda
                </Link>
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

/* ----------------------------------- Piezas ------------------------------------- */

/** "¿Por qué esta?" — razones cualitativas bajo demanda (no persuade por defecto). */
function WhyDisclosure({ reasons }: { reasons: string[] }) {
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
        ¿Por qué recomendamos este alimento?
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
 * Alternativa igual de válida EN LÍNEA (diseño Cristóbal): marca + nombre + "mejor si…"
 * + precio. Elegirla promueve esa comida a destacada y rearma el plan completo. Layout
 * de una fila que apila la imagen shrink-0 · info min-w-0 · precio shrink-0 → nunca se
 * corta en móvil; el "Ver detalle" vive en el buscador y en "Seguir en la tienda".
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
      <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-gradient-to-b from-canvas to-subtle">
        <ProductImage image={product.imageUrl} alt={product.name} className="p-1.5" sizes="80px" emojiClassName="text-3xl" />
      </div>

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

      <div className="flex shrink-0 flex-col items-end justify-center gap-0.5">
        {compareAt && compareAt > product.price.current && (
          <span className="text-sm text-text-muted line-through">{formatCLP(compareAt)}</span>
        )}
        <span className="price text-xl font-bold text-terracota-500">{formatCLP(product.price.current)}</span>
      </div>
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
 * marca de siempre rearma el plan sin empujar el cambio (FUNNEL_TARGET §1.5, puerta de
 * lealtad). El copy de confianza vive aquí, donde importa.
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
