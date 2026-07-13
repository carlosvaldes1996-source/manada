"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE } from "@/config/site";
import { useSession, usePet } from "@/components/providers";

export interface LogoProps {
  /** Solo isotipo (app icon/favicon/avatar) vs. lockup completo. */
  variant?: "lockup" | "mark";
  href?: string | null;
  tone?: "default" | "inverse";
  className?: string;
}

/**
 * Marca Manada — isotipo "huella-manada" + logotipo (Fraunces 600).
 * Placeholder vectorial hasta digitalizar el logo final (DESIGN_SYSTEM §2).
 * La huella usa Terracota; sobre fondos oscuros, `tone="inverse"`.
 */
export function Logo({ variant = "lockup", href = "/", tone = "default", className }: LogoProps) {
  const { status } = useSession();
  const { activePet } = usePet();
  // Continuidad del journey: un invitado que ya creó su mascota no debe caer en
  // la landing de "reinicio". Su home es la tienda (con su mascota en el
  // selector); con sesión, "/" ya es su dashboard. Solo se ajusta el home por
  // defecto — un `href` explícito (o `null`) se respeta tal cual.
  const resolvedHref =
    href === "/" && status === "anonymous" && activePet ? "/categoria/todo" : href;

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-[family-name:var(--font-display)] text-[22px] font-semibold",
        tone === "inverse" ? "text-white" : "text-text-primary",
        className,
      )}
    >
      <PawMark className="size-[34px] shrink-0" tone={tone} />
      {variant === "lockup" && <span>{SITE.name}</span>}
    </span>
  );

  if (resolvedHref === null) return content;
  return (
    <Link href={resolvedHref} aria-label={`${SITE.name} — inicio`} className="inline-flex">
      {content}
    </Link>
  );
}

/** Isotipo: huella cuyas almohadillas evocan un grupo (huella + manada). */
function PawMark({ className, tone = "default" }: { className?: string; tone?: "default" | "inverse" }) {
  const fill = tone === "inverse" ? "var(--neutral-50)" : "var(--terracota-500)";
  const soft = tone === "inverse" ? "rgba(250,246,240,0.55)" : "var(--miel-400)";
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-hidden focusable="false">
      <ellipse cx="11" cy="14" rx="4.2" ry="5.2" fill={fill} />
      <ellipse cx="20" cy="10.5" rx="4.2" ry="5.4" fill={soft} />
      <ellipse cx="29" cy="14" rx="4.2" ry="5.2" fill={fill} />
      <path
        d="M20 18c-5.2 0-9.4 3.8-9.4 8.5 0 3.4 2.9 5.5 6.4 5.5 1.3 0 2.2-.5 3-.5s1.7.5 3 .5c3.5 0 6.4-2.1 6.4-5.5C29.4 21.8 25.2 18 20 18z"
        fill={fill}
      />
    </svg>
  );
}
