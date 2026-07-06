import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, PackageCheck, Truck } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "¡Compra confirmada!" };

/**
 * Confirmación post-compra (Fase 5 · Etapa 3, D24). La orden ya está creada en
 * Medusa (visible en el Admin). Pago manual: coordinamos la transferencia y
 * preparamos el despacho a mano. Server component: solo lee el nº de orden.
 */
export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ orden?: string }>;
}) {
  const { orden } = await searchParams;

  return (
    <AppShell variant="checkout">
      <Section spacing="lg">
        <Stack gap={6} align="center" className="mx-auto max-w-xl text-center">
          <span className="grid size-16 place-items-center rounded-full bg-success-soft text-[var(--success-strong)]" aria-hidden>
            <CheckCircle2 className="size-9" />
          </span>
          <Stack gap={2} align="center">
            <h1 className="display-l text-text-primary">¡Gracias por tu compra!</h1>
            {orden && (
              <p className="body-l text-text-secondary">
                Tu orden <strong className="text-text-primary">#{orden}</strong> quedó confirmada.
              </p>
            )}
          </Stack>

          <div className="w-full rounded-[var(--radius-lg)] border border-border-default bg-surface p-5 text-left">
            <Stack gap={4}>
              <Row gap={3}>
                <PackageCheck className="size-5 shrink-0 text-text-brand" aria-hidden />
                <span className="text-sm text-text-secondary">
                  Te escribiremos al correo con los <strong className="text-text-primary">datos para transferir</strong>. Apenas confirmemos el pago, preparamos tu pedido.
                </span>
              </Row>
              <Row gap={3}>
                <Truck className="size-5 shrink-0 text-text-brand" aria-hidden />
                <span className="text-sm text-text-secondary">
                  Coordinamos el <strong className="text-text-primary">despacho</strong> contigo y te avisamos cuando vaya en camino.
                </span>
              </Row>
            </Stack>
          </div>

          <Row gap={3} wrap className="justify-center">
            <Button asChild>
              <Link href="/categoria/todo">Seguir comprando</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
          </Row>
        </Stack>
      </Section>
    </AppShell>
  );
}
