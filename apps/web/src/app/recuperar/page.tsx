"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { FunnelShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/medusa";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Recuperar contraseña — paso 1: solicitar el enlace (Fase 5 · Etapa A).
 * Nativo (`auth.resetPassword`). Por seguridad NO revela si el correo existe:
 * siempre muestra la misma confirmación. La entrega del enlace la resuelve un
 * subscriber del backend (dev: log; prod: email transaccional, diferido).
 */
export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!EMAIL_RE.test(email)) {
      setError("Revisa tu correo");
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      await requestPasswordReset(email);
    } catch {
      // Anti-enumeración: mostramos la confirmación pase lo que pase.
    } finally {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <FunnelShell exitHref="/ingresar">
      <Section spacing="lg" containerSize="prose">
        <Stack gap={6} className="mx-auto max-w-md">
          {sent ? (
            <Stack gap={4} align="center" className="text-center">
              <span className="grid size-14 place-items-center rounded-full bg-success-soft text-[var(--success-strong)]" aria-hidden>
                <MailCheck className="size-7" />
              </span>
              <Stack gap={2}>
                <h1 className="heading-1 text-text-primary">Revisa tu correo</h1>
                <p className="body-m text-text-secondary">
                  Si <strong className="text-text-primary">{email}</strong> tiene una cuenta, te enviamos un enlace para
                  crear una nueva contraseña. Puede tardar unos minutos.
                </p>
              </Stack>
              <Button asChild variant="secondary">
                <Link href="/ingresar">Volver a ingresar</Link>
              </Button>
            </Stack>
          ) : (
            <>
              <Stack gap={2}>
                <h1 className="heading-1 text-text-primary">¿Olvidaste tu contraseña?</h1>
                <p className="body-m text-text-secondary">
                  Escribe tu correo y te enviamos un enlace para crear una nueva.
                </p>
              </Stack>
              <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
                <Input
                  type="email"
                  label="Correo"
                  placeholder="tucorreo@ejemplo.cl"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                  required
                />
                <Button type="submit" size="lg" block loading={loading}>
                  Enviarme el enlace
                </Button>
              </form>
              <p className="text-center text-sm text-text-secondary">
                ¿La recordaste?{" "}
                <Link href="/ingresar" className="font-semibold text-text-brand hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </>
          )}
        </Stack>
      </Section>
    </FunnelShell>
  );
}
