"use client";

import { RefreshCw } from "lucide-react";
import { Stack, Row } from "@/components/ui/stack";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptions } from "@/components/providers";
import { formatCLP } from "@/lib/format";
import type { SubscriptionView } from "@/types";

/**
 * Lista read-only de las suscripciones del cliente (D55 · Punto 1). Consume el
 * `SubscriptionProvider` (D56·C, fuente única con la Home). Reemplaza la card
 * "Próximamente" de /cuenta. La gestión (pausar/cancelar/cambiar frecuencia) es el
 * Bloque D; por eso todavía no hay acciones.
 */

const STATUS_LABEL: Record<SubscriptionView["status"], string> = {
  active: "Activa",
  paused: "Pausada",
  cancelled: "Cancelada",
};

export function SubscriptionsList() {
  const { subscriptions: subs, isLoading } = useSubscriptions();

  if (isLoading && subs.length === 0) return <Skeleton className="h-24 w-full" />;

  if (subs.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border-default bg-surface p-5 text-[13px] text-text-secondary">
        Aún no tienes suscripciones. Suscríbete a la comida de tu mascota desde su ficha y aquí verás sus entregas automáticas.
      </div>
    );
  }

  return (
    <Stack gap={3}>
      {subs.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface p-5"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-brand-soft text-text-brand">
            <RefreshCw className="size-5" aria-hidden />
          </span>
          <Stack gap={1} className="min-w-0 flex-1">
            <Row gap={2} align="center" wrap>
              <span className="truncate text-[15px] font-semibold text-text-primary">{s.productTitle}</span>
              <Badge variant={s.status === "active" ? "subscribe" : "neutral"}>{STATUS_LABEL[s.status]}</Badge>
            </Row>
            <span className="text-[13px] text-text-secondary">
              {s.frequencyLabel}
              {s.status === "active" && s.nextDeliveryDate && (
                <>
                  {" · próxima entrega "}
                  {s.nextDeliveryDate.toLocaleDateString("es-CL", { day: "numeric", month: "long" })}
                </>
              )}
            </span>
          </Stack>
          <span className="price text-text-primary">{formatCLP(s.agreedUnitPrice)}</span>
        </div>
      ))}
    </Stack>
  );
}
