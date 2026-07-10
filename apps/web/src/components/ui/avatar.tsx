import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = {
  xs: "size-5 text-xs",
  sm: "size-7 text-base",
  md: "size-10 text-xl",
  lg: "size-16 text-3xl",
  xl: "size-24 text-5xl",
} as const;

export interface AvatarProps {
  /** Foto real (preferida — la foto es la prueba de Amor, §6). */
  src?: string;
  alt?: string;
  /** Fallback cálido: emoji o iniciales cuando no hay foto. */
  emoji?: string;
  initials?: string;
  size?: keyof typeof sizes;
  className?: string;
}

/**
 * Avatar circular con degradado cálido de marca como fondo de fallback.
 * Prioriza foto real; si no, muestra emoji o iniciales sobre Miel→Terracota.
 */
export function Avatar({ src, alt = "", emoji, initials, size = "md", className }: AvatarProps) {
  const dimension = { xs: 20, sm: 28, md: 40, lg: 64, xl: 96 }[size];
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_40%,var(--miel-200),var(--terracota-200))] font-medium text-terracota-800",
        sizes[size],
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={alt} width={dimension} height={dimension} className="size-full object-cover" />
      ) : emoji ? (
        <span aria-hidden>{emoji}</span>
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </span>
  );
}
