"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BellRing, ShoppingBag, ShieldCheck, Check } from "lucide-react";
import { FunnelShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PetAvatar } from "@/components/pet/pet-avatar";
import { useSession, usePet } from "@/components/providers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Registro "valor primero" (Fase 3.3B): se pide la cuenta DESPUÉS de construir
 * el perfil y ver la recomendación, enmarcado como **guardar** lo ya logrado
 * (pico de motivación, mínima fricción). Solo nombre + email; explica el
 * beneficio de la cuenta. "Ya tengo cuenta" lleva al login.
 */
export function RegisterView() {
  const router = useRouter();
  const { status, signUp } = useSession();
  const { activePet } = usePet();

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ firstName?: string; email?: string }>({});

  // Si ya hay sesión, no tiene sentido registrarse: al carrito.
  useEffect(() => {
    if (status === "authenticated") router.replace("/carrito");
  }, [status, router]);
  if (status === "authenticated") return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!firstName.trim()) next.firstName = "Cuéntanos tu nombre";
    if (!EMAIL_RE.test(email)) next.email = "Revisa tu correo";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    signUp({ firstName, email });
    router.push("/carrito");
  }

  const petName = activePet?.name;

  return (
    <FunnelShell exitHref="/">
      <Section spacing="md" containerSize="default">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
          {/* Formulario */}
          <Stack gap={6} className="max-w-md">
            <Stack gap={2}>
              <h1 className="heading-1 text-text-primary">
                {petName ? `Guarda el perfil de ${petName}` : "Crea tu cuenta"}
              </h1>
              <p className="body-m text-text-secondary">
                Crea tu cuenta para guardar {petName ? `lo que armamos para ${petName}` : "el perfil de tu mascota"} y
                que podamos anticiparnos a lo que necesita. Es gratis y toma 1 minuto.
              </p>
            </Stack>

            <form onSubmit={submit} noValidate>
              <Stack gap={4}>
                <Input
                  label="Tu nombre"
                  placeholder="Ej: Carlos"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  error={errors.firstName}
                  required
                />
                <Input
                  type="email"
                  label="Correo"
                  placeholder="tucorreo@ejemplo.cl"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  hint="Te avisamos por aquí antes de que se le acabe la comida."
                  error={errors.email}
                  required
                />
                <Button type="submit" size="lg" block>
                  Crear cuenta y continuar
                </Button>
              </Stack>
            </form>

            <p className="text-sm text-text-secondary">
              ¿Ya tienes cuenta?{" "}
              <Link href="/ingresar" className="font-semibold text-text-brand underline-offset-2 hover:underline">
                Inicia sesión
              </Link>
            </p>
            <p className="text-[13px] text-text-muted">
              Tus datos y los de tu mascota son privados y solo se usan para cuidarla mejor.
            </p>
          </Stack>

          {/* Lo que estás guardando */}
          <aside className="rounded-[var(--radius-xl)] border border-border-default bg-surface p-6 lg:sticky lg:top-24">
            {activePet && (
              <Row gap={3} className="border-b border-border-default pb-4">
                <PetAvatar pet={activePet} size="lg" />
                <div>
                  <p className="overline text-text-brand">Su perfil queda guardado</p>
                  <p className="pet-name text-xl">{activePet.name}</p>
                </div>
              </Row>
            )}
            <Stack gap={3} className="mt-4">
              <Benefit icon={<BellRing className="size-4" aria-hidden />} title="Anticipación" body="Te avisamos antes de que se le acabe la comida." />
              <Benefit icon={<ShoppingBag className="size-4" aria-hidden />} title="Todo a mano" body="Tu pedido, suscripción y recompra en un toque." />
              <Benefit icon={<ShieldCheck className="size-4" aria-hidden />} title="Sin compromisos" body="Pausa o cancela cuando quieras, sin permanencia." />
            </Stack>
          </aside>
        </div>
      </Section>
    </FunnelShell>
  );
}

function Benefit({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Row gap={3} align="start">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-miel-700" aria-hidden>
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-text-primary">
          <Check className="size-3.5 text-success-strong" aria-hidden /> {title}
        </span>
        <span className="text-[13px] text-text-secondary">{body}</span>
      </span>
    </Row>
  );
}
