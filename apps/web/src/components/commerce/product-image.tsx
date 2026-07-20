"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { isImageUrl, packshotLoader } from "@/lib/media/packshot";

/**
 * Packshot de producto — decide entre FOTO REAL y emoji placeholder.
 *
 * `Product.imageUrl` transporta dos clases de valor (mapper `toImageUrl`, D23):
 * la URL real del thumbnail/imagen del Admin de Medusa, o un emoji placeholder
 * mientras no exista fotografía (U090). Este componente es el ÚNICO punto que
 * conoce esa dualidad.
 *
 * Foto real → `next/image` con `fill` + `object-contain`, servida por el loader
 * de packshots (`/api/packshot`): fondo aplanado a blanco, recorte del borde y
 * encuadre uniforme, para que TODO producto se vea al mismo tamaño y escala sin
 * editar el asset (ver `@/lib/media/packshot`). El contenedor padre debe ser
 * `relative` (lo exige `fill`) y define el aspect-ratio (evita CLS).
 * Cualquier otro valor → emoji decorativo, centrado por el padre.
 */

export interface ProductImageProps {
  /** `Product.imageUrl` del dominio (URL real o emoji placeholder). */
  image?: string;
  /** Nombre del producto (alt de la foto; el emoji es decorativo). */
  alt: string;
  /** `sizes` del `srcset` responsive (obligatorio con `fill` para no sobre-pedir). */
  sizes?: string;
  /** Clases extra de la foto (además de `object-contain`). */
  className?: string;
  /** Clases del emoji placeholder (tamaño tipográfico del packshot). */
  emojiClassName?: string;
  /** Carga prioritaria (imagen LCP, p. ej. la galería de la PDP). */
  priority?: boolean;
}

export function ProductImage({
  image,
  alt,
  sizes = "100vw",
  className,
  emojiClassName,
  priority,
}: ProductImageProps) {
  if (image && isImageUrl(image)) {
    return (
      <Image
        src={image}
        alt={alt}
        fill
        sizes={sizes}
        loader={packshotLoader}
        priority={priority}
        className={cn("object-contain", className)}
      />
    );
  }
  return (
    <span className={emojiClassName} aria-hidden>
      {image ?? "📦"}
    </span>
  );
}
