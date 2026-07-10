"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CalendarClock, HelpCircle, Sparkles } from "lucide-react";
import { fadeInUp } from "@/lib/motion";
import { formatDeliveryDate, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioCard } from "@/components/ui/radio";
import { Stack } from "@/components/ui/stack";
import { PetTag } from "./pet-tag";
import type { Pet } from "@/types";

export interface AnticipationCapsuleProps {
  petName: string;
  /**
   * Mascota — habilita la firma de personalización con rostro en el overline
   * (§1.1). Si no se pasa, cae al overline con emoji de siempre (no rompe nada).
   */
  pet?: Pet;
  /** Días restantes estimados de alimento. */
  daysLeft: number;
  /** % restante del saco (0–100) para la barra. */
  percentLeft?: number;
  runOutDate?: Date;
  /** Explicación honesta del cálculo ("¿por qué te lo decimos?"). */
  reason?: string;
  /** Se llama al CONFIRMAR el reagendo, con la fecha de entrega elegida. */
  onReschedule?: (date: Date) => void;
  onSubscribe?: () => void;
  className?: string;
}

/** Suma días a una fecha (sin mutar la original). */
function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** "mañana" → "Mañana" (título de opción). */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface RescheduleOption {
  id: string;
  date: Date;
  description: string;
}

/**
 * Cápsula de anticipación — el momento "se adelantó por mí" (DESIGN_SYSTEM
 * §10, §12.2). Entra con slide+fade y la barra se llena con calma (U085);
 * sin pulso tipo alerta: anticipación es cuidado tranquilo, no urgencia
 * (U087). Ofrece reagendar, nunca cobra solo. La razón del cálculo es
 * transparente (Popover).
 *
 * "Reagendar entrega" abre un diálogo que muestra la fecha programada actual
 * (un día antes de que se acabe) y deja elegir una nueva; `onReschedule`
 * recibe la fecha confirmada.
 */
export function AnticipationCapsule({
  petName,
  pet,
  daysLeft,
  percentLeft = Math.min(100, Math.max(6, Math.round((daysLeft / 30) * 100))),
  runOutDate,
  reason,
  onReschedule,
  onSubscribe,
  className,
}: AnticipationCapsuleProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);

  // Opciones de entrega relativas a cuándo se acaba: la programada (1 día
  // antes), una holgada (2 días antes) y "lo antes posible" (mañana).
  // Se deduplican (si el saco está por acabarse pueden coincidir) y nunca
  // se ofrece una fecha pasada.
  const options = React.useMemo<RescheduleOption[]>(() => {
    if (!runOutDate) return [];
    const tomorrow = addDays(new Date(), 1);
    const candidates: RescheduleOption[] = [
      { id: "asap", date: tomorrow, description: "Lo antes posible" },
      { id: "holgada", date: addDays(runOutDate, -2), description: "Dos días antes de que se acabe" },
      { id: "programada", date: addDays(runOutDate, -1), description: "Un día antes de que se acabe · programada" },
    ];
    const byDay = new Map<string, RescheduleOption>();
    for (const c of candidates) {
      if (c.date.getTime() < tomorrow.getTime()) continue;
      byDay.set(c.date.toDateString(), c); // la última gana → prevalece "programada"
    }
    return [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [runOutDate]);

  const scheduled = runOutDate ? addDays(runOutDate, -1) : undefined;
  const effectiveSelected = selected ?? options.find((o) => o.id === "programada")?.id ?? options.at(-1)?.id;

  function confirmReschedule() {
    const opt = options.find((o) => o.id === effectiveSelected);
    setOpen(false);
    if (opt) onReschedule?.(opt.date);
  }

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      aria-labelledby="anticipation-title"
      className={cn(
        "rounded-[var(--radius-xl)] border border-terracota-100 bg-brand-soft p-6",
        className,
      )}
    >
      {pet ? (
        <PetTag pet={pet} tone="brand" />
      ) : (
        <span className="overline inline-flex items-center gap-1.5 text-text-brand">
          <Sparkles className="size-3.5" aria-hidden />
          Para {petName} 🐾
        </span>
      )}
      <h2 id="anticipation-title" className="heading-2 mt-1 text-text-primary">
        A <span className="pet-name">{petName}</span> le quedan ~{pluralize(daysLeft, "día")} de comida
      </h2>
      <p className="body-m mt-1 text-text-secondary">
        {runOutDate
          ? `Según nuestro cálculo, se acaba ${formatDeliveryDate(runOutDate)}. ¿La reagendamos para que no le falte?`
          : "¿La reagendamos para que no le falte?"}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <Progress value={percentLeft} tone="miel" label={`Queda ~${percentLeft}% del saco`} animateIn className="max-w-xs" />
        <span className="price text-[13px] text-text-secondary">~{percentLeft}%</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          onClick={() =>
            options.length > 0 ? setOpen(true) : onReschedule?.(addDays(new Date(), 1))
          }
          leadingIcon={<CalendarClock className="size-4" aria-hidden />}
        >
          Reagendar entrega
        </Button>
        <Button variant="secondary" onClick={onSubscribe}>
          Ver suscripción
        </Button>
        {/* Afordancia de botón real (U088): pill con borde, no texto suelto. */}
        {reason && (
          <Popover>
            <PopoverTrigger className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-terracota-200 bg-surface px-3 py-2 text-[13px] font-semibold text-text-secondary transition-colors hover:border-terracota-300 hover:text-text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]">
              <HelpCircle className="size-4" aria-hidden />
              ¿Por qué te lo decimos?
            </PopoverTrigger>
            <PopoverContent>{reason}</PopoverContent>
          </Popover>
        )}
      </div>

      {/* Diálogo de reagendo: fecha programada visible + elección explícita */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar la entrega de {petName}</DialogTitle>
            <DialogDescription>
              {scheduled && runOutDate
                ? `Hoy está programada para llegar ${formatDeliveryDate(scheduled)}, un día antes de que se le acabe la comida (${formatDeliveryDate(runOutDate)}). Elige cuándo prefieres recibirla.`
                : "Elige cuándo prefieres recibirla."}
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={effectiveSelected}
            onValueChange={setSelected}
            aria-label="Nueva fecha de entrega"
          >
            <Stack gap={3}>
              {options.map((o) => (
                <RadioCard
                  key={o.id}
                  value={o.id}
                  title={capitalize(formatDeliveryDate(o.date))}
                  description={o.description}
                  icon={<CalendarClock className="size-5 text-text-brand" aria-hidden />}
                />
              ))}
            </Stack>
          </RadioGroup>

          <p className="mt-3 text-[13px] text-text-muted">
            Es una sugerencia, no un cobro: puedes volver a cambiarla cuando quieras.
          </p>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button onClick={confirmReschedule}>Confirmar nueva fecha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}
