"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { useToast } from "@/components/ui/toast";
import { AnticipationCapsule } from "@/components/pet/anticipation-capsule";
import { RecommendationCard } from "@/components/pet/recommendation-card";
import { ProductRail } from "@/components/commerce/product-rail";
import { CategoryTiles } from "@/components/commerce/category-tiles";
import { AppShell } from "@/components/layout";
import { usePet, useSession } from "@/components/providers";
import { formatDeliveryDate } from "@/lib/format";
import {
  DEMO_NUDGE,
  TOBY_ANTICIPATION,
  PRODUCT_BY_ID,
} from "@/lib/demo-data";
import type { Product } from "@/types";

/**
 * Panel personal del dueño con sesión iniciada (la "app" de Manada).
 *
 * Se muestra en `/` solo cuando hay sesión (Fase 3.3B); el visitante anónimo ve
 * la <LandingView>. Decisiones de IA (AUDIT_UI_UX U041/U058): un solo modelo
 * mental —panel personal—. El saludo y la cápsula se condicionan al estado real
 * (U068). La cápsula de anticipación se aísla con aire (U069); un solo riel de
 * cross-sell (U052); el nombre se alterna con "tu compañero" (U053).
 */
export function DashboardView({ products }: { products: Product[] }) {
  const { activePet } = usePet();
  const { user } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const firstName = user?.firstName ?? "";

  const currentFood = activePet?.currentFoodId
    ? PRODUCT_BY_ID.get(activePet.currentFoodId)
    : undefined;

  // Solo anticipamos cuando conocemos su alimento (mascota recién creada aún no
  // lo tiene → no mostramos los días de Toby, evita incoherencia).
  const hasAnticipation = Boolean(currentFood);

  // Sustantivo de especie para alternar con el nombre y bajar densidad de "Toby" (U053).
  const speciesNoun =
    activePet?.species === "gato" ? "tu gato" : activePet?.species === "perro" ? "tu perro" : "tu compañero";

  // Riel único (catálogo REAL): pensado para la especie de la mascota activa.
  const railProducts = activePet
    ? products.filter((p) => p.species.includes(activePet.species)).slice(0, 6)
    : products.slice(0, 6);

  return (
    <AppShell>
      {/* ── Clímax: saludo + cápsula de anticipación, aislada con aire (U069) ── */}
      <Section spacing="lg" tone="canvas">
        <Stack gap={8}>
          <Stack gap={2}>
            <span className="overline text-text-brand">
              Hola, {firstName} 👋
            </span>
            <h1 className="display-l text-text-primary">
              {hasAnticipation
                ? `Esto es lo que vimos para ${activePet!.name} hoy`
                : activePet
                  ? `${activePet.name} ya es parte de tu manada`
                  : "Cuidemos juntos a tu compañero"}
            </h1>
            <p className="body-l max-w-2xl text-text-secondary">
              {hasAnticipation
                ? "Nos adelantamos a lo que necesita para que nunca le falte nada. Tú decides; nosotros avisamos a tiempo."
                : activePet
                  ? "Cuéntanos qué come para calcular cuánto necesita y avisarte antes de que se le acabe."
                  : "Crea el perfil de tu mascota y nos anticiparemos a lo que necesita: comida, salud y más."}
            </p>
          </Stack>

          {hasAnticipation ? (
            <AnticipationCapsule
              petName={activePet!.name}
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
              onSubscribe={() =>
                currentFood
                  ? router.push(`/producto/${currentFood.slug}`)
                  : router.push("/categoria/alimento")
              }
            />
          ) : (
            <Row gap={3} wrap>
              <Button asChild>
                <Link href={activePet ? "/categoria/alimento" : "/comenzar"}>
                  {activePet ? "Elegir su alimento" : "Crear perfil de mascota"}
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href={activePet ? "/cuenta/mascotas" : "/categoria/todo"}>
                  {activePet ? "Completar su perfil" : "Explorar la tienda"}
                </Link>
              </Button>
            </Row>
          )}
        </Stack>
      </Section>

      {/* ── Accesos por necesidad (navegación por necesidad, no por marca) ── */}
      <Section spacing="md" tone="subtle">
        <Stack gap={5}>
          <SectionHeading
            overline="Comprar por necesidad"
            title="¿Qué necesita hoy?"
          />
          <CategoryTiles />
        </Stack>
      </Section>

      {/* ── Cross-sell ÚNICO en la Home (U052): lo que sueles recomprar ── */}
      <Section spacing="md" tone="canvas">
        <ProductRail
          overline={activePet ? `Para ${speciesNoun}` : "Recomendado"}
          title={
            activePet ? "Lo que sueles darle" : "Productos que las familias recompran"
          }
          products={railProducts}
          href="/categoria/todo"
          linkLabel="Ver todo"
        />
      </Section>

      {/* ── Recordatorio de salud (ÚNICA aparición: no se repite en PDP/perfil, U072) ── */}
      {activePet && (
        <Section spacing="md" tone="canvas" className="pt-0">
          <RecommendationCard
            eyebrow={`Pensado para ${speciesNoun}`}
            title="¿Ya le toca la desparasitación?"
            description="Según su peso y la época del año, conviene revisar el calendario antiparasitario. Te ayudamos a elegir el correcto."
            reason="Lo sugerimos por su peso (8 kg) y porque pasaron varios meses desde tu última compra de farmacia. Es un recordatorio, no un diagnóstico."
            media={<span className="text-4xl">💊</span>}
            action={
              <Button variant="secondary" asChild>
                <Link href="/categoria/farmacia">Ver opciones de farmacia</Link>
              </Button>
            }
          />
        </Section>
      )}
    </AppShell>
  );
}
