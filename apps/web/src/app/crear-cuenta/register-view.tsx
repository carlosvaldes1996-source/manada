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
import { Alert } from "@/components/ui/alert";
import { PetAvatar } from "@/components/pet/pet-avatar";
import { useToast } from "@/components/ui/toast";
import { useSession, usePet } from "@/components/providers";
import { useAuthActions } from "@/hooks";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/**
 * Registro "valor primero" (Fase 3.3B) con auth REAL de Medusa (Fase 5 · Etapa A):
 * se pide la cuenta enmarcada como **guardar** lo ya logrado (pico de motivación).
 * Crea un cliente real (emailpass), transfiere el carrito de invitado y deja la
 * sesión iniciada. "Ya tengo cuenta" lleva al login.
 */
export function RegisterView({
  defaultEmail = "",
  defaultName = "",
}: {
  defaultEmail?: string;
  defaultName?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { status } = useSession();
  const { register } = useAuthActions();
  const { activePet } = usePet();

  const [firstName, setFirstName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ firstName?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión, no tiene sentido registrarse: al carrito.
  useEffect(() => {
    if (status === "authenticated") router.replace("/carrito");
  }, [status, router]);
  if (status === "authenticated") return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setFormError(null);
    const next: typeof errors = {};
    if (!firstName.trim()) next.firstName = "Cuéntanos tu nombre";
    if (!EMAIL_RE.test(email)) next.email = "Revisa tu correo";
    if (password.length < MIN_PASSWORD) next.password = `Mínimo ${MIN_PASSWORD} caracteres`;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const { ok, error } = await register({ firstName, email, password });
    if (ok) {
      toast({ title: "¡Cuenta creada!", description: "Ya eres parte de la manada.", variant: "success" });
      router.push("/carrito");
    } else {
      setFormError(error ?? "No pudimos crear tu cuenta.");
      setLoading(false);
    }
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

            {formError && <Alert variant="error">{formError}</Alert>}

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
                <Input
                  type="password"
                  label="Contraseña"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  hint={`Mínimo ${MIN_PASSWORD} caracteres.`}
                  error={errors.password}
                  required
                />
                <Button type="submit" size="lg" block loading={loading}>
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
