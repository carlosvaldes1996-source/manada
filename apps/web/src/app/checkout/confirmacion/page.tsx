import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle, PackageCheck, Truck } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Section } from "@/components/ui/section";
import { Stack, Row } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
import { PurchaseEffects } from "./purchase-effects";

// Página post-compra, atada al retorno de Flow: nunca se indexa.
export const metadata: Metadata = {
  title: "Estado de tu compra",
  robots: { index: false, follow: false },
};

type Estado = "exito" | "pendiente" | "rechazado" | "cancelado" | "error";

/**
 * Confirmación post-pago con Flow (D58). El estado llega en la URL desde el
 * retorno de Flow (`/flow/return`), que YA verificó el pago con `payment/getStatus`
 * — la página nunca asume éxito por sí sola. `PurchaseEffects` (client) mide la
 * compra y vacía el carrito solo en éxito. Server component: solo lee la URL.
 */
export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; orden?: string }>;
}) {
  const { estado: estadoParam, orden } = await searchParams;
  const estado: Estado = normalizeEstado(estadoParam, orden);

  return (
    <AppShell variant="checkout">
      <PurchaseEffects estado={estado} orden={orden} />
      <Section spacing="lg">
        <Stack gap={6} align="center" className="mx-auto max-w-xl text-center">
          {estado === "exito" && <SuccessView orden={orden} />}
          {estado === "pendiente" && <PendingView />}
          {estado === "rechazado" && <RejectedView />}
          {estado === "cancelado" && <CanceledView />}
          {estado === "error" && <ErrorView />}
        </Stack>
      </Section>
    </AppShell>
  );
}

function normalizeEstado(estado: string | undefined, orden: string | undefined): Estado {
  if (estado === "exito" || estado === "pendiente" || estado === "rechazado" || estado === "cancelado") {
    return estado;
  }
  if (estado === "error") return "error";
  // Compat con enlaces antiguos `?orden=`: sin estado pero con orden = éxito.
  return orden ? "exito" : "pendiente";
}

/* ── Vistas por estado ─────────────────────────────────────────────────── */

function SuccessView({ orden }: { orden?: string }) {
  return (
    <>
      <span className="grid size-16 place-items-center rounded-full bg-success-soft text-[var(--success-strong)]" aria-hidden>
        <CheckCircle2 className="size-9" />
      </span>
      <Stack gap={2} align="center">
        <h1 className="display-l text-text-primary">¡Gracias por tu compra!</h1>
        {orden ? (
          <p className="body-l text-text-secondary">
            Tu orden <strong className="text-text-primary">#{orden}</strong> quedó confirmada y tu pago fue recibido.
          </p>
        ) : (
          <p className="body-l text-text-secondary">Tu pago fue recibido y tu pedido quedó confirmado.</p>
        )}
      </Stack>

      <div className="w-full rounded-[var(--radius-lg)] border border-border-default bg-surface p-5 text-left">
        <Stack gap={4}>
          <Row gap={3}>
            <PackageCheck className="size-5 shrink-0 text-text-brand" aria-hidden />
            <span className="text-sm text-text-secondary">
              Te enviamos la <strong className="text-text-primary">confirmación por correo</strong>. Ya estamos preparando tu pedido.
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
          <Link href="/cuenta/pedidos">Ver mis pedidos</Link>
        </Button>
      </Row>
    </>
  );
}

function PendingView() {
  return (
    <>
      <span className="grid size-16 place-items-center rounded-full bg-urgency-soft text-urgency-strong" aria-hidden>
        <Clock className="size-9" />
      </span>
      <Stack gap={2} align="center">
        <h1 className="display-l text-text-primary">Estamos confirmando tu pago</h1>
        <p className="body-l text-text-secondary">
          Flow está procesando tu pago. Apenas se confirme, te enviaremos el correo con tu pedido. Esto puede tardar unos minutos.
        </p>
      </Stack>
      <Row gap={3} wrap className="justify-center">
        <Button asChild>
          <Link href="/cuenta/pedidos">Ver mis pedidos</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
      </Row>
    </>
  );
}

function RejectedView() {
  return (
    <>
      <span className="grid size-16 place-items-center rounded-full bg-error-soft text-error-strong" aria-hidden>
        <XCircle className="size-9" />
      </span>
      <Stack gap={2} align="center">
        <h1 className="display-l text-text-primary">Tu pago fue rechazado</h1>
        <p className="body-l text-text-secondary">
          No se realizó ningún cobro. Puedes volver al carrito e intentar de nuevo, con este u otro medio de pago.
        </p>
      </Stack>
      <Row gap={3} wrap className="justify-center">
        <Button asChild>
          <Link href="/carrito">Volver al carrito</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
      </Row>
    </>
  );
}

function CanceledView() {
  return (
    <>
      <span className="grid size-16 place-items-center rounded-full bg-info-soft text-info-strong" aria-hidden>
        <XCircle className="size-9" />
      </span>
      <Stack gap={2} align="center">
        <h1 className="display-l text-text-primary">Cancelaste el pago</h1>
        <p className="body-l text-text-secondary">
          No se realizó ningún cobro y tu carrito sigue disponible. Cuando quieras, retoma tu compra.
        </p>
      </Stack>
      <Row gap={3} wrap className="justify-center">
        <Button asChild>
          <Link href="/carrito">Volver al carrito</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
      </Row>
    </>
  );
}

function ErrorView() {
  return (
    <>
      <span className="grid size-16 place-items-center rounded-full bg-error-soft text-error-strong" aria-hidden>
        <XCircle className="size-9" />
      </span>
      <Stack gap={2} align="center">
        <h1 className="display-l text-text-primary">Algo salió mal</h1>
        <p className="body-l text-text-secondary">
          No pudimos confirmar el estado de tu pago. Si se realizó un cobro, lo verás en tus pedidos; si no, vuelve al carrito e intenta de nuevo.
        </p>
      </Stack>
      <Row gap={3} wrap className="justify-center">
        <Button asChild>
          <Link href="/carrito">Volver al carrito</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/cuenta/pedidos">Ver mis pedidos</Link>
        </Button>
      </Row>
    </>
  );
}
