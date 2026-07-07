"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FunnelShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { useAuthActions } from "@/hooks";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Ingresar — login REAL del cliente (Fase 5 · Etapa A). Auth nativo de Medusa
 * (emailpass): al iniciar sesión se transfiere el carrito de invitado a la cuenta
 * y la sesión queda persistida (JWT del SDK). El visitante sin cuenta es derivado
 * al embudo de activación. La compra como invitado sigue disponible sin ingresar.
 */
export default function IngresarPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuthActions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setFormError(null);
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email)) next.email = "Revisa tu correo";
    if (!password) next.password = "Ingresa tu contraseña";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    const { ok, error } = await login(email, password);
    if (ok) {
      toast({ title: "¡Hola de nuevo!", description: "Bienvenido de vuelta a tu manada.", variant: "success" });
      router.push("/");
    } else {
      setFormError(error ?? "No pudimos iniciar tu sesión.");
      setLoading(false);
    }
  }

  return (
    <FunnelShell exitHref="/">
      <Section spacing="lg" containerSize="prose">
        <Stack gap={6} className="mx-auto max-w-md">
          <Stack gap={2}>
            <h1 className="heading-1 text-text-primary">Hola de nuevo 🐾</h1>
            <p className="body-m text-text-secondary">Entra para ver lo que preparamos para tu mascota.</p>
          </Stack>

          {formError && <Alert variant="error">{formError}</Alert>}

          <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
            <Input
              type="email"
              label="Correo"
              placeholder="tucorreo@ejemplo.cl"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />
            <Input
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
            />
            <div className="-mt-1 text-right">
              <Link href="/recuperar" className="text-[13px] font-semibold text-text-brand underline-offset-2 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Button type="submit" size="lg" block loading={loading}>
              Ingresar
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            ¿No tienes cuenta?{" "}
            <Link href="/comenzar" className="font-semibold text-text-brand hover:underline">
              Crea el perfil de tu mascota
            </Link>
          </p>
        </Stack>
      </Section>
    </FunnelShell>
  );
}
