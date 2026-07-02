"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PartyPopper, Sparkles, PawPrint, RefreshCw, Pill, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { AnticipationCapsule } from "@/components/pet/anticipation-capsule";
import { PetAvatar } from "@/components/pet/pet-avatar";
import { useSession, usePet } from "@/components/providers";
import { recommendFood, foodPlan } from "@/lib/recommend";
import { fadeInUp } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/**
 * Bienvenida al ecosistema (cierre del embudo de activación). Celebra que el
 * perfil quedó creado y demuestra que Manada YA se anticipa: cápsula de
 * anticipación activa para la mascota recién registrada + próximos pasos. Cierra
 * el círculo del journey A (UX.md §5): "Creamos el perfil de {nombre}.
 * Complétalo y cuidamos el resto."
 */
export default function BienvenidaPage() {
  const router = useRouter();
  const { user, status } = useSession();
  const { activePet } = usePet();
  const { toast } = useToast();
  const reduced = usePrefersReducedMotion();

  const food = useMemo(() => (activePet ? recommendFood(activePet) : undefined), [activePet]);
  const plan = useMemo(() => (activePet && food ? foodPlan(activePet, food) : undefined), [activePet, food]);

  // Entrada directa sin sesión → al inicio.
  useEffect(() => {
    if (status === "anonymous") router.replace("/");
  }, [status, router]);
  if (status === "anonymous") return null;

  const petName = activePet?.name ?? "tu mascota";

  return (
    <AppShell>
      {/* ── Celebración ── */}
      <Section spacing="lg" tone="brand">
        <motion.div
          variants={reduced ? undefined : fadeInUp}
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "visible"}
        >
          <Stack gap={5} align="center" className="mx-auto max-w-2xl text-center">
            <span className="grid size-16 place-items-center rounded-full bg-surface text-3xl shadow-sm" aria-hidden>
              🎉
            </span>
            <Badge variant="brand">
              <PartyPopper className="size-3.5" aria-hidden /> Ya eres parte de la manada
            </Badge>
            <h1 className="display-l text-text-primary">
              ¡Listo{user?.firstName ? `, ${user.firstName}` : ""}! Ahora cuidamos a{" "}
              <span className="pet-name">{petName}</span> contigo
            </h1>
            <p className="body-l text-text-secondary">
              Su perfil quedó guardado y tu primer pedido está en camino. Desde ahora nos
              adelantamos a lo que necesita para que nunca le falte nada.
            </p>
            {activePet && (
              <Row gap={3} className="rounded-[var(--radius-pill)] border border-terracota-100 bg-surface px-4 py-2">
                <PetAvatar pet={activePet} size="sm" />
                <span className="text-sm font-semibold text-text-primary">
                  Perfil de {petName} · {activePet.completeness ?? 0}% completo
                </span>
              </Row>
            )}
          </Stack>
        </motion.div>
      </Section>

      {/* ── Prueba de que ya nos anticipamos ── */}
      {activePet && plan && (
        <Section spacing="md" tone="canvas">
          <Stack gap={4} className="mx-auto max-w-3xl">
            <span className="overline inline-flex items-center gap-1.5 text-text-brand">
              <Sparkles className="size-3.5" aria-hidden /> Lo primero que hicimos por {petName}
            </span>
            <AnticipationCapsule
              petName={activePet.name}
              daysLeft={plan.estimate.daysLeft}
              percentLeft={plan.estimate.percentLeft}
              runOutDate={plan.estimate.runOutDate}
              reason={`Lo calculamos con su peso (${activePet.weightKg} kg) y el saco que acabas de pedir. Te avisaremos antes de que se acabe.`}
              onReschedule={() =>
                toast({ title: "Te avisaremos a tiempo", description: `Un día antes de que se le acabe a ${petName}.`, variant: "success" })
              }
              onSubscribe={() => router.push("/cuenta/mascotas")}
            />
          </Stack>
        </Section>
      )}

      {/* ── Próximos pasos ── */}
      <Section spacing="md" tone="subtle">
        <Stack gap={6}>
          <h2 className="heading-2 text-text-primary">¿Qué sigue?</h2>
          <Grid cols={1} md={3} gap={4}>
            <NextStep
              icon={<PawPrint className="size-5" aria-hidden />}
              tone="brand"
              title={`Completa el perfil de ${petName}`}
              body="Una foto y un par de datos más nos dejan cuidarlo aún mejor."
              href="/cuenta/mascotas"
              cta="Ir a su perfil"
            />
            <NextStep
              icon={<RefreshCw className="size-5" aria-hidden />}
              tone="accent"
              title="Revisa tu suscripción"
              body="Ajusta la frecuencia, adelanta o pausa cuando quieras. Sin permanencia."
              href="/cuenta/mascotas"
              cta="Ver suscripción"
            />
            <NextStep
              icon={<Pill className="size-5" aria-hidden />}
              tone="pino"
              title="Explora su cuidado"
              body="Farmacia, accesorios y más, filtrado a lo que le sirve a tu mascota."
              href="/categoria/todo"
              cta="Ir a la tienda"
            />
          </Grid>
          <Row gap={3} wrap>
            <Button size="lg" asChild>
              <Link href="/">Ir a mi inicio</Link>
            </Button>
          </Row>
        </Stack>
      </Section>
    </AppShell>
  );
}

const tiles = {
  brand: "bg-brand-soft text-text-brand",
  accent: "bg-accent-soft text-miel-700",
  pino: "bg-pino-50 text-pino-700",
} as const;

function NextStep({
  icon,
  tone,
  title,
  body,
  href,
  cta,
}: {
  icon: React.ReactNode;
  tone: keyof typeof tiles;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface p-5">
      <span className={`grid size-11 place-items-center rounded-[var(--radius-md)] ${tiles[tone]}`} aria-hidden>
        {icon}
      </span>
      <h3 className="heading-4 text-text-primary">{title}</h3>
      <p className="body-s flex-1 text-text-secondary">{body}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-semibold text-text-brand underline-offset-4 hover:underline"
      >
        {cta}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
