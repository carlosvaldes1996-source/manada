"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  PetProfileHeader,
  PetEditCard,
  FeedingSchedule,
  AnticipationCapsule,
  RecommendationCard,
} from "@/components/pet";
import { usePet } from "@/components/providers";
import { missingProfileFields } from "@/lib/pet";
import { formatDeliveryDate } from "@/lib/format";
import { DEMO_NUDGE, TOBY_ANTICIPATION, PRODUCT_BY_ID } from "@/lib/demo-data";

/**
 * Perfil de mascota — el núcleo del producto (el moat).
 *
 * Decisiones de IA (AUDIT_UI_UX):
 * - U054: la completitud es ACCIONABLE: además del %, listamos exactamente qué
 *   campos faltan para el 100%, con su valor y un CTA para completarlos.
 * - U056/U040: la cápsula usa la misma fuente única de anticipación.
 * - U072: NO repetimos aquí el recordatorio de desparasitación (vive solo en la
 *   Home) para no saturar.
 */
export default function MascotasPage() {
  const { activePet } = usePet();
  const { toast } = useToast();
  const router = useRouter();

  if (!activePet) {
    return (
      <Section spacing="lg">
        <EmptyState
          icon={<span className="text-5xl">🐾</span>}
          title="Aún no agregas una mascota"
          description="Crea el perfil de tu compañero y nos anticiparemos a lo que necesita."
          action={<Button>Crear perfil de mascota</Button>}
        />
      </Section>
    );
  }

  const missing = missingProfileFields(activePet);
  const currentFood = activePet.currentFoodId ? PRODUCT_BY_ID.get(activePet.currentFoodId) : undefined;

  const notify = (what: string) =>
    toast({ title: `Editar ${what}`, description: "La edición se conecta en la siguiente fase.", variant: "info" });

  const editable = [
    { key: "weight", label: "Peso", value: activePet.weightKg ? `${activePet.weightKg} kg` : undefined, hint: "Para calcular su ración" },
    { key: "breed", label: "Raza", value: activePet.breed, hint: "Afina sus recomendaciones" },
    { key: "neutered", label: "Esterilización", value: typeof activePet.neutered === "boolean" ? (activePet.neutered ? "Sí" : "No") : undefined, hint: "Cambia sus necesidades calóricas" },
    { key: "photo", label: "Foto", value: activePet.avatarUrl, hint: "Para reconocerlo de un vistazo" },
    { key: "health", label: "Info de salud", value: activePet.conditions?.length ? activePet.conditions.join(", ") : undefined, hint: "Filtra el catálogo a lo seguro para él" },
  ];

  return (
    <Section spacing="md">
      <Stack gap={8}>
        <PetProfileHeader
          pet={activePet}
          action={<Button variant="secondary" onClick={() => notify("perfil")}>Editar perfil</Button>}
        />

        {/* Completitud accionable: qué falta para el 100% (U054) */}
        {missing.length > 0 && (
          <div className="rounded-[var(--radius-lg)] border border-miel-300 bg-accent-soft p-5">
            <Row gap={2}>
              <Sparkles className="size-4 text-miel-700" aria-hidden />
              <h2 className="heading-4 text-text-primary">
                Te falta poco para conocer del todo a {activePet.name}
              </h2>
            </Row>
            <Stack gap={2} className="mt-3">
              {missing.map((m) => (
                <Row key={m.key} justify="between" className="gap-3 border-t border-miel-200 pt-2 first:border-0 first:pt-0">
                  <span className="flex flex-col">
                    <span className="text-[15px] font-semibold text-text-primary">{m.label}</span>
                    <span className="text-[13px] text-text-secondary">{m.hint}</span>
                  </span>
                  <Button size="sm" variant="subscribe" onClick={() => notify(m.label.toLowerCase())}>
                    Agregar
                  </Button>
                </Row>
              ))}
            </Stack>
          </div>
        )}

        {/* La anticipación de su comida (fuente única, U056). Solo si conocemos
            su alimento: una mascota recién creada no hereda los días de Toby. */}
        {currentFood ? (
          <AnticipationCapsule
            petName={activePet.name}
            daysLeft={TOBY_ANTICIPATION.daysLeft}
            percentLeft={TOBY_ANTICIPATION.percentLeft}
            runOutDate={TOBY_ANTICIPATION.runOutDate}
            reason={DEMO_NUDGE.reason}
            onReschedule={(date) =>
              toast({
                title: "Entrega reagendada",
                description: `Llegará ${formatDeliveryDate(date)}. Te avisaremos un día antes.`,
                variant: "success",
              })
            }
            onSubscribe={() => router.push(`/producto/${currentFood.slug}`)}
          />
        ) : (
          <RecommendationCard
            eyebrow={`Para anticiparnos por ${activePet.name}`}
            title={`Cuéntanos qué come ${activePet.name}`}
            description="Con su alimento calculamos cuánto le dura el saco y te avisamos antes de que se acabe. Es lo único que nos falta."
            media={<span className="text-4xl">🍽️</span>}
            action={
              <Button variant="secondary" onClick={() => router.push("/categoria/alimento")}>
                Elegir su alimento
              </Button>
            }
          />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <FeedingSchedule pet={activePet} />
          <Stack gap={3}>
            <h2 className="heading-4 text-text-primary">Su ficha</h2>
            {/* Solo los datos que YA conocemos. Lo que falta vive (una sola vez)
                en el panel "Te falta poco" de arriba — sin doble petición. */}
            <Grid cols={1} md={2} gap={3}>
              {editable
                .filter((e) => Boolean(e.value))
                .map((e) => (
                  <PetEditCard
                    key={e.key}
                    label={e.label}
                    value={e.value}
                    onEdit={() => notify(e.label.toLowerCase())}
                  />
                ))}
            </Grid>
          </Stack>
        </div>
      </Stack>
    </Section>
  );
}
