"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bone, Cookie, Sparkles, Stethoscope } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { useToast } from "@/components/ui/toast";
import {
  PetStatusCard,
  PetActionGrid,
  PetAvatar,
  FoodSelectorDialog,
  type PetAction,
} from "@/components/pet";
import { ProductCard, QuickBuyCard, CategoryTiles } from "@/components/commerce";
import { AppShell } from "@/components/layout";
import { useCart, usePet, usePlanManage, useSession, useSubscriptions } from "@/components/providers";
import { petFoodAnticipation } from "@/lib/anticipation";
import { recommendComplements } from "@/lib/recommend";
import type { Product } from "@/types";

/**
 * Home logueada = centro de control de la mascota (no una landing: el usuario
 * ya conoce Manada). El primer viewport responde tres preguntas y nada más:
 * ¿cómo está? (PetStatusCard) · ¿hay algo que comprar? (acción dominante
 * "Pedir de nuevo", a carrito en un tap) · ¿qué puedo hacer ahora?
 * (PetActionGrid, sistema escalable a servicios). Después: pocos productos
 * muy relevantes ("nos adelantamos"), recompra rápida, y el catálogo al
 * final — el usuario logueado viene por su mascota, no por un catálogo.
 */
export function DashboardView({ products }: { products: Product[] }) {
  const { activePet, foodAssignedAt } = usePet();
  const { user } = useSession();
  const { activeForProduct, refresh: refreshSubscriptions } = useSubscriptions();
  const { open: openPlanManage } = usePlanManage();
  const { addItem } = useCart();

  // La Home es el centro del plan: re-hidrata las suscripciones al entrar, para
  // reflejar un plan recién creado (el subscriber de checkout es asíncrono; al
  // llegar aquí ya terminó) sin depender de un re-login. El guard del provider
  // evita fetches duplicados con la hidratación de sesión.
  useEffect(() => {
    void refreshSubscriptions();
  }, [refreshSubscriptions]);
  const { toast } = useToast();
  const router = useRouter();
  // Definir qué come ≠ comprar (D39): el selector asigna sin tocar el carrito.
  const [foodOpen, setFoodOpen] = useState(false);
  const [reordering, setReordering] = useState(false);

  const firstName = user?.firstName ?? "";

  // Su alimento asignado (catálogo real) + anticipación derivada (B6): solo
  // anticipamos con alimento y peso conocidos — sin números inventados.
  const currentFood = activePet?.currentFoodId
    ? products.find((p) => p.id === activePet.currentFoodId)
    : undefined;
  const anticipation =
    activePet && currentFood
      ? petFoodAnticipation(activePet, currentFood, foodAssignedAt[activePet.id])
      : null;

  // Plan de suscripción ACTIVO para su alimento (D56·C): si existe, la card pasa a
  // "centro del plan". Match por producto (product_id === currentFoodId).
  const subscription = activeForProduct(activePet?.currentFoodId);

  // Pocos y muy relevantes (sin carrusel): cuidado de su especie, no alimento.
  const complements = activePet ? recommendComplements(activePet, products, 4) : [];

  // Recompra en dos clics: tap 1 deja su alimento en el carrito, tap 2 es pagar.
  async function reorder() {
    if (!activePet || !currentFood) return;
    if (!currentFood.variantId) {
      router.push(`/producto/${currentFood.slug}`);
      return;
    }
    setReordering(true);
    try {
      await addItem(currentFood);
      toast({
        title: `El alimento de ${activePet.name} ya está en tu carrito`,
        description: `${currentFood.brand.name} · ${currentFood.name}${currentFood.format ? ` · ${currentFood.format}` : ""}`,
        variant: "success",
        action: { label: "Ir a pagar", onClick: () => router.push("/carrito") },
      });
    } finally {
      setReordering(false);
    }
  }

  // Necesidades, no departamentos: navegación por intención ("¿qué necesita?").
  // Escalable sin rediseñar: hoy "Salud" abre farmacia; mañana la misma tile
  // abre veterinario, vacunas o seguro. Los tiles son datos, no layout.
  const actions: PetAction[] = activePet
    ? [
        currentFood
          ? {
              key: "alimentacion",
              label: "Alimentación",
              hint: [currentFood.brand.name, currentFood.format].filter(Boolean).join(" · "),
              icon: <Bone className="size-4" />,
              href: `/producto/${currentFood.slug}`,
            }
          : {
              key: "alimentacion",
              label: "Alimentación",
              hint: "¿Qué come?",
              icon: <Bone className="size-4" />,
              onSelect: () => setFoodOpen(true),
            },
        {
          key: "salud",
          label: "Salud",
          hint: "Farmacia y prevención",
          icon: <Stethoscope className="size-4" />,
          href: "/categoria/farmacia",
        },
        {
          key: "cuidado",
          label: "Cuidado",
          hint: "Higiene y baño",
          icon: <Sparkles className="size-4" />,
          href: "/categoria/higiene",
        },
        {
          key: "diversion",
          label: "Diversión",
          hint: "Premios y snacks",
          icon: <Cookie className="size-4" />,
          href: "/categoria/snacks",
        },
        {
          key: "perfil",
          label: `Ver a ${activePet.name}`,
          hint: "Su perfil",
          icon: <PetAvatar pet={activePet} size="xs" />,
          href: "/cuenta/mascotas",
        },
      ]
    : [];

  return (
    <AppShell>
      {/* ── 1 · Centro de control: estado + acción, todo en el primer viewport
             (ritmo propio, más corto que spacing="sm": aquí cada px vertical
             compite con el CTA y las acciones rápidas) ── */}
      <Section spacing="none" className="py-6 lg:py-8">
        <Stack gap={4}>
          <span className="overline text-text-brand">Hola, {firstName} 👋</span>
          {activePet ? (
            <>
              <PetStatusCard
                pet={activePet}
                food={currentFood}
                anticipation={anticipation}
                subscription={subscription}
                onReorder={currentFood ? reorder : undefined}
                reorderPending={reordering}
                onDefineFood={() => setFoodOpen(true)}
                onManage={subscription ? () => openPlanManage(subscription) : undefined}
              />
              <Stack gap={2}>
                <h2 className="heading-4 text-text-primary">
                  ¿Qué necesita {activePet.name}?
                </h2>
                <PetActionGrid actions={actions} />
              </Stack>
            </>
          ) : (
            <div className="rounded-[var(--radius-xl)] border border-terracota-100 bg-brand-soft p-6">
              <Stack gap={3}>
                <h1 className="heading-2 text-text-primary">
                  Cuidemos juntos a tu compañero
                </h1>
                <p className="body-m max-w-xl text-text-secondary">
                  Crea su perfil y nos anticipamos a lo que necesita: comida, salud y más.
                </p>
                <Row gap={3} wrap>
                  <Button asChild>
                    <Link href="/comenzar">Crear perfil de mascota</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/categoria/todo">Explorar la tienda</Link>
                  </Button>
                </Row>
              </Stack>
            </div>
          )}
        </Stack>
      </Section>

      {/* ── 2 · Nos adelantamos: pocos productos, muy relevantes ── */}
      {activePet && complements.length > 0 && (
        <Section spacing="sm" className="pt-0">
          <Stack gap={4}>
            <SectionHeading
              as="h2"
              overline={`Para ${activePet.name}`}
              title="Pensamos que también podría necesitar"
            />
            <Grid cols={2} md={4} gap={4}>
              {complements.map((p) => (
                <ProductCard key={p.id} product={p} showSubscribe={false} />
              ))}
            </Grid>
          </Stack>
        </Section>
      )}

      {/* Sin mascota: recomendación genérica honesta mientras no la conocemos. */}
      {!activePet && products.length > 0 && (
        <Section spacing="sm" className="pt-0">
          <Stack gap={4}>
            <SectionHeading
              as="h2"
              overline="Recomendado"
              title="Lo que las familias recompran"
            />
            <Grid cols={2} md={4} gap={4}>
              {products.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} showSubscribe={false} />
              ))}
            </Grid>
          </Stack>
        </Section>
      )}

      {/* ── 3 · Lo de siempre: recompra rápida sin pasar por el catálogo ── */}
      {activePet && currentFood && (
        <Section spacing="sm" className="pt-0">
          <Stack gap={4}>
            <SectionHeading
              as="h2"
              overline="Recompra rápida"
              title={`Lo de siempre de ${activePet.name}`}
            />
            <QuickBuyCard product={currentFood} />
          </Stack>
        </Section>
      )}

      {/* ── 4 · Explorar: el catálogo pasa al final (viene por su mascota) ── */}
      <Section spacing="sm" tone="subtle">
        <Stack gap={4}>
          <SectionHeading
            as="h2"
            overline="Explorar"
            title="¿Buscas algo más?"
            href="/categoria/todo"
            linkLabel="Ver todo el catálogo"
          />
          <CategoryTiles />
        </Stack>
      </Section>

      {activePet && (
        <FoodSelectorDialog
          pet={activePet}
          products={products}
          open={foodOpen}
          onOpenChange={setFoodOpen}
        />
      )}
    </AppShell>
  );
}
