"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Camera, Check, Circle, Clock, HelpCircle, RefreshCw, ShoppingBag } from "lucide-react";
import { fadeInUp } from "@/lib/motion";
import { formatCLP, formatDeliveryDate, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { RunOutEstimate } from "@/lib/anticipation";
import type { Pet, Product } from "@/types";
import { SPECIES_EMOJI } from "./pet-avatar";
import { SPECIES_LABEL, STAGE_LABEL } from "./pet-status";

export interface PetStatusCardProps {
  pet: Pet;
  /** Su alimento asignado (catálogo real). Sin él, la card invita a definirlo. */
  food?: Product;
  /** Días restantes derivados de su alimento (null si falta peso o saco). */
  anticipation?: RunOutEstimate | null;
  /** Pone su alimento en el carrito (recompra en dos clics). */
  onReorder?: () => void;
  /** Deshabilita el CTA mientras el carrito confirma. */
  reorderPending?: boolean;
  /** Abre el selector "¿qué come?" (definir ≠ comprar, D39). */
  onDefineFood?: () => void;
  className?: string;
}

/**
 * Retrato de la mascota, en dos composiciones según viewport (la foto es el
 * activo emocional — "esta página es de Wall" — pero no puede costar el primer
 * viewport): `column` = columna a sangre que ocupa la altura de la card
 * (desktop); `inline` = cuadrado compacto junto al nombre (móvil: la acción
 * principal queda a la vista sin scroll). Sin foto, invita a agregarla.
 * Navega al perfil.
 */
function PetPortrait({
  pet,
  variant,
  className,
}: {
  pet: Pet;
  variant: "column" | "inline";
  className?: string;
}) {
  const inline = variant === "inline";
  // Fotos locales (recorte del uploader B4): data:/blob: se sirven sin optimizador.
  const isLocalSrc = Boolean(
    pet.avatarUrl && (pet.avatarUrl.startsWith("data:") || pet.avatarUrl.startsWith("blob:")),
  );
  return (
    <Link
      href="/cuenta/mascotas"
      aria-label={`Ver el perfil de ${pet.name}`}
      className={cn(
        "group relative block shrink-0 overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--border-focus)]",
        inline ? "size-24 rounded-[var(--radius-lg)]" : "w-56 self-stretch lg:w-64",
        className,
      )}
    >
      {pet.avatarUrl ? (
        <Image
          src={pet.avatarUrl}
          alt={`Foto de ${pet.name}`}
          fill
          sizes={inline ? "96px" : "(min-width: 1024px) 256px, 224px"}
          unoptimized={isLocalSrc}
          className="object-cover transition-transform duration-[var(--duration-standard)] group-hover:scale-[1.03]"
        />
      ) : (
        <span className="grid size-full place-items-center bg-[radial-gradient(circle_at_50%_40%,var(--miel-200),var(--terracota-200))]">
          <span
            aria-hidden
            className={inline ? "text-4xl" : "text-8xl drop-shadow-[0_16px_24px_rgba(42,39,34,0.15)]"}
          >
            {SPECIES_EMOJI[pet.species]}
          </span>
          {inline ? (
            <span className="absolute right-1 bottom-1 grid size-6 place-items-center rounded-full bg-surface/90 text-text-brand shadow-sm">
              <Camera className="size-3.5" aria-hidden />
            </span>
          ) : (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-surface/90 px-3 py-1.5 text-[13px] font-semibold text-text-brand shadow-sm">
              <Camera className="size-4" aria-hidden />
              Agregar su foto
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

/**
 * Línea de tiempo del saco: Compra ●━━━●─────○ Se acaba. Reemplaza a la barra
 * de % (un "~100%" no significa nada): comunica el tiempo, no el porcentaje.
 * El tramo recorrido va en Miel (anticipación); el punto es "hoy".
 */
function FoodTimeline({ estimate, className }: { estimate: RunOutEstimate; className?: string }) {
  const total = estimate.daysSincePurchase + estimate.daysLeft;
  const pct = total > 0 ? Math.round((estimate.daysSincePurchase / total) * 100) : 0;
  const dotPct = Math.min(94, Math.max(6, pct));
  const showTodayLabel = pct >= 15 && pct <= 85;
  return (
    <div
      role="img"
      aria-label={`Va ${pluralize(estimate.daysSincePurchase, "día")} con este saco; se acaba ${formatDeliveryDate(estimate.runOutDate)}`}
      className={cn("max-w-sm", className)}
    >
      <div className="relative flex h-3 items-center">
        <div className="h-1 w-full rounded-full bg-terracota-100" />
        <div
          className="absolute left-0 h-1 rounded-full bg-miel-500"
          style={{ width: `${pct}%` }}
        />
        <span
          aria-hidden
          className="absolute size-3 -translate-x-1/2 rounded-full bg-miel-600"
          style={{ left: `${dotPct}%` }}
        />
        <span
          aria-hidden
          className="absolute right-0 size-2.5 rounded-full border-2 border-terracota-200 bg-surface"
        />
      </div>
      <div className="relative mt-1 flex justify-between">
        <span className="caption text-text-secondary">Compra</span>
        {showTodayLabel && (
          <span
            className="caption absolute -translate-x-1/2 font-semibold text-text-primary"
            style={{ left: `${dotPct}%` }}
          >
            Hoy
          </span>
        )}
        <span className="caption text-text-secondary">
          Se acaba <span className="font-semibold text-text-primary">{formatDeliveryDate(estimate.runOutDate)}</span>
        </span>
      </div>
    </div>
  );
}

/**
 * "Plan de {nombre}" — el espacio persistente donde vive la relación, no la
 * transacción. Hoy: estado del alimento + entregas automáticas (Próximamente,
 * decisión de Carlos: la suscripción será el corazón del negocio y no puede
 * vivir escondida — se le reserva el lugar sin fingir que ya funciona).
 * Mañana crecen aquí antiparasitario, veterinario, seguro… sin rediseñar.
 */
function PetPlan({
  pet,
  anticipation,
  hasFood,
}: {
  pet: Pet;
  anticipation?: RunOutEstimate | null;
  hasFood: boolean;
}) {
  const foodStatus = anticipation ? (
    <>
      {anticipation.daysLeft > 7 ? (
        <Check className="size-4 text-success-strong" aria-hidden />
      ) : (
        <Clock className="size-4 text-subscribe-strong" aria-hidden />
      )}
      <span className="text-[14px] font-semibold text-text-primary">Alimento</span>
      <span className="caption text-text-secondary">~{pluralize(anticipation.daysLeft, "día")}</span>
    </>
  ) : (
    <>
      <Circle className="size-4 text-text-secondary" aria-hidden />
      <span className="text-[14px] font-semibold text-text-primary">Alimento</span>
      <span className="caption text-text-secondary">{hasFood ? "Falta su peso" : "Falta definirlo"}</span>
    </>
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
      <span className="overline shrink-0 text-text-brand">Plan de {pet.name}</span>
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <li className="flex items-center gap-2">{foodStatus}</li>
        <li className="flex items-center gap-2">
          <RefreshCw className="size-4 text-text-secondary" aria-hidden />
          <span className="text-[14px] font-semibold text-text-primary">Entregas automáticas</span>
          <Badge variant="neutral">Próximamente</Badge>
        </li>
      </ul>
    </div>
  );
}

/**
 * Tarjeta de estado de la mascota — la protagonista de la Home logueada.
 * Centro de control, no hero de marketing: retrato grande (emoción), estado
 * escaneable ("Le quedan ~11 días"), detalle observacional ("va 19 días con
 * este saco" — el sistema observa), línea de tiempo del saco, UNA acción
 * dominante y el plan persistente. Degrada con honestidad cuando falta un
 * dato (sin números inventados, regla B6).
 */
export function PetStatusCard({
  pet,
  food,
  anticipation,
  onReorder,
  reorderPending,
  onDefineFood,
  className,
}: PetStatusCardProps) {
  // Estado general: ok (>7 días) · queda poco (≤7) · falta un dato (peso/alimento).
  const state = anticipation
    ? anticipation.daysLeft > 7
      ? "ok"
      : "low"
    : food
      ? "no-weight"
      : "no-food";

  const identity = [
    SPECIES_LABEL[pet.species],
    STAGE_LABEL[pet.stage],
    pet.weightKg != null
      ? `${pet.weightSource && pet.weightSource !== "exacto" ? "~" : ""}${pet.weightKg} kg`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const badge =
    state === "ok" ? (
      <Badge variant="success" icon={<Check className="size-3.5" />}>
        Todo va bien
      </Badge>
    ) : state === "low" ? (
      <Badge variant="subscribe" icon={<Clock className="size-3.5" />}>
        Queda poco
      </Badge>
    ) : (
      <Badge variant="neutral">Falta un dato</Badge>
    );

  const headline = anticipation
    ? anticipation.daysLeft > 0
      ? `Le quedan ~${pluralize(anticipation.daysLeft, "día")} de comida.`
      : "Su comida está por acabarse."
    : food
      ? `Come ${food.brand.name} ${food.name}.`
      : "Aún no sabemos qué come.";

  // Detalle observacional: el sistema observa, no solo calcula.
  const subline = anticipation
    ? [
        anticipation.daysSincePurchase > 0
          ? `Va ~${pluralize(anticipation.daysSincePurchase, "día")} con este saco.`
          : "Saco recién comenzado.",
        state === "low" ? "Pide con tiempo." : null,
      ]
        .filter(Boolean)
        .join(" ")
    : food
      ? "Cuéntanos su peso y te decimos cuánto le dura."
      : "Dinos su alimento y nos adelantamos a la próxima bolsa.";

  const reason =
    anticipation && food
      ? `Lo calculamos con el peso de ${pet.name} (${pet.weightKg} kg) y el tamaño del saco (${food.format}). Es una estimación; ajústala cuando quieras.`
      : undefined;

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      aria-labelledby="pet-status-title"
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl)] border border-terracota-100 bg-brand-soft",
        className,
      )}
    >
      <div className="flex md:items-stretch">
        <PetPortrait pet={pet} variant="column" className="hidden md:block" />

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="flex min-w-0 items-center gap-4">
              <PetPortrait pet={pet} variant="inline" className="md:hidden" />
              <div className="min-w-0">
                <h1 id="pet-status-title" className="pet-name text-3xl leading-none sm:text-4xl">
                  {pet.name}
                </h1>
                <p className="caption mt-1.5 text-text-secondary">{identity}</p>
              </div>
            </div>
            {badge}
          </div>

          {/* ── Su alimento: texto y línea de tiempo lado a lado en desktop
                 (llenan el ancho con información, no con aire) ── */}
          <div className="mt-4 grid gap-x-8 gap-y-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-center">
            <div className="flex flex-col gap-1">
              <span className="overline text-text-brand">Su alimento</span>
              <p className="heading-3 text-text-primary">{headline}</p>
              <p className="body-s text-text-secondary">{subline}</p>
              {anticipation && food && (
                <p className="caption text-text-secondary">
                  {food.brand.name} · {food.name}
                  {food.format ? ` · ${food.format}` : ""}
                </p>
              )}
            </div>
            {anticipation && <FoodTimeline estimate={anticipation} className="lg:pb-1" />}
          </div>

          {/* Una acción dominante; lo demás la apoya. */}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
            {food && onReorder ? (
              <>
                <Button
                  onClick={onReorder}
                  disabled={reorderPending}
                  leadingIcon={<ShoppingBag className="size-4" aria-hidden />}
                >
                  {reorderPending
                    ? "Agregando…"
                    : `Pedir de nuevo · ${formatCLP(food.price.current)}`}
                </Button>
                {state === "no-weight" ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/cuenta/mascotas">Completar su peso</Link>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/producto/${food.slug}`}>Ver producto</Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button onClick={onDefineFood}>Elegir su alimento</Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/cuenta/mascotas">Completar su perfil</Link>
                </Button>
              </>
            )}
            {reason && (
              <Popover>
                <PopoverTrigger className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-2 text-[13px] font-semibold text-text-secondary transition-colors hover:text-text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]">
                  <HelpCircle className="size-4" aria-hidden />
                  ¿Por qué?
                </PopoverTrigger>
                <PopoverContent>{reason}</PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>

      {/* ── El espacio del futuro: el plan, no la transacción ── */}
      <div className="border-t border-terracota-100 bg-surface/60 px-4 py-3 sm:px-5">
        <PetPlan pet={pet} anticipation={anticipation} hasFood={Boolean(food)} />
      </div>
    </motion.section>
  );
}
