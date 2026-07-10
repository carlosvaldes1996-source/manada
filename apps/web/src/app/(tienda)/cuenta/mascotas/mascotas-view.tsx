"use client";

import { useRouter } from "next/navigation";
import { Section } from "@/components/ui/section";
import { Stack } from "@/components/ui/stack";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  PetProfileHeader,
  PetEditCard,
  AnticipationCapsule,
  RecommendationCard,
} from "@/components/pet";
import { ProductRail } from "@/components/commerce/product-rail";
import { usePet } from "@/components/providers";
import { dailyRationGrams } from "@/lib/anticipation";
import { formatDeliveryDate, pluralize } from "@/lib/format";
import { DEMO_NUDGE, TOBY_ANTICIPATION, PRODUCT_BY_ID } from "@/lib/demo-data";
import type { Product } from "@/types";

/**
 * Perfil de mascota — "la casa de Toby" (PET_EXPERIENCE §1.2). Retrato editorial
 * con la calidad de la landing, reutilizando piezas existentes:
 * hero (PetProfileHeader) → Su día a día (AnticipationCapsule con rostro +
 * stat-cards con el patrón specs de la PDP) → Su ficha (PetEditCard; campos
 * vacíos = invitación cálida, SIN panel "te falta" duplicado, §1.2) →
 * Lo de siempre (ProductRail) → Su salud (RecommendationCard).
 *
 * Datos ricos (días restantes, "su alimento", "lo de siempre") son demo hoy y
 * se derivan/omiten sin romper el layout; el backend real los enciende después.
 */
export function MascotasView({ products }: { products: Product[] }) {
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
          action={
            <Button onClick={() => router.push("/comenzar")}>Crear perfil de mascota</Button>
          }
        />
      </Section>
    );
  }

  const currentFood = activePet.currentFoodId ? PRODUCT_BY_ID.get(activePet.currentFoodId) : undefined;

  // "Su día a día": stat-cards derivadas (mismo patrón que las specs de la PDP).
  // Degradan con gracia: la ración necesita peso; la duración, peso + saco.
  const ration = activePet.weightKg ? dailyRationGrams(activePet.weightKg, activePet.stage) : undefined;
  const bagKg = currentFood?.format && /kg/i.test(currentFood.format) ? parseFloat(currentFood.format) : undefined;
  const bagDuration = bagKg && ration ? Math.round((bagKg * 1000) / ration) : undefined;

  const specs: { label: string; value: string }[] = [];
  if (ration) specs.push({ label: "Ración diaria", value: `~${ration} g` });
  if (bagDuration) specs.push({ label: "Le dura el saco", value: `~${pluralize(bagDuration, "día")}` });

  // Riel "su recompra": hasta que el backend conozca su alimento habitual, se
  // deriva por especie (mismo criterio honesto que el dashboard).
  const railProducts = products.filter((p) => p.species.includes(activePet.species)).slice(0, 6);

  const notify = (what: string) =>
    toast({ title: `Editar ${what}`, description: "La edición se conecta en la siguiente fase.", variant: "info" });

  // Su ficha: TODOS los campos (§1.2). Vacío = invitación cálida con su beneficio;
  // no se ocultan ni se duplican en un panel "te falta" aparte.
  const ficha: { key: string; label: string; value?: string; hint: string; onEdit: () => void }[] = [
    { key: "weight", label: "Peso", value: activePet.weightKg ? `${activePet.weightKg} kg` : undefined, hint: "Cuéntanos su peso para calcular su ración", onEdit: () => notify("peso") },
    { key: "breed", label: "Raza", value: activePet.breed, hint: "¿Qué raza es? Afina sus recomendaciones", onEdit: () => notify("raza") },
    { key: "neutered", label: "Esterilización", value: typeof activePet.neutered === "boolean" ? (activePet.neutered ? "Sí" : "No") : undefined, hint: "Cambia sus necesidades calóricas", onEdit: () => notify("esterilización") },
    { key: "food", label: "Alimento", value: currentFood ? `${currentFood.brand.name} · ${currentFood.name}` : undefined, hint: "¿Qué come? Te avisamos antes de que se le acabe", onEdit: () => router.push("/categoria/alimento") },
    { key: "health", label: "Info de salud", value: activePet.conditions?.length ? activePet.conditions.join(", ") : undefined, hint: "Cuéntame si tiene alguna condición para cuidarlo mejor", onEdit: () => notify("salud") },
  ];

  return (
    <Section spacing="md">
      <Stack gap={10}>
        <PetProfileHeader
          pet={activePet}
          action={<Button variant="secondary" onClick={() => notify("perfil")}>Editar perfil</Button>}
        />

        {/* ── Su día a día (el acento Miel) ── */}
        <Stack gap={4}>
          <h2 className="heading-3 text-text-primary">Su día a día</h2>
          {currentFood ? (
            <Stack gap={4}>
              <AnticipationCapsule
                pet={activePet}
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
              {specs.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            </Stack>
          ) : (
            <RecommendationCard
              pet={activePet}
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
        </Stack>

        {/* ── Su ficha (campos vacíos = invitación, §1.2) ── */}
        <Stack gap={4}>
          <div className="flex flex-col gap-1">
            <h2 className="heading-3 text-text-primary">Su ficha</h2>
            <p className="body-m text-text-secondary">
              Cada dato nos deja anticiparnos mejor a lo que {activePet.name} necesita.
            </p>
          </div>
          <Grid cols={1} md={2} gap={3}>
            {ficha.map((f) => (
              <PetEditCard key={f.key} label={f.label} value={f.value} emptyHint={f.hint} onEdit={f.onEdit} />
            ))}
          </Grid>
        </Stack>

        {/* ── Lo de siempre de {nombre} (su recompra habitual) ── */}
        {railProducts.length > 0 && (
          <ProductRail
            overline="Su recompra"
            title={`Lo de siempre de ${activePet.name}`}
            products={railProducts}
            href="/categoria/todo"
            linkLabel="Ver todo"
          />
        )}

        {/* ── Su salud (cross-sell farmacia con "por qué") ── */}
        <Stack gap={4}>
          <h2 className="heading-3 text-text-primary">Su salud</h2>
          <RecommendationCard
            pet={activePet}
            eyebrow="Su salud"
            title="¿Ya le toca la desparasitación?"
            description="Según su peso y la época del año, conviene revisar el calendario antiparasitario. Te ayudamos a elegir el correcto."
            reason={`Lo sugerimos por su peso${activePet.weightKg ? ` (${activePet.weightKg} kg)` : ""} y porque conviene revisar su calendario de farmacia. Es un recordatorio, no un diagnóstico.`}
            media={<span className="text-4xl">💊</span>}
            action={
              <Button variant="secondary" onClick={() => router.push("/categoria/farmacia")}>
                Ver opciones de farmacia
              </Button>
            }
          />
        </Stack>
      </Stack>
    </Section>
  );
}
