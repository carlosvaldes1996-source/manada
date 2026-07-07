import Link from "next/link";
import {
  Sparkles,
  BellRing,
  Truck,
  ShieldCheck,
  RefreshCw,
  Heart,
  Brain,
  Check,
  CalendarClock,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Grid } from "@/components/ui/grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FeatureCard } from "@/components/ui/feature-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { CategoryCard } from "@/components/commerce/category-card";
import { ProductRail } from "@/components/commerce/product-rail";
import { CATEGORIES } from "@/lib/catalog";
import { TOBY_ANTICIPATION } from "@/lib/demo-data";
import type { Product } from "@/types";

/**
 * Landing del visitante anónimo (Fase 3.3B · resuelve U041/U058).
 *
 * Responde en <5s qué es Manada, por qué es diferente, por qué confiar y qué
 * problema resuelve. Vende **tranquilidad**, no productos. Una sola acción
 * primaria ("Crear el perfil de tu mascota") repetida; "Ingresar" como salida
 * secundaria. Voz de marca: cálida, experta, tuteo chileno (BRANDING §4).
 */
export function LandingView({ products }: { products: Product[] }) {
  return (
    <AppShell variant="marketing">
      {/* ── Hero: propuesta de valor + prueba del "se anticipa" ── */}
      <Section spacing="lg" tone="brand">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Stack gap={6}>
            <Badge variant="brand">
              <Sparkles className="size-3.5" aria-hidden />
              Tienda de mascotas con anticipación
            </Badge>
            <Stack gap={4}>
              <h1 className="display-xl text-text-primary">
                Conocemos a tu mascota como nadie y nos{" "}
                <span className="text-text-brand">anticipamos</span> a lo que necesita.
              </h1>
              <p className="body-l max-w-xl text-text-secondary">
                Cuéntanos de tu compañero una sola vez. Calculamos cuánto come, te avisamos
                antes de que se le acabe la comida y se la dejamos en la puerta. Tú tranquilo;
                nosotros nos adelantamos.
              </p>
            </Stack>
            <Row gap={3} wrap>
              <Button size="lg" asChild>
                <Link href="/comenzar">Crear el perfil de tu mascota</Link>
              </Button>
              {/* Puerta a la tienda sin cuenta (e-commerce como piso);
                  "Ingresar" vive en el header. */}
              <Button size="lg" variant="secondary" asChild>
                <Link href="/categoria/todo">Explorar la tienda</Link>
              </Button>
            </Row>
            <Row gap={4} wrap className="text-[13px] text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-success-strong" aria-hidden /> Gratis y en 2 minutos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-success-strong" aria-hidden /> Sin permanencia
              </span>
            </Row>
          </Stack>

          {/* Prueba visual del momento mágico (estática; foto real = Polish U090) */}
          <div className="relative">
            <div className="rounded-[var(--radius-xl)] border border-terracota-100 bg-surface p-6 shadow-md">
              <span className="overline inline-flex items-center gap-1.5 text-text-brand">
                <Sparkles className="size-3.5" aria-hidden /> Para Toby 🐾
              </span>
              <h2 className="heading-3 mt-1 text-text-primary">
                A <span className="pet-name">Toby</span> le quedan ~{TOBY_ANTICIPATION.daysLeft} días de comida
              </h2>
              <p className="body-s mt-1 text-text-secondary">
                Lo calculamos por su peso y su última compra. ¿La reagendamos para que no le falte?
              </p>
              <div className="mt-4 flex items-center gap-3">
                {/* Misma fuente única de anticipación que la app (U040/U056) */}
                <Progress
                  value={TOBY_ANTICIPATION.percentLeft}
                  tone="miel"
                  label={`Queda ~${TOBY_ANTICIPATION.percentLeft}% del saco`}
                  animateIn
                  className="h-2.5 max-w-[200px] bg-neutral-300"
                />
                <span className="price text-[13px] font-semibold text-urgency">
                  ~{TOBY_ANTICIPATION.percentLeft}%
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="subscribe">
                  <CalendarClock className="size-3.5" aria-hidden /> Llega el martes
                </Badge>
                <Badge variant="success">Despacho gratis</Badge>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Vitrina: se puede comprar desde ya, sin cuenta ── */}
      <Section spacing="md" tone="canvas">
        <ProductRail
          overline="La vitrina"
          title="Lo que más recompran las familias"
          products={products.filter((p) => p.stock > 0).slice(0, 6)}
          href="/categoria/todo"
          linkLabel="Ver toda la tienda"
        />
      </Section>

      {/* ── Cómo funciona: Conocimiento → Anticipación → Amor (arquitectura de marca) ── */}
      <Section spacing="md" tone="canvas">
        <Stack gap={6}>
          <SectionHeading
            overline="Cómo funciona"
            title="Tres pasos para no preocuparte nunca más"
            description="Mientras más sabemos de tu mascota, mejor cuidamos de ella."
          />
          <Grid cols={1} md={3} gap={4}>
            <FeatureCard
              tone="brand"
              eyebrow={
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-terracota-200">01</span>
                  <span className="overline text-text-brand">Paso 1</span>
                </div>
              }
              icon={<Brain className="size-5" aria-hidden />}
              title="La conoces, la conocemos"
              description="Registras a tu mascota: especie, peso, edad y su comida. Con eso ya sabemos qué le sirve y qué no."
            />
            <FeatureCard
              tone="accent"
              eyebrow={
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-terracota-200">02</span>
                  <span className="overline text-text-brand">Paso 2</span>
                </div>
              }
              icon={<BellRing className="size-5" aria-hidden />}
              title="Nos anticipamos"
              description="Calculamos cuánto come al día y te avisamos justo antes de que se le acabe. Sin apuros de último minuto."
            />
            <FeatureCard
              tone="pino"
              eyebrow={
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-terracota-200">03</span>
                  <span className="overline text-text-brand">Paso 3</span>
                </div>
              }
              icon={<Heart className="size-5" aria-hidden />}
              title="Nunca le falta nada"
              description="Recibe su comida en la puerta, a tiempo, con la opción de suscribirte y ahorrar. Pausas o cancelas cuando quieras."
            />
          </Grid>
        </Stack>
      </Section>

      {/* ── La tranquilidad que vendemos ── */}
      {/* Banda editorial inset con esquinas redondeadas (U089): el bloque
          oscuro entra como pieza intencional, no como corte abrupto. */}
      <Section
        spacing="md"
        tone="inverse"
        className="mx-3 my-4 rounded-[var(--radius-xl)] sm:mx-6 lg:mx-10"
      >
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr]">
          <Stack gap={4}>
            <span className="overline text-miel-300">La promesa</span>
            <h2 className="display-l text-white">
              Que nunca le falte comida a tu mascota.
            </h2>
            <p className="body-l max-w-xl text-neutral-300">
              No vendemos sacos de comida. Vendemos la certeza de que tu regalón siempre va a
              tener su plato lleno, sin que tengas que estar pendiente. Esa es la diferencia.
            </p>
            <Row gap={3} wrap className="pt-2">
              <Button size="lg" asChild>
                <Link href="/comenzar">Empezar ahora</Link>
              </Button>
            </Row>
          </Stack>
          <Grid cols={1} sm={2} gap={3}>
            <TrustItem icon={<Truck className="size-5" aria-hidden />} title="Despacho honesto" body="Ves el costo real de despacho antes de pagar, sin sorpresas al final." />
            <TrustItem icon={<RefreshCw className="size-5" aria-hidden />} title="Sin permanencia" body="Pausas, adelantas o cancelas tu suscripción cuando quieras, sin costo." />
            <TrustItem icon={<ShieldCheck className="size-5" aria-hidden />} title="Compra sin sorpresas" body="Pagas por transferencia con los datos que te enviamos y coordinamos el despacho contigo." />
            <TrustItem icon={<Heart className="size-5" aria-hidden />} title="Hecho con cariño" body="Recomendaciones pensadas para tu mascota, no para vaciar la bodega." />
          </Grid>
        </div>
      </Section>

      {/* ── Categorías (navegación por necesidad) ── */}
      <Section spacing="md" tone="subtle">
        <Stack gap={6}>
          <SectionHeading overline="Todo en un lugar" title="Comida, accesorios y farmacia" />
          <Grid cols={2} md={4} gap={4}>
            {CATEGORIES.slice(0, 4).map((c) => (
              <CategoryCard
                key={c.id}
                label={c.label}
                href={`/categoria/${c.slug}`}
                description={c.description}
                icon={<span className="text-3xl">{c.emoji}</span>}
              />
            ))}
          </Grid>
        </Stack>
      </Section>

      {/* ── CTA final ── */}
      <Section spacing="lg" tone="brand" className="bg-terracota-100">
        <Stack gap={5} align="center" className="mx-auto max-w-2xl text-center">
          <h2 className="display-l text-text-primary">
            Empieza por conocer mejor a quien más quieres.
          </h2>
          <p className="body-l text-text-secondary">
            Crea su perfil en 2 minutos y mira cómo Manada se adelanta a lo que necesita.
          </p>
          <Stack gap={3} align="center">
            <Button size="lg" asChild>
              <Link href="/comenzar">Crear el perfil de tu mascota</Link>
            </Button>
            <p className="text-sm text-text-secondary">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/ingresar"
                className="font-semibold text-text-brand underline-offset-2 hover:underline"
              >
                Ingresar
              </Link>
            </p>
          </Stack>
        </Stack>
      </Section>
    </AppShell>
  );
}

/** Ítem de confianza sobre fondo oscuro (sección "tranquilidad"). */
function TrustItem({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-neutral-700 bg-white/[0.03] p-4">
      <span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-miel-500/15 text-miel-300" aria-hidden>
        {icon}
      </span>
      <span className="text-[15px] font-semibold text-white">{title}</span>
      <span className="text-[13px] text-neutral-400">{body}</span>
    </div>
  );
}
