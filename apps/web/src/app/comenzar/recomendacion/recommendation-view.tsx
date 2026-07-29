"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
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
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { ProductImage, PlanManadaCard } from "@/components/commerce";
import { PetAvatar } from "@/components/pet/pet-avatar";
import { usePet, useCart, useSession } from "@/components/providers";
import { naturalFrequencyWeeks } from "@/hooks/use-subscription";
import { fade, fadeInUp } from "@/lib/motion";
import { trackRecommendationShown } from "@/lib/analytics";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import type { Pet, Product, SubscriptionFrequencyWeeks } from "@/types";
import {
  recommendFoodRanked,
  recommendFoodAlternatives,
  foodPlan,
  foodReasons,
  alternativeAngle,
  pricePerKg,
} from "@/lib/recommend";
import { formatCLP, pluralize } from "@/lib/format";

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
 * REDISEÑO 2026-07-26 (3ª iteración): deja de sentirse como "el último paso del onboarding"
 * y se siente como "el primer contacto con el e-commerce". El onboarding ya convenció → aquí
 * solo se decide QUÉ alimento comprar, y la pantalla empuja hacia la SUSCRIPCIÓN de la forma
 * más simple posible. Reutiliza el MISMO patrón de la PDP (D56): `PlanManadaCard` (suscripción,
 * recomendada) + compra única como salida secundaria siempre presente. Así suscribirse se
 * siente idéntico en toda la tienda (no hay un flujo especial de onboarding).
 *
 * Evolución sobre la "carta de plan" de D44: se RETIRA la capa de promesas aún no confiables
 * —"le durará ~X días", "aviso el 29", fechas y leads 3/5/7— (el proxy de suscripción que D44
 * dejó con "lugar reservado"). Ahora que la suscripción es real (D55–D58), ese lugar lo ocupa
 * la frecuencia sugerida de la card, sin fechas ni cálculos expuestos. Honestidad D57 intacta.
 *
 * Mobile primero: jerarquía de PDP simplificada — producto → suscripción/compra única → CTA →
 * cambiar producto / ya come otra marca / ir a la tienda → acordeón "¿por qué?". Las
 * alternativas y la marca propia viven en Sheets (menos cajas visibles).
 *
 * Cuatro salidas de primer nivel (§1.5):
 *  1. Me convence → Suscribirme (primary, recomendada) o Sumar al pedido (compra única).
 *  2. No me convence → "Ver otras opciones (N)" → Sheet de alternativas igual de válidas.
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

  // Frecuencia de suscripción sugerida (la natural: la más cercana a cuánto dura el saco).
  // Fuente ÚNICA compartida con la PDP; sin fechas ni cálculos expuestos al usuario. Se
  // re-deriva al cambiar de comida (otro saco dura distinto) con el patrón de "reset de
  // estado al cambiar una prop" (sin efecto, en render), igual que la PDP.
  const naturalFreq = naturalFrequencyWeeks(plan?.estimate.daysLeft);
  const [frequency, setFrequency] = useState<SubscriptionFrequencyWeeks>(naturalFreq);
  const [freqAnchor, setFreqAnchor] = useState<string | undefined>(food?.id);
  if (food && freqAnchor !== food.id) {
    setFreqAnchor(food.id);
    setFrequency(naturalFreq);
  }

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
    }
  }, [activePet, recommended]);

  if (!activePet) return null;

  // Salir sin descartar el journey: tienda (invitado) o sus mascotas (con sesión).
  // NUNCA la landing (FUNNEL_TARGET §1.5, principio 4).
  const exitHref = isAuthed ? "/cuenta/mascotas" : STORE_HREF;

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

  return (
    <FunnelShell exitHref={exitHref}>
      <Section spacing="sm">
        <motion.div
          variants={reduced ? fade : fadeInUp}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-4xl"
        >
          <Stack gap={4}>
            {/* Cierre del onboarding: no "paso 6" sino "listo". El título es solo el
                marco emocional (la card es la protagonista): compacto y sin robar foco. */}
            <Stack gap={1} align="center" className="text-center">
              <span className="overline inline-flex items-center gap-1.5 text-text-brand">
                <Sparkles className="size-3.5" aria-hidden /> El perfil de {activePet.name} está listo
              </span>
              <h1 className="heading-2 text-text-primary">
                El plan de <span className="pet-name">{activePet.name}</span>
              </h1>
            </Stack>

            {/* LA CARTA DE PLAN — dos columnas en desktop: "el producto" | "la decisión".
                En móvil apila: producto → suscripción/compra única → CTA (jerarquía de PDP). */}
            <div className="flex flex-col gap-6 rounded-[var(--radius-xl)] border border-border-default bg-surface p-6 shadow-sm lg:flex-row lg:gap-8 lg:p-6">
              {/* Columna A — el producto: identidad + etiqueta del plan. Centrada en
                  vertical en desktop para que su vacío quede balanceado (no "colgado"). */}
              <Stack gap={4} className="min-w-0 flex-1 lg:justify-center">
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
              </Stack>

              {/* Columna B — la decisión: suscripción (recomendada) + compra única.
                  MISMO patrón y componente que la PDP (D56): así comprar se siente idéntico. */}
              <Stack
                gap={3}
                className="lg:w-[360px] lg:shrink-0 lg:border-l lg:border-border-default lg:pl-8"
              >
                {isOwned ? (
                  /* Su marca de siempre: no se compra, se GUARDA el plan (puede reponer). */
                  <Stack gap={3}>
                    <Stack gap={1}>
                      <span className="overline text-text-secondary">Su alimento de siempre</span>
                      <Price now={food.price.current} was={food.price.compareAt} size="xl" />
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
                        frecuencia reactivos. La frecuencia por defecto es la natural. */}
                    {subscribable && (
                      <PlanManadaCard
                        product={food}
                        frequency={frequency}
                        onFrequencyChange={setFrequency}
                      />
                    )}

                    {subscribable && <Separator />}

                    {/* Compra única — salida secundaria (D56). Con suscripción presente va
                        COMPACTA (label+precio en línea, botón md) para recortar altura y dar
                        el foco a la suscripción; sin suscripción es el CTA principal. */}
                    {subscribable ? (
                      <Stack gap={2}>
                        <Row justify="between" align="center" gap={2}>
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
                  </>
                )}

              </Stack>
            </div>

            {/* Salidas secundarias: cambiar producto · ya come otra marca · ir a la tienda.
                Apiladas en móvil; en fila en desktop para que se vean sin scroll bajo la card. */}
            <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-2 sm:max-w-3xl sm:grid-cols-none sm:grid-flow-col sm:auto-cols-fr">
              {!isOwned && alternatives.length > 0 && (
                <Button
                  variant="ghost"
                  block
                  onClick={() => setAltOpen(true)}
                  trailingIcon={<ChevronRight className="size-4" aria-hidden />}
                >
                  Ver otras opciones ({alternatives.length})
                </Button>
              )}
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

            {/* Cierre: "¿por qué?" como acordeón, al final (el onboarding ya convenció;
                aquí solo respalda la confianza para quien la busca). */}
            {!isOwned && whyReasons.length > 0 && (
              <div className="mx-auto w-full max-w-md">
                <WhyDisclosure reasons={whyReasons} />
              </div>
            )}
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
