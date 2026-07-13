"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, HelpCircle, Check, Scale, Utensils } from "lucide-react";
import type { LifeStage, Pet, Species, WeightSource } from "@/types";
import { FunnelShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioCard } from "@/components/ui/radio";
import { PetAvatar } from "@/components/pet/pet-avatar";
import { BreedCombobox } from "@/components/pet/breed-combobox";
import { usePet } from "@/components/providers";
import { dailyRationGrams } from "@/lib/anticipation";
import { findBreed, estimateWeightFromBreed, sizeBucketsForSpecies, midpoint } from "@/lib/breeds";
import { profileCompleteness } from "@/lib/pet";
import { fade, fadeInUp } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/** Borrador del perfil que se va completando, pregunta a pregunta. */
interface Draft {
  species?: Species;
  name?: string;
  stage?: LifeStage;
  weightKg?: number;
  weightSource?: WeightSource;
  breed?: string;
}

const STEP_IDS = ["especie", "nombre", "raza", "etapa", "peso"] as const;
type StepId = (typeof STEP_IDS)[number];

/**
 * Especies del MVP: solo perro y gato. "Otro" existe en el dominio pero se
 * ocultó del alta (simplificación 2026-07-12): el catálogo real no tiene
 * productos para otras especies y el flujo completo (razas, recomendación,
 * PLP) entregaba una experiencia vacía. Vuelve cuando haya catálogo.
 */
const SPECIES: { value: Species; label: string; emoji: string }[] = [
  { value: "perro", label: "Perro", emoji: "🐶" },
  { value: "gato", label: "Gato", emoji: "🐱" },
];

const STAGES: { value: LifeStage; label: string; hint: string }[] = [
  { value: "cachorro", label: "Cachorro", hint: "Hasta ~1 año" },
  { value: "adulto", label: "Adulto", hint: "~1 a 7 años" },
  { value: "senior", label: "Senior", hint: "7 años en adelante" },
];

/**
 * Alta de la primera mascota — el momento más importante del producto (UX.md §5,
 * journey D). Se siente como una conversación, no como un formulario: una
 * pregunta por paso, con su "por qué", la mascota tomando forma en vivo y la
 * recompensa de que cada dato mejora el cuidado. Al terminar, crea el perfil y
 * lleva a la recomendación. La cuenta se pide DESPUÉS (registro "valor primero").
 */
