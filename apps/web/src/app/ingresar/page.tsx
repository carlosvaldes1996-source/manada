"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { FunnelShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";
import { useAuthActions } from "@/hooks";

/**
 * Ingresar — login del usuario que ya tiene cuenta y entrada **demo**.
 *
 * Sin backend (D13): el formulario y el acceso demo entran como "Carlos" y
 * siembran a Toby + su carrito (useAuthActions.enterDemo), para revisar intacta
 * la app logueada ya aprobada (Etapas 1–2). El visitante sin cuenta es derivado
 * al embudo de activación. La auth real llega en Fase 4.
 */
export default function IngresarPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { enterDemo } = useAuthActions();
  const [loading, setLoading] = useState(false);

  function enter(message: string) {
    setLoading(true);
    enterDemo();
    toast({ title: message, description: "Bienvenido de vuelta a tu manada.", variant: "success" });
    router.push("/");
  }

  return (
    <FunnelShell exitHref="/">
      <Section spacing="lg" containerSize="prose">
        <Stack gap={6} className="mx-auto max-w-md">
          <Stack gap={2}>
            <h1 className="heading-1 text-text-primary">Hola de nuevo 🐾</h1>
            <p className="body-m text-text-secondary">Entra para ver lo que preparamos para tu mascota.</p>
          </Stack>

          {/* Acceso demo destacado (sin backend) */}
          <Button
            size="lg"
            block
            loading={loading}
            leadingIcon={<Sparkles className="size-4" aria-hidden />}
            onClick={() => enter("Sesión demo iniciada")}
          >
            Entrar como Carlos (demo)
          </Button>

          <Row gap={3} className="text-[13px] text-text-muted">
            <Separator className="flex-1" />
            <span>o con tu correo</span>
            <Separator className="flex-1" />
          </Row>

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              enter("¡Hola de nuevo!");
            }}
          >
            <Input type="email" label="Correo" placeholder="tucorreo@ejemplo.cl" autoComplete="email" required />
            <Input type="password" label="Contraseña" placeholder="••••••••" autoComplete="current-password" required />
            <Button type="submit" variant="secondary" block loading={loading}>
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
