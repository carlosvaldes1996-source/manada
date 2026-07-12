"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  PartyPopper,
  Sparkles,
  PawPrint,
  Pill,
  ArrowRight,
  BellRing,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
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
import { petFoodAnticipation } from "@/lib/anticipation";
import { formatDeliveryDate } from "@/lib/format";
import { fadeInUp } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import type { Product } from "@/types";

/**
 * Bienvenida al ecosistema (cierre del embudo de activación). Celebra que el
 * perfil quedó creado y demuestra que Manada YA se anticipa: cápsula de
 * anticipación activa para la mascota recién registrada + próximos pasos.
 *
 * La cápsula se deriva del alimento REALMENTE asignado a la mascota
 * (`currentFoodId` + `petFoodAnticipation`, seam B6) — la misma fuente única que
 * dashboard/perfil, no una recomendación re-derivada: refleja lo que la persona
 * efectivamente pidió (si no pidió alimento, no inventamos una anticipación).
 *
 * **Variante invitado** (compra sin cuenta): confirma el pedido y — en el pico
 * de motivación post-compra — ofrece guardar la compra creando la cuenta con
 * el correo ya escrito (registro "valor primero"). Nunca bloquea: puede seguir
 * explorando como invitado.
 */
export function BienvenidaView({ products }: { products: Product[] }) {
  const router = useRouter();
  const { user, status, guest } = useSession();
  const { activePet, foodAssignedAt } = usePet();
  const { toast } = useToast();
  const reduced = usePrefersReducedMotion();

  // Su alimento real (asignado al sumar al pedido — B6/O5) + anticipación derivada.
  const food = activePet?.currentFoodId
    ? products.find((p) => p.id === activePet.currentFoodId)
    : undefined;
  const anticipation =
    activePet && food ? petFoodAnticipation(activePet, food, foodAssignedAt[activePet.id]) : null;

  // Entrada directa sin sesión NI compra de invitado → al inicio.
  const bounce = status === "anonymous" && !guest;
  useEffect(() => {
    if (bounce) router.replace("/");
  }, [bounce, router]);
  if (bounce) return null;

  // ── Variante invitado: pedido confirmado + invitación a guardar la compra ──
  if (status === "anonymous" && guest) {
    return (
      <AppShell>
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
              <Badge variant="success">
                <PartyPopper className="size-3.5" aria-hidden /> Pedido confirmado
              </Badge>
              <h1 className="display-l text-text-primary">
                ¡Gracias, {guest.firstName}! Tu pedido está en camino
              </h1>
              <p className="body-l text-text-secondary">
                Te escribiremos a <strong className="text-text-primary">{guest.email}</strong> con la
                confirmación de tu pedido. Compraste como invitado, sin cuenta ni compromisos.
              </p>
            </Stack>
          </motion.div>
        </Section>

        {/* El momento "valor primero": guardar lo comprado en una cuenta */}
        <Section spacing="md" tone="canvas">
          <div className="mx-auto max-w-2xl rounded-[var(--radius-xl)] border border-border-default bg-surface p-6">
            <Stack gap={4}>
              <Stack gap={1}>
                <h2 className="heading-3 text-text-primary">¿Guardamos tu compra en una cuenta?</h2>
                <p className="body-m text-text-secondary">
                  Con tu correo ya escrito, es un clic. Sin contraseñas raras ni spam.
                </p>
              </Stack>
              <Stack gap={2}>
                <GuestPerk icon={<ShoppingBag className="size-4" aria-hidden />} text="Sigue tu pedido y repite la compra en un toque." />
                <GuestPerk icon={<BellRing className="size-4" aria-hidden />} text="Si registras a tu mascota, te avisamos antes de que se le acabe la comida." />
                <GuestPerk icon={<ShieldCheck className="size-4" aria-hidden />} text="Tus datos son privados y puedes borrar la cuenta cuando quieras." />
              </Stack>
              <Row gap={3} wrap>
                <Button size="lg" asChild>
                  <Link
                    href={`/crear-cuenta?email=${encodeURIComponent(guest.email)}&nombre=${encodeURIComponent(guest.firstName)}`}
                  >
                    Crear mi cuenta
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <Link href="/categoria/todo">Seguir explorando</Link>
                </Button>
              </Row>
            </Stack>
          </div>
        </Section>
      </AppShell>
    );
  }

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
              {activePet
                ? "Su perfil quedó guardado y tu primer pedido está en camino. Desde ahora nos adelantamos a lo que necesita para que nunca le falte nada."
                : "Tu cuenta quedó creada y tu pedido está en camino. Cuando registres a tu mascota, nos adelantaremos a lo que necesita."}
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

      {/* ── Prueba de que ya nos anticipamos (solo si pidió alimento: honesto) ── */}
      {activePet && food && anticipation && (
        <Section spacing="md" tone="canvas">
          <Stack gap={4} className="mx-auto max-w-3xl">
            <span className="overline inline-flex items-center gap-1.5 text-text-brand">
              <Sparkles className="size-3.5" aria-hidden /> Lo primero que hicimos por {petName}
            </span>
            <AnticipationCapsule
              petName={activePet.name}
              daysLeft={anticipation.daysLeft}
              percentLeft={anticipation.percentLeft}
              runOutDate={anticipation.runOutDate}
              reason={`Lo calculamos con su peso (${activePet.weightKg} kg) y el saco que acabas de pedir (${food.format}). Te avisaremos antes de que se acabe.`}
              onReschedule={(date) =>
                toast({
                  title: "Entrega reagendada",
                  description: `Llegará ${formatDeliveryDate(date)} para que a ${petName} no le falte.`,
                  variant: "success",
                })
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
            {activePet ? (
              <NextStep
                icon={<PawPrint className="size-5" aria-hidden />}
                tone="brand"
                title={`Completa el perfil de ${petName}`}
                body="Una foto y un par de datos más nos dejan cuidarlo aún mejor."
                href="/cuenta/mascotas"
                cta="Ir a su perfil"
              />
            ) : (
              <NextStep
                icon={<PawPrint className="size-5" aria-hidden />}
                tone="brand"
                title="Crea el perfil de tu mascota"
                body="Con su especie, peso y edad nos anticipamos a lo que necesita."
                href="/comenzar"
                cta="Crear su perfil"
              />
            )}
            <NextStep
              icon={<ShoppingBag className="size-5" aria-hidden />}
              tone="accent"
              title="Sigue tu pedido"
              body="Revisa su estado cuando quieras. Te avisaremos en cada paso hasta tu puerta."
              href="/cuenta/pedidos"
              cta="Ver mis pedidos"
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

/** Beneficio corto de crear cuenta (vista invitado). */
function GuestPerk({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Row gap={3} align="start">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-text-brand" aria-hidden>
        {icon}
      </span>
      <span className="text-sm text-text-secondary">{text}</span>
    </Row>
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