export function OnboardingWizard() {
  const router = useRouter();
  const { addPet } = usePet();
  const reduced = usePrefersReducedMotion();

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const stepId: StepId = STEP_IDS[stepIndex];

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  /** Fija peso + su confianza juntos (mantiene coherente el flag "estimado"). */
  const setWeight = (weightKg: number | undefined, weightSource: WeightSource | undefined) =>
    setDraft((d) => ({ ...d, weightKg, weightSource }));

  /**
   * Al elegir raza, pre-estimamos el peso desde la raza reconocida (§1.1
   * "pre-estimado desde raza"), salvo que el dueño ya lo haya fijado exacto.
   * Al pasar a Mestizo/manual se descarta el estimado previo (se re-elige por
   * tamaño en el paso de peso).
   */
  const onBreedChange = (breed: string) =>
    setDraft((d) => {
      const recognized = findBreed(d.species ?? "otro", breed);
      if (recognized && d.weightSource !== "exacto") {
        return { ...d, breed, weightKg: estimateWeightFromBreed(recognized), weightSource: "estimado" };
      }
      if (!recognized && d.weightSource === "estimado") {
        return { ...d, breed, weightKg: undefined, weightSource: undefined };
      }
      return { ...d, breed };
    });

  const canContinue = useMemo(() => {
    switch (stepId) {
      case "especie": return Boolean(draft.species);
      case "nombre": return Boolean(draft.name?.trim());
      case "raza": return Boolean(draft.breed?.trim());
      case "etapa": return Boolean(draft.stage);
      case "peso": return true; // peso no bloqueante: siempre hay estimación o "no sé" (F3)
      default: return true;
    }
  }, [stepId, draft]);

  const isLast = stepIndex === STEP_IDS.length - 1;

  /** Guard síncrono anti doble-click mientras la creación remota está en vuelo. */
  const finishingRef = useRef(false);

  async function finish() {
    if (finishingRef.current) return;
    finishingRef.current = true;
    try {
      const pet: Pet = {
        // id LOCAL de invitado (prefijo `local_`): si hay sesión, addPet lo
        // persiste en el backend y devuelve el id real `pet_…` (D34).
        id: `local_pet_${Date.now()}`,
        name: (draft.name ?? "").trim() || "Mi mascota",
        species: draft.species ?? "otro",
        stage: draft.stage ?? "adulto",
        weightKg: draft.weightKg,
        weightSource: draft.weightSource,
        breed: draft.breed?.trim() || undefined,
        completeness: 0,
      };
      pet.completeness = profileCompleteness(pet);
      await addPet(pet, { activate: true });
      router.push("/comenzar/recomendacion");
    } finally {
      finishingRef.current = false;
    }
  }

  function next() {
    if (!canContinue) return;
    if (isLast) void finish();
    else setStepIndex((i) => i + 1);
  }

  function back() {
    if (stepIndex === 0) router.push("/");
    else setStepIndex((i) => i - 1);
  }

  const petName = draft.name?.trim() || "tu mascota";
  const previewPet: Pet = {
    id: "draft",
    name: draft.name?.trim() || "Tu mascota",
    species: draft.species ?? "otro",
    stage: draft.stage ?? "adulto",
    weightKg: draft.weightKg,
  };
  const liveRation =
    draft.weightKg && draft.stage
      ? dailyRationGrams({ species: draft.species ?? "otro", stage: draft.stage, weightKg: draft.weightKg })
      : undefined;

  return (
    <FunnelShell step={stepIndex + 1} totalSteps={STEP_IDS.length} exitHref="/">
      <Section spacing="md" containerSize="default">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-12">
          {/* Pregunta actual */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
            className="flex min-h-[420px] flex-col"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={stepId}
                variants={reduced ? fade : fadeInUp}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex-1"
              >
                <Stack gap={6} className="max-w-xl">
                  {/* Especie */}
                  {stepId === "especie" && (
                    <Question
                      title="¿Quién es tu nuevo integrante?"
                      why="Así te mostramos solo lo que le sirve a su especie."
                    >
                      <RadioGroup
                        value={draft.species}
                        onValueChange={(v) => set("species", v as Species)}
                        aria-label="Especie"
                        className="sm:grid-cols-3"
                      >
                        {SPECIES.map((s) => (
                          <RadioCard key={s.value} value={s.value} title={s.label} icon={<span>{s.emoji}</span>} />
                        ))}
                      </RadioGroup>
                    </Question>
                  )}

                  {/* Nombre */}
                  {stepId === "nombre" && (
                    <Question
                      title="¿Cómo se llama?"
                      why="Para hablarte de él por su nombre, no como 'tu mascota'."
                    >
                      <Input
                        label="Nombre"
                        placeholder="Ej: Toby"
                        autoFocus
                        value={draft.name ?? ""}
                        onChange={(e) => set("name", e.target.value)}
                        className="max-w-sm"
                      />
                    </Question>
                  )}

                  {/* Raza */}
                  {stepId === "raza" && (
                    <Question
                      title={`¿Qué raza es ${petName}?`}
                      why="Con su raza estimamos el peso y afinamos lo que le recomendamos. Si no la sabes, elige Mestizo."
                    >
                      <BreedCombobox
                        species={draft.species ?? "otro"}
                        value={draft.breed}
                        onChange={onBreedChange}
                      />
                    </Question>
                  )}

                  {/* Etapa */}
                  {stepId === "etapa" && (
                    <Question
                      title={`¿En qué etapa está ${petName}?`}
                      why="Ajusta la fórmula y la ración: no come lo mismo un cachorro que un senior."
                    >
                      <RadioGroup
                        value={draft.stage}
                        onValueChange={(v) => set("stage", v as LifeStage)}
                        aria-label="Etapa de vida"
                      >
                        {STAGES.map((s) => (
                          <RadioCard key={s.value} value={s.value} title={s.label} description={s.hint} />
                        ))}
                      </RadioGroup>
                    </Question>
                  )}

                  {/* Peso */}
                  {stepId === "peso" && (
                    <Question
                      title={`¿Cuánto pesa ${petName}?`}
                      why="Con su peso calculamos cuánto come al día y cuándo se le acaba. Si no lo sabes, lo estimamos."
                    >
                      <WeightStep
                        species={draft.species ?? "otro"}
                        stage={draft.stage}
                        breed={draft.breed}
                        weightKg={draft.weightKg}
                        weightSource={draft.weightSource}
                        onSetWeight={setWeight}
                      />
                    </Question>
                  )}

                </Stack>
              </motion.div>
            </AnimatePresence>

            {/* Navegación */}
            <Row gap={3} className="mt-8 border-t border-border-default pt-5">
              <Button type="button" variant="ghost" onClick={back} leadingIcon={<ArrowLeft className="size-4" aria-hidden />}>
                {stepIndex === 0 ? "Volver" : "Atrás"}
              </Button>
              <div className="flex-1" />
              <Button
                type="submit"
                disabled={!canContinue}
                trailingIcon={isLast ? <Check className="size-4" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
              >
                {isLast ? "Ver su recomendación" : "Continuar"}
              </Button>
            </Row>
          </form>

          {/* Preview vivo: la mascota tomando forma */}
          <aside className="order-first lg:order-last lg:sticky lg:top-24 lg:self-start">
            {/* Móvil: resumen de UNA línea — la pregunta y el CTA deben caber en
                el primer viewport; la card completa empujaba todo bajo el fold. */}
            <div className="flex items-center gap-3 rounded-[var(--radius-pill)] border border-border-default bg-surface px-4 py-2 lg:hidden">
              <PetAvatar pet={previewPet} size="sm" />
              <span className="pet-name truncate text-lg">{previewPet.name}</span>
              {liveRation && (
                <span className="ml-auto shrink-0 text-[13px] font-semibold text-miel-700">
                  ~{liveRation} g/día
                </span>
              )}
            </div>

            <div className="hidden rounded-[var(--radius-xl)] border border-border-default bg-surface p-6 text-center lg:block">
              <div className="flex flex-col items-center gap-3">
                <PetAvatar pet={previewPet} size="xl" />
                <div>
                  <p className="overline text-text-brand">Su perfil</p>
                  <p className="pet-name text-2xl">{previewPet.name}</p>
                </div>
              </div>
              <Stack gap={2} className="mt-5 text-left">
                <PreviewRow label="Especie" value={draft.species ? SPECIES.find((s) => s.value === draft.species)?.label : undefined} />
                <PreviewRow label="Raza" value={draft.breed?.trim() || undefined} />
                <PreviewRow label="Etapa" value={draft.stage ? STAGES.find((s) => s.value === draft.stage)?.label : undefined} />
                <PreviewRow
                  label="Peso"
                  value={
                    draft.weightKg != null
                      ? `${draft.weightSource !== "exacto" ? "~" : ""}${draft.weightKg} kg`
                      : undefined
                  }
                />
                {liveRation && (
                  <PreviewRow label="Ración estimada" value={`~${liveRation} g/día`} highlight />
                )}
              </Stack>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-text-muted">
                <HelpCircle className="size-3.5" aria-hidden />
                Puedes editar todo después.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </FunnelShell>
  );
}

/** Encabezado de pregunta: título (Fraunces) + el "por qué". */
function Question({
  title,
  why,
  children,
}: {
  title: React.ReactNode;
  why: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <h1 className="heading-1 text-text-primary">{title}</h1>
        <p className="body-m inline-flex items-start gap-1.5 text-text-secondary">
          <Scale className="mt-0.5 size-4 shrink-0 text-text-brand" aria-hidden />
          {why}
        </p>
      </Stack>
      {children}
    </Stack>
  );
}

/** Fila del preview: aparece "viva" a medida que se completa. */
function PreviewRow({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between border-b border-border-default pb-2 text-sm last:border-0 last:pb-0", !value && "opacity-50")}>
      <span className="text-text-secondary">{label}</span>
      <span className={cn("font-semibold", highlight ? "text-miel-700" : "text-text-primary", !value && "font-normal text-text-muted")}>
        {value ?? "—"}
      </span>
    </div>
  );
}

/** Input numérico de peso con stepper ±1 kg (peso exacto). */
function ExactWeightInput({
  value,
  onChange,
}: {
  value?: number;
  onChange: (kg: number | undefined) => void;
}) {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return (
    <div className="flex max-w-[280px] items-center gap-3">
      <button
        type="button"
        aria-label="Bajar 1 kg"
        onClick={() => onChange(Math.max(1, round1((value ?? 1) - 1)))}
        className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border-default bg-surface text-xl font-bold text-text-primary transition-colors hover:bg-subtle"
      >
        −
      </button>
      <div className="flex-1">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step={0.1}
          aria-label="Peso en kilos"
          placeholder="8"
          autoFocus
          trailing="kg"
          withField={false}
          value={value ?? ""}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            onChange(Number.isFinite(n) ? n : undefined);
          }}
          className="text-center"
        />
      </div>
      <button
        type="button"
        aria-label="Subir 1 kg"
        onClick={() => onChange(Math.min(150, round1((value ?? 0) + 1)))}
        className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border-default bg-surface text-xl font-bold text-text-primary transition-colors hover:bg-subtle"
      >
        +
      </button>
    </div>
  );
}

