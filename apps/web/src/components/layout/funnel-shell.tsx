import Link from "next/link";
import { X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Progress } from "@/components/ui/progress";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

export interface FunnelShellProps {
  children: React.ReactNode;
  /** Paso actual (1-based) y total — pinta la barra de progreso del embudo. */
  step?: number;
  totalSteps?: number;
  /** Etiqueta del progreso ("Paso 2 de 6"). Si se omite, se deriva de step/total. */
  stepLabel?: string;
  /** Destino del botón de salida ("/" por defecto). `null` lo oculta. */
  exitHref?: string | null;
  exitLabel?: string;
  className?: string;
}

/**
 * Chrome enfocado para el embudo de activación (alta de mascota, recomendación,
 * registro, login). Reduce distracciones —solo Logo + progreso + salida, sin
 * nav/footer/bottom-nav— para mantener el foco en avanzar (patrón Stripe/Typeform).
 * Las pantallas componen su contenido con la Component Library.
 */
export function FunnelShell({
  children,
  step,
  totalSteps,
  stepLabel,
  exitHref = "/",
  exitLabel = "Salir",
  className,
}: FunnelShellProps) {
  const showProgress = typeof step === "number" && typeof totalSteps === "number";
  const label = stepLabel ?? (showProgress ? `Paso ${step} de ${totalSteps}` : undefined);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-40 border-b border-border-default bg-[rgba(250,246,240,0.92)] backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Logo />
          {showProgress && (
            <div className="hidden flex-1 items-center gap-3 px-6 sm:flex">
              <Progress
                value={(step! / totalSteps!) * 100}
                tone="brand"
                size="sm"
                label={label}
                className="max-w-xs"
              />
              <span className="caption shrink-0 text-text-secondary">{label}</span>
            </div>
          )}
          {exitHref !== null && (
            <Link
              href={exitHref}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-[13px] font-semibold text-text-secondary transition-colors hover:bg-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]"
            >
              <X className="size-4" aria-hidden />
              {exitLabel}
            </Link>
          )}
        </Container>
        {/* Progreso a ancho completo en móvil (bajo el header) */}
        {showProgress && (
          <div className="border-t border-border-default px-4 py-2 sm:hidden">
            <Progress value={(step! / totalSteps!) * 100} tone="brand" size="sm" label={label} />
          </div>
        )}
      </header>
      <main className={cn("flex-1", className)}>{children}</main>
    </div>
  );
}
