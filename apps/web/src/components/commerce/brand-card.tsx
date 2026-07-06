import Link from "next/link";
import type { Brand } from "@/types";
import { cn } from "@/lib/utils";

export interface BrandCardProps {
  brand: Brand;
  href?: string;
  /** Logo de la marca; si falta, muestra la inicial sobre Arena. */
  logoUrl?: string;
  className?: string;
}

/**
 * Tarjeta de marca para la grilla de "Marcas". Cuadrada, logo centrado sobre
 * superficie neutra. Aunque la navegación es por necesidad, las marcas siguen
 * siendo un punto de entrada legítimo.
 */
export function BrandCard({ brand, href, logoUrl, className }: BrandCardProps) {
  const content = (
    <div
      className={cn(
        "grid aspect-[3/2] place-items-center rounded-[var(--radius-lg)] border border-border-default bg-surface p-5 transition-[transform,box-shadow] duration-[var(--duration-standard)] hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo de marca, tamaño variable
        <img src={logoUrl} alt={brand.name} className="max-h-12 w-auto object-contain" />
      ) : (
        <span className="font-[family-name:var(--font-display)] text-xl font-semibold text-text-secondary">
          {brand.name}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label={`Ver productos de ${brand.name}`}>
        {content}
      </Link>
    );
  }
  return content;
}