/**
 * Paso de peso estimable (funnel F3). Ofrece 3 caminos sin bloquear:
 *  1. estimar desde la raza reconocida (pre-cargado al elegir la raza),
 *  2. elegir por tamaño (bucket → punto medio),
 *  3. ingresar el peso exacto.
 * Marca la ración como "estimado" cuando el peso no es exacto. Un "no sé" con
 * buena estimación es más completable y de mejor calidad que un número inventado.
 */
function WeightStep({
  species,
  stage,
  breed,
  weightKg,
  weightSource,
  onSetWeight,
}: {
  species: Species;
  stage?: LifeStage;
  breed?: string;
  weightKg?: number;
  weightSource?: WeightSource;
  onSetWeight: (kg: number | undefined, source: WeightSource | undefined) => void;
}) {
  const recognized = findBreed(species, breed);
  const buckets = sizeBucketsForSpecies(species);
  const hasSpeciesData = species === "perro" || species === "gato";
  const [mode, setMode] = useState<"suggest" | "size" | "exact">(
    weightSource === "exacto" ? "exact" : weightSource === "rango" ? "size" : "suggest",
  );

  const ration =
    weightKg != null && stage ? (
      <Row gap={2} className="rounded-[var(--radius-md)] bg-accent-soft px-3.5 py-2.5 text-sm text-text-primary">
        <Utensils className="mt-0.5 size-4 shrink-0 text-miel-700" aria-hidden />
        <span>
          Comería <strong>~{dailyRationGrams({ species, stage, weightKg })} g al día</strong>
          {weightSource !== "exacto" && " (estimado)"}. Con eso nos anticipamos a su recompra.
        </span>
      </Row>
    ) : null;

  // Especie sin lista curada ("otro"): sólo peso exacto, no bloqueante.
  if (!hasSpeciesData) {
    return (
      <Stack gap={4}>
        <ExactWeightInput value={weightKg} onChange={(kg) => onSetWeight(kg, kg != null ? "exacto" : undefined)} />
        <p className="text-[13px] text-text-muted">Si no lo sabes, puedes continuar y ajustarlo luego.</p>
        {ration}
      </Stack>
    );
  }

  // Peso exacto.
  if (mode === "exact") {
    return (
      <Stack gap={4}>
        <ExactWeightInput value={weightKg} onChange={(kg) => onSetWeight(kg, kg != null ? "exacto" : undefined)} />
        <button
          type="button"
          onClick={() => {
            if (recognized) {
              onSetWeight(estimateWeightFromBreed(recognized), "estimado");
              setMode("suggest");
            } else {
              setMode("size");
            }
          }}
          className="inline-flex items-center gap-1 self-start text-[13px] font-semibold text-text-brand underline-offset-2 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {recognized ? "Volver a la estimación" : "Estimar por tamaño"}
        </button>
        {ration}
      </Stack>
    );
  }

  // Elegir por tamaño (bucket) — también el estado por defecto sin raza reconocida.
  if (mode === "size" || !recognized) {
    const currentBucketId =
      weightSource === "rango" ? buckets.find((b) => midpoint(b.range) === weightKg)?.id : undefined;
    return (
      <Stack gap={4}>
        <p className="body-m text-text-secondary">Elige su tamaño y estimamos el peso:</p>
        <RadioGroup
          value={currentBucketId}
          onValueChange={(id) => {
            const b = buckets.find((x) => x.id === id);
            if (b) onSetWeight(midpoint(b.range), "rango");
          }}
          aria-label="Tamaño"
        >
          {buckets.map((b) => (
            <RadioCard
              key={b.id}
              value={b.id}
              title={b.label}
              description={`${b.range[0]}–${b.range[1]} kg · ${b.example}`}
            />
          ))}
        </RadioGroup>
        <button
          type="button"
          onClick={() => setMode("exact")}
          className="inline-flex items-center gap-1 self-start text-[13px] font-semibold text-text-brand underline-offset-2 hover:underline"
        >
          <Scale className="size-3.5" aria-hidden />
          Sé su peso exacto
        </button>
        {ration}
      </Stack>
    );
  }

  // Estimación por raza reconocida.
  const [min, max] = recognized.pesoRangoAdulto;
  const estimate = estimateWeightFromBreed(recognized);
  const usingEstimate = weightSource === "estimado" && weightKg != null;
  return (
    <Stack gap={4}>
      <div className="rounded-[var(--radius-lg)] border border-terracota-200 bg-brand-soft p-4">
        <p className="text-sm text-text-primary">
          Los <strong>{recognized.nombre}</strong> suelen pesar entre <strong>{min}</strong> y{" "}
          <strong>{max} kg</strong>.
        </p>
        {usingEstimate ? (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-text-brand">
            <Check className="size-4" aria-hidden />
            Usaremos ~{weightKg} kg como estimación.
          </p>
        ) : (
          <Button size="sm" className="mt-2.5" onClick={() => onSetWeight(estimate, "estimado")}>
            Usar ~{estimate} kg
          </Button>
        )}
      </div>
      <Row gap={2} className="flex-wrap text-[13px] font-semibold text-text-brand">
        <button type="button" onClick={() => setMode("exact")} className="underline-offset-2 hover:underline">
          Sé su peso exacto
        </button>
        <span className="text-text-muted" aria-hidden>·</span>
        <button type="button" onClick={() => setMode("size")} className="underline-offset-2 hover:underline">
          Elegir por tamaño
        </button>
      </Row>
      {ration}
    </Stack>
  );
}
