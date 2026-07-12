"use client";

import { motion } from "framer-motion";
import { HelpCircle, ShoppingBag, Sparkles } from "lucide-react";
import { fadeInUp } from "@/lib/motion";
import { formatDeliveryDate, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  /**
   * Pedir su alimento de nuevo (navega a su producto). Si se omite, la cápsula
   * es informativa (p. ej. en /bienvenida, recién comprado: no se le ofrece
   * recomprar lo que acaba de pedir).
   */
  onReorder?: () => void;
  className?: string;
}

/**
 * Cápsula de anticipación — el momento "se adelantó por mí" (DESIGN_SYSTEM
 * §10, §12.2). Entra con slide+fade y la barra se llena con calma (U085);
 * sin pulso tipo alerta: anticipación es cuidado tranquilo, no urgencia
 * (U087). La razón del cálculo es transparente (Popover).
 *
 * MVP honesto (D29: compra única; no hay entregas programadas todavía): la
 * cápsula avisa a tiempo e invita a PEDIR DE NUEVO — una acción real. El
 * reagendo de entregas llega con la suscripción recurrente (post-tracción).
 */
export function AnticipationCapsule({
  petName,
  pet,
  daysLeft,
  percentLeft = Math.min(100, Math.max(6, Math.round((daysLeft / 30) * 100))),
  runOutDate,
  reason,
  onReorder,
  className,
}: AnticipationCapsuleProps) {
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
          ? `Según nuestro cálculo, se acaba ${formatDeliveryDate(runOutDate)}.`
          : "Lo estimamos con su ración diaria."}{" "}
        {onReorder ? "Pide con tiempo para que no le falte." : "Te avisaremos antes de que le falte."}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <Progress value={percentLeft} tone="miel" label={`Queda ~${percentLeft}% del saco`} animateIn className="max-w-xs" />
        <span className="price text-[13px] text-text-secondary">~{percentLeft}%</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {onReorder && (
          <Button onClick={onReorder} leadingIcon={<ShoppingBag className="size-4" aria-hidden />}>
            Pedir de nuevo
          </Button>
        )}
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
    </motion.section>
  );
}
