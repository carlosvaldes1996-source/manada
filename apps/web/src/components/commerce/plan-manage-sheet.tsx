"use client";

/**
 * Hoja de gestión del plan (D56 · Bloque D). Reutiliza el `Dialog` existente y se
 * abre igual desde la Home y desde `/cuenta` (vía `PlanManageProvider`). Acciones:
 * cambiar frecuencia, saltar el próximo envío, pausar/reanudar y cancelar.
 *
 * Lee la suscripción VIVA del `SubscriptionProvider` por id (tras cada mutación se
 * re-hidrata y la hoja refleja el nuevo estado). Copy deliberadamente FACTUAL: cada
 * confirmación dice lo que cambió, sin prometer una entrega automática (el motor de
 * entregas es un bloque posterior de D55).
 */

import { useState } from "react";
import { Ban, CalendarClock, Pause, Play, SkipForward } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Stack, Row } from "@/components/ui/stack";
import { useToast } from "@/components/ui/toast";
import { useSubscriptions } from "@/components/providers";
import { updateMySubscription } from "@/lib/medusa/subscriptions";
import { SUBSCRIPTION_FREQUENCIES } from "@/hooks/use-subscription";
import { formatCLP, formatDeliveryDate } from "@/lib/format";
import type { SubscriptionFrequencyWeeks } from "@/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function PlanManageSheet({
  openId,
  onClose,
}: {
  openId: string | null;
  onClose: () => void;
}) {
  const { subscriptions, refresh } = useSubscriptions();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const sub = openId ? subscriptions.find((s) => s.id === openId) : undefined;

  function handleClose(open: boolean) {
    if (!open) {
      setConfirmingCancel(false);
      onClose();
    }
  }

  async function mutate(
    changes: Parameters<typeof updateMySubscription>[1],
    successMsg: string,
    opts?: { closeAfter?: boolean },
  ) {
    if (!sub || pending) return;
    setPending(true);
    try {
      await updateMySubscription(sub.id, changes);
      await refresh();
      toast({ title: successMsg, variant: "success" });
      if (opts?.closeAfter) handleClose(false);
    } catch {
      toast({
        title: "No se pudo actualizar el plan",
        description: "Vuelve a intentarlo en un momento.",
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  }

  function changeFrequency(weeks: SubscriptionFrequencyWeeks) {
    const label = SUBSCRIPTION_FREQUENCIES.find((f) => f.weeks === weeks)?.label ?? `cada ${weeks} semanas`;
    void mutate({ frequency_weeks: weeks }, `Frecuencia actualizada a ${label.toLowerCase()}`);
  }

  function skip() {
    if (!sub) return;
    const base = sub.nextDeliveryDate ?? new Date();
    const next = new Date(base.getTime() + sub.frequencyWeeks * WEEK_MS);
    void mutate(
      { next_delivery_date: next.toISOString() },
      `Movimos tu próximo envío al ${formatDeliveryDate(next)}`,
    );
  }

  function pauseOrResume() {
    if (!sub) return;
    if (sub.status === "active") {
      void mutate({ status: "paused" }, "Plan pausado");
    } else {
      // Al reanudar, próxima fecha fresca (una frecuencia desde hoy).
      const next = new Date(Date.now() + sub.frequencyWeeks * WEEK_MS);
      void mutate({ status: "active", next_delivery_date: next.toISOString() }, "Plan reactivado");
    }
  }

  function cancel() {
    void mutate({ status: "cancelled" }, "Plan cancelado", { closeAfter: true });
  }

  return (
    <Dialog open={!!sub} onOpenChange={handleClose}>
      <DialogContent>
        {sub && (
          <>
            <DialogHeader>
              <DialogTitle>Gestiona tu plan</DialogTitle>
              <DialogDescription>{sub.productTitle}</DialogDescription>
            </DialogHeader>

            {sub.status === "paused" && (
              <div className="mb-4 rounded-[var(--radius-md)] border border-border-default bg-surface px-4 py-2.5 text-[13px] text-text-secondary">
                <Badge variant="neutral">Pausado</Badge>{" "}
                <span className="align-middle">Reanúdalo cuando quieras.</span>
              </div>
            )}

            {/* Resumen + frecuencia editable */}
            <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface p-4">
              <Stack gap={4}>
                <Select
                  label="Frecuencia de entrega"
                  options={SUBSCRIPTION_FREQUENCIES.map((f) => ({ value: String(f.weeks), label: f.label }))}
                  value={String(sub.frequencyWeeks)}
                  onValueChange={(v) => changeFrequency(Number(v) as SubscriptionFrequencyWeeks)}
                  disabled={pending || sub.status === "cancelled"}
                />

                <Row justify="between" align="center" gap={3}>
                  <Stack gap={0}>
                    <span className="text-sm text-text-secondary">Próximo envío</span>
                    <span className="text-[15px] font-semibold text-text-primary">
                      {sub.nextDeliveryDate ? formatDeliveryDate(sub.nextDeliveryDate) : "—"}
                    </span>
                  </Stack>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={skip}
                    disabled={pending || sub.status === "cancelled"}
                    leadingIcon={<SkipForward className="size-4" aria-hidden />}
                  >
                    Saltar
                  </Button>
                </Row>

                <Row justify="between" align="center" gap={3}>
                  <span className="text-sm text-text-secondary">Precio por entrega</span>
                  <span className="price text-lg text-text-primary">{formatCLP(sub.agreedUnitPrice)}</span>
                </Row>
              </Stack>
            </div>

            {/* Estado del plan */}
            <Stack gap={3} className="mt-5">
              <Button
                variant="ghost"
                block
                onClick={pauseOrResume}
                disabled={pending}
                leadingIcon={
                  sub.status === "active" ? (
                    <Pause className="size-4" aria-hidden />
                  ) : (
                    <Play className="size-4" aria-hidden />
                  )
                }
              >
                {sub.status === "active" ? "Pausar plan" : "Reanudar plan"}
              </Button>

              {confirmingCancel ? (
                <div className="rounded-[var(--radius-md)] border border-border-default bg-surface p-3">
                  <p className="mb-3 text-[13px] text-text-secondary">
                    ¿Cancelar el plan de {sub.productTitle}? Puedes volver a suscribirte cuando quieras.
                  </p>
                  <Row gap={2}>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingCancel(false)} disabled={pending}>
                      No, mantenerlo
                    </Button>
                    <Button size="sm" onClick={cancel} disabled={pending}>
                      Sí, cancelar
                    </Button>
                  </Row>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(true)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-text-secondary transition-colors hover:text-[var(--error)] disabled:opacity-50"
                >
                  <Ban className="size-4" aria-hidden />
                  Cancelar plan
                </button>
              )}
            </Stack>

            <p className="mt-4 inline-flex items-center gap-2 text-[12px] text-text-muted">
              <CalendarClock className="size-3.5" aria-hidden />
              Cambiar la frecuencia no mueve tu próximo envío.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
