"use client";

import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { usePet } from "@/components/providers";

/**
 * Llamado de cuenta para el visitante anónimo en las superficies privadas
 * (`/cuenta` y sus secciones). Fuente única para no divergir entre pantallas.
 *
 * Continuidad del journey: si el onboarding YA está en progreso (hay una mascota
 * activa de invitado en memoria), invita a **formalizar la cuenta** conservando
 * esa mascota (`Crear cuenta` → `/crear-cuenta`, que ya la adopta al registrar),
 * en vez de mandar a `/comenzar` y reiniciar el alta desde el paso 1. Sin mascota
 * en curso, mantiene el llamado clásico (Ingresar / crear el perfil).
 */
export function GuestAccountPrompt({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { activePet } = usePet();

  return (
    <Section spacing="lg">
      <EmptyState
        icon={<span className="text-5xl">🐾</span>}
        title={activePet ? `Crea tu cuenta para guardar a ${activePet.name}` : title}
        description={
          activePet
            ? "Guarda el perfil que armaste y nos anticipamos a lo que necesita. Es gratis y toma 1 minuto."
            : description
        }
        action={
          <Row gap={3} wrap justify="center">
            {activePet ? (
              <>
                <Button asChild>
                  <Link href="/crear-cuenta">Crear cuenta</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/ingresar">Ingresar</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href="/ingresar">Ingresar</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/comenzar">Crear el perfil de tu mascota</Link>
                </Button>
              </>
            )}
          </Row>
        }
      />
    </Section>
  );
}
