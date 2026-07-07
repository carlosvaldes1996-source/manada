"use client";

import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useSession } from "@/components/providers";

/**
 * Compuerta de las secciones privadas de la cuenta (Fase 5 · Etapa A). Muestra un
 * esqueleto mientras resuelve la sesión persistida y un llamado a ingresar si el
 * visitante es anónimo; solo entonces renderiza el contenido (pedidos/direcciones).
 */
export function AccountGate({ children }: { children: React.ReactNode }) {
  const { status, isLoading } = useSession();

  if (isLoading) {
    return (
      <Section spacing="md">
        <Stack gap={4}>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </Stack>
      </Section>
    );
  }

  if (status !== "authenticated") {
    return (
      <Section spacing="lg">
        <EmptyState
          icon={<span className="text-5xl">🐾</span>}
          title="Inicia sesión para ver esto"
          description="Entra a tu cuenta para ver tus pedidos y tus direcciones."
          action={
            <Row gap={3} wrap justify="center">
              <Button asChild>
                <Link href="/ingresar">Ingresar</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/comenzar">Crear el perfil de tu mascota</Link>
              </Button>
            </Row>
          }
        />
      </Section>
    );
  }

  return <>{children}</>;
}
