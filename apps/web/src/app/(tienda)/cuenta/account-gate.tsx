"use client";

import { Section } from "@/components/ui/section";
import { Stack } from "@/components/ui/stack";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/components/providers";
import { GuestAccountPrompt } from "./guest-account-prompt";

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
      <GuestAccountPrompt
        title="Inicia sesión para ver esto"
        description="Entra a tu cuenta para ver tus pedidos y tus direcciones."
      />
    );
  }

  return <>{children}</>;
}
