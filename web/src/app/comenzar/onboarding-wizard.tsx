"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, HelpCircle, Check, Scale, Utensils } from "lucide-react";
import type { LifeStage, Pet, Species } from "@/types";
import { FunnelShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { RadioGroup, RadioCard } from "@/components/ui/radio";
import { PetAvatar } from "@/components/pet/pet-avatar";
import { usePet } from "@/components/providers";
import { dailyRationGrams } from "@/lib/anticipation";
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
  neutered?: boolean;
  breed?: string;
  conditions?: string[];
}

const STEP_IDS = ["especie", "nombre", "etapa", "peso", "esterilizado", "raza", "salud"] as const;
type StepId = (typeof STEP_IDS)[number];

const SPECIES: { value: Species; label: string; emoji: string }[] = [
  { value: "perro", label: "Perro", emoji: "🐶" },
  { value: "gato", label: "Gato", emoji: "🐱" },
  { value: "otro", label: "Otro", emoji: "🐾" },
];

const STAGES: { value: LifeStage; label: string; hint: string }[] = [
  { value: "cachorro", label: "Cachorro", hint: "Hasta ~1 año" },
  { value: "adulto", label: "Adulto", hint: "~1 a 7 años" },
  { value: "senior", label: "Senior", hint: "7 años en adelante" },
];

const CONDITIONS = ["Sobrepeso", "Piel sensible", "Problemas renales", "Articulaciones", "Digestión sensible"];

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

  const optionalSteps: StepId[] = ["raza", "salud"];
  const canContinue = useMemo(() => {
    switch (stepId) {
      case "especie": return Boolean(draft.species);
      case "nombre": return Boolean(draft.name?.trim());
      case "etapa": return Boolean(draft.stage);
      case "peso": return typeof draft.weightKg === "number" && draft.weightKg > 0;
      case "esterilizado": return typeof draft.neutered === "boolean";
      default: return true; // raza y salud son opcionales
    }
  }, [stepId, draft]);

  const isLast = stepIndex === STEP_IDS.length - 1;

  function finish() {
    const pet: Pet = {
      id: `pet_${Date.now()}`,
      name: (draft.name ?? "").trim() || "Mi mascota",
      species: draft.species ?? "otro",
      stage: draft.stage ?? "adulto",
      weightKg: draft.weightKg,
      breed: draft.breed?.trim() || undefined,
      neutered: draft.neutered,
      conditions: draft.conditions ?? [],
      completeness: 0,
    };
    pet.completeness = profileCompleteness(pet);
    addPet(pet, { activate: true });
    router.push("/comenzar/recomendacion");
  }

  function next() {
    if (!canContinue) return;
    if (isLast) finish();
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
    draft.weightKg && draft.stage ? dailyRationGrams(draft.weightKg, draft.stage) : undefined;

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
                      why="Con su peso calculamos cuánto come al día y cuándo se le acaba la comida."
                    >
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.1}
                        label="Peso"
                        placeholder="8"
                        autoFocus
                        trailing="kg"
                        value={draft.weightKg ?? ""}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value);
                          set("weightKg", Number.isFinite(n) ? n : undefined);
                        }}
                        className="max-w-[160px]"
                      />
                      {liveRation && (
                        <Row gap={2} className="rounded-[var(--radius-md)] bg-accent-soft px-3.5 py-2.5 text-sm text-text-primary">
                          <Utensils className="size-4 shrink-0 text-miel-700" aria-hidden />
                          Comería <strong>~{liveRation} g al día</strong>. Con eso nos anticipamos a su recompra.
                        </Row>
                      )}
                    </Question>
                  )}

                  {/* Esterilización */}
                  {stepId === "esterilizado" && (
                    <Question
                      title={`¿${petName} está esterilizado?`}
                      why="Cambia sus necesidades calóricas, así afinamos la ración."
                    >
                      <RadioGroup
                        value={draft.neutered == null ? undefined : draft.neutered ? "si" : "no"}
                        onValueChange={(v) => set("neutered", v === "si")}
                        aria-label="Esterilización"
                        className="sm:grid-cols-2"
                      >
                        <RadioCard value="si" title="Sí" />
                        <RadioCard value="no" title="No" />
                      </RadioGroup>
                    </Question>
                  )}

                  {/* Raza (opcional) */}
                  {stepId === "raza" && (
                    <Question
                      title={`¿Qué raza es ${petName}?`}
                      why="Afina las recomendaciones de salud. Si no sabes, no pasa nada."
                      optional
                    >
                      <Input
                        label="Raza"
                        placeholder="Ej: Mestizo, Labrador, Siamés…"
                        value={draft.breed ?? ""}
                        onChange={(e) => set("breed", e.target.value)}
                        className="max-w-sm"
                      />
                      <button
                        type="button"
                        onClick={() => set("breed", "Mestizo")}
                        className="self-start text-[13px] font-semibold text-text-brand underline-offset-2 hover:underline"
                      >
                        No estoy seguro · marcar como Mestizo
                      </button>
                    </Question>
                  )}

                  {/* Salud (opcional) */}
                  {stepId === "salud" && (
                    <Question
                      title={`¿Algo de salud que debamos cuidar en ${petName}?`}
                      why="Filtramos el catálogo a lo que es seguro para él. Privado y solo para cuidarlo mejor."
                      optional
                    >
                      <div className="flex flex-wrap gap-2">
                        {CONDITIONS.map((c) => {
                          const active = draft.conditions?.includes(c) ?? false;
                          return (
                            <Chip
                              key={c}
                              active={active}
                              onToggle={(on) =>
                                set(
                                  "conditions",
                                  on
                                    ? [...(draft.conditions ?? []), c]
                                    : (draft.conditions ?? []).filter((x) => x !== c),
                                )
                              }
                            >
                              {c}
                            </Chip>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => set("conditions", [])}
                        className="self-start text-[13px] font-semibold text-text-secondary underline-offset-2 hover:underline"
                      >
                        Ninguna por ahora
                      </button>
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
              {optionalSteps.includes(stepId) && !isLast && (
                <Button type="button" variant="ghost" onClick={() => setStepIndex((i) => i + 1)}>
                  Omitir
                </Button>
              )}
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
            <div className="rounded-[var(--radius-xl)] border border-border-default bg-surface p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <PetAvatar pet={previewPet} size="xl" />
                <div>
                  <p className="overline text-text-brand">Su perfil</p>
                  <p className="pet-name text-2xl">{previewPet.name}</p>
                </div>
              </div>
              <Stack gap={2} className="mt-5 text-left">
                <PreviewRow label="Especie" value={draft.species ? SPECIES.find((s) => s.value === draft.species)?.label : undefined} />
                <PreviewRow label="Etapa" value={draft.stage ? STAGES.find((s) => s.value === draft.stage)?.label : undefined} />
                <PreviewRow label="Peso" value={draft.weightKg ? `${draft.weightKg} kg` : undefined} />
                <PreviewRow label="Esterilizado" value={draft.neutered == null ? undefined : draft.neutered ? "Sí" : "No"} />
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
  optional,
  children,
}: {
  title: React.ReactNode;
  why: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <h1 className="heading-1 text-text-primary">
          {title}
          {optional && <span className="ml-2 align-middle text-base font-normal text-text-muted">(opcional)</span>}
        </h1>
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
