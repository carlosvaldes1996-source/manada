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
import { resetPassword } from "@/lib/medusa";

const MIN_PASSWORD = 8;

/**
 * Fija la nueva contraseña con el token del enlace (`auth.updateProvider`, nativo).
 * Tras el cambio, el cliente va al login (la sesión se abre con la clave nueva).
 */
export function ResetPasswordView({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Enlace inválido / manipulado.
  if (!token) {
    return (
      <FunnelShell exitHref="/ingresar">
        <Section spacing="lg" containerSize="prose">
          <Stack gap={4} className="mx-auto max-w-md text-center">
            <h1 className="heading-1 text-text-primary">Enlace no válido</h1>
            <p className="body-m text-text-secondary">
              El enlace de recuperación está incompleto o venció. Pide uno nuevo.
            </p>
            <Button asChild>
              <Link href="/recuperar">Pedir un enlace nuevo</Link>
            </Button>
          </Stack>
        </Section>
      </FunnelShell>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setFormError(null);
    const next: typeof errors = {};
    if (password.length < MIN_PASSWORD) next.password = `Mínimo ${MIN_PASSWORD} caracteres`;
    if (confirm !== password) next.confirm = "Las contraseñas no coinciden";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await resetPassword(token, password);
      toast({ title: "Contraseña actualizada", description: "Ya puedes ingresar con tu nueva clave.", variant: "success" });
      router.push("/ingresar");
    } catch {
      setFormError("No pudimos actualizar tu contraseña. El enlace pudo vencer; pide uno nuevo.");
      setLoading(false);
    }
  }

  return (
    <FunnelShell exitHref="/ingresar">
      <Section spacing="lg" containerSize="prose">
        <Stack gap={6} className="mx-auto max-w-md">
          <Stack gap={2}>
            <h1 className="heading-1 text-text-primary">Crea una nueva contraseña</h1>
            <p className="body-m text-text-secondary">
              {email ? `Para la cuenta de ${email}.` : "Elige una contraseña segura."}
            </p>
          </Stack>

          {formError && <Alert variant="error">{formError}</Alert>}

          <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
            <Input
              type="password"
              label="Nueva contraseña"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint={`Mínimo ${MIN_PASSWORD} caracteres.`}
              error={errors.password}
              required
            />
            <Input
              type="password"
              label="Repite la contraseña"
              placeholder="••••••••"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors.confirm}
              required
            />
            <Button type="submit" size="lg" block loading={loading}>
              Guardar y continuar
            </Button>
          </form>
        </Stack>
      </Section>
    </FunnelShell>
  );
}
