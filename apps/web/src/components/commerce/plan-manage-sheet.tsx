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
import { motion } from "framer-motion";
import { Ban, CalendarClock, CheckCircle2, Pause, Play, ShieldCheck, SkipForward } from "lucide-react";
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
import { fadeInUp } from "@/lib/motion";
import type { SubscriptionFrequencyWeeks } from "@/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Qué acción sensible está esperando confirmación (una a la vez). */
type Confirming = "pause" | "skip" | "cancel" | null;

/**
 * Confirmación inline para acciones sensibles (pausar, saltar, cancelar — R2).
 * Mismo patrón visual que ya tenía Cancelar, extraído para no duplicarlo: cada
 * acción que interrumpe el plan pide un paso explícito antes de ejecutarse.
 */
function ConfirmInline({
  message,
  confirmLabel,
  cancelLabel = "No, mantener",
  onConfirm,
  onCancel,
  pending,
}: {
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-default bg-surface p-3">
      <p className="mb-3 text-[13px] text-text-secondary">{message}</p>
      <Row gap={2}>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button size="sm" onClick={onConfirm} disabled={pending}>
          {confirmLabel}
        </Button>
      </Row>
    </div>
  );
}

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
  const [confirming, setConfirming] = useState<Confirming>(null);
  // Momento de éxito al reanudar (R3): reemplaza el toast plano por una
  // confirmación in-sheet que transmite tranquilidad. `null` = gestión normal.
  const [resumedInfo, setResumedInfo] = useState<{ nextDate: Date } | null>(null);

  const sub = openId ? subscriptions.find((s) => s.id === openId) : undefined;

  // Fecha a la que se movería el próximo envío al saltarlo (una frecuencia más).
  const skipTargetDate = sub
    ? new Date((sub.nextDeliveryDate ?? new Date()).getTime() + sub.frequencyWeeks * WEEK_MS)
    : null;
  // Fecha del próximo envío al reanudar: una frecuencia desde ahora (fresca).
  const resumeTargetDate = sub
    ? new Date(new Date().getTime() + sub.frequencyWeeks * WEEK_MS)
    : null;

  function handleClose(open: boolean) {
    if (!open) {
      setConfirming(null);
      setResumedInfo(null);
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
    if (!skipTargetDate) return;
    setConfirming(null);
    void mutate(
      { next_delivery_date: skipTargetDate.toISOString() },
      `Movimos tu próximo envío al ${formatDeliveryDate(skipTargetDate)}`,
    );
  }

  function pause() {
    setConfirming(null);
    void mutate({ status: "paused" }, "Plan pausado");
  }

  // Reanudar tiene su propio flujo (no usa `mutate`): en vez de un toast efímero,
  // abre el momento de éxito in-sheet (R3). Próxima fecha fresca (una frecuencia
  // desde hoy) — la programamos, sin prometer un despacho que aún no existe.
  async function resume() {
    if (!sub || !resumeTargetDate || pending) return;
    setPending(true);
    try {
      await updateMySubscription(sub.id, {
        status: "active",
        next_delivery_date: resumeTargetDate.toISOString(),
      });
      await refresh();
      setResumedInfo({ nextDate: resumeTargetDate });
    } catch {
      toast({
        title: "No se pudo reactivar el plan",
        description: "Vuelve a intentarlo en un momento.",
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  }

  function cancel() {
    setConfirming(null);
    void mutate({ status: "cancelled" }, "Plan cancelado", { closeAfter: true });
  }

  return (
    <Dialog open={!!sub} onOpenChange={handleClose}>
      <DialogContent>
        {sub && resumedInfo ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-4 py-2 text-center"
          >
            <span className="grid size-14 place-items-center rounded-full bg-success-soft">
              <CheckCircle2 className="size-8 text-success-strong" aria-hidden />
            </span>
            <div className="flex flex-col gap-1.5">
              <DialogTitle>Tu plan sigue en marcha</DialogTitle>
              <DialogDescription>
                Reactivaste el plan de {sub.productTitle}. Programamos tu próximo envío para el{" "}
                {formatDeliveryDate(resumedInfo.nextDate)}.
              </DialogDescription>
            </div>
            <p className="inline-flex items-center gap-2 text-[13px] text-text-secondary">
              <ShieldCheck className="size-4 text-[var(--success)]" aria-hidden />
              Pausa, cambia o cancela cuando quieras, sin costo.
            </p>
            <Button block onClick={() => handleClose(false)}>
              Listo
            </Button>
          </motion.div>
        ) : sub ? (
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

                <Stack gap={3}>
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
                      onClick={() => setConfirming("skip")}
                      disabled={pending || sub.status !== "active"}
                      leadingIcon={<SkipForward className="size-4" aria-hidden />}
                    >
                      Saltar
                    </Button>
                  </Row>
                  {confirming === "skip" && (
                    <ConfirmInline
                      message={`¿Saltar el próximo envío? Lo movemos al ${
                        skipTargetDate ? formatDeliveryDate(skipTargetDate) : "—"
                      }.`}
                      confirmLabel="Sí, saltar"
                      onConfirm={skip}
                      onCancel={() => setConfirming(null)}
                      pending={pending}
                    />
                  )}
                </Stack>

                <Row justify="between" align="center" gap={3}>
                  <span className="text-sm text-text-secondary">Precio por entrega</span>
                  <span className="price text-lg text-text-primary">{formatCLP(sub.agreedUnitPrice)}</span>
                </Row>
              </Stack>
            </div>

            {/* Estado del plan */}
            <Stack gap={3} className="mt-5">
              {sub.status === "active" ? (
                confirming === "pause" ? (
                  <ConfirmInline
                    message="¿Pausar el plan? Dejarás de recibir envíos hasta que lo reanudes."
                    confirmLabel="Sí, pausar"
                    cancelLabel="No, seguir activo"
                    onConfirm={pause}
                    onCancel={() => setConfirming(null)}
                    pending={pending}
                  />
                ) : (
                  <Button
                    variant="ghost"
                    block
                    onClick={() => setConfirming("pause")}
                    disabled={pending}
                    leadingIcon={<Pause className="size-4" aria-hidden />}
                  >
                    Pausar plan
                  </Button>
                )
              ) : (
                <Button
                  variant="ghost"
                  block
                  onClick={resume}
                  disabled={pending}
                  leadingIcon={<Play className="size-4" aria-hidden />}
                >
                  Reanudar plan
                </Button>
              )}

              {confirming === "cancel" ? (
                <ConfirmInline
                  message={`¿Cancelar el plan de ${sub.productTitle}? Puedes volver a suscribirte cuando quieras.`}
                  confirmLabel="Sí, cancelar"
                  cancelLabel="No, mantenerlo"
                  onConfirm={cancel}
                  onCancel={() => setConfirming(null)}
                  pending={pending}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming("cancel")}
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
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
