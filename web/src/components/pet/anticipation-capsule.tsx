"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CalendarClock, HelpCircle, Sparkles } from "lucide-react";
import { fadeInUp } from "@/lib/motion";
import { formatDeliveryDate, pluralize } from "@/lib/format";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface AnticipationCapsuleProps {
  petName: string;
  /** Días restantes estimados de alimento. */
  daysLeft: number;
  /** % restante del saco (0–100) para la barra. */
  percentLeft?: number;
  runOutDate?: Date;
  /** Explicación honesta del cálculo ("¿por qué te lo decimos?"). */
  reason?: string;
  onReschedule?: () => void;
  onSubscribe?: () => void;
  className?: string;
}

/**
 * Cápsula de anticipación — el momento "se adelantó por mí" (DESIGN_SYSTEM
 * §10, §12.2). Entra con slide+fade y un único pulso en Miel (no loop). Ofrece
 * reagendar, nunca cobra solo. La razón del cálculo es transparente (Popover).
 */
export function AnticipationCapsule({
  petName,
  daysLeft,
  percentLeft = Math.min(100, Math.max(6, Math.round((daysLeft / 30) * 100))),
  runOutDate,
  reason,
  onReschedule,
  onSubscribe,
  className,
}: AnticipationCapsuleProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      aria-labelledby="anticipation-title"
      className={cn(
        "rounded-[var(--radius-xl)] border border-terracota-100 bg-brand-soft p-6",
        !reduced && "animate-[pulse-soft_1.2s_ease_1]",
        className,
      )}
    >
      <span className="overline inline-flex items-center gap-1.5 text-text-brand">
        <Sparkles className="size-3.5" aria-hidden />
        Para {petName} 🐾
      </span>
      <h2 id="anticipation-title" className="heading-2 mt-1 text-text-primary">
        A <span className="pet-name">{petName}</span> le quedan ~{pluralize(daysLeft, "día")} de comida
      </h2>
      <p className="body-m mt-1 text-text-secondary">
        {runOutDate
          ? `Según nuestro cálculo, se acaba ${formatDeliveryDate(runOutDate)}. ¿La reagendamos para que no le falte?`
          : "¿La reagendamos para que no le falte?"}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <Progress value={percentLeft} tone="miel" label={`Queda ~${percentLeft}% del saco`} className="max-w-xs" />
        <span className="price text-[13px] text-text-secondary">~{percentLeft}%</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={onReschedule} leadingIcon={<CalendarClock className="size-4" aria-hidden />}>
          Reagendar entrega
        </Button>
        <Button variant="secondary" onClick={onSubscribe}>
          Ver suscripción
        </Button>
        {reason && (
          <Popover>
            <PopoverTrigger className="inline-flex items-center gap-1 text-[13px] font-semibold text-text-secondary underline-offset-2 hover:text-text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]">
              <HelpCircle className="size-4" aria-hidden />
              ¿Por qué te lo decimos?
            </PopoverTrigger>
            <PopoverContent>{reason}</PopoverContent>
          </Popover>
        )}
      </div>
    </motion.section>
  );
}
