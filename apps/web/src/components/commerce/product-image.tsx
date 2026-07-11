import { cn } from "@/lib/utils";

/**
 * Packshot de producto — decide entre FOTO REAL y emoji placeholder.
 *
 * `Product.imageUrl` transporta dos clases de valor (mapper `toImageUrl`, D23):
 * la URL real del thumbnail/imagen subida en el Admin de Medusa, o un emoji
 * placeholder mientras no exista fotografía (U090). Los render-sites asumían
 * siempre emoji e imprimían el string como texto — al subir una foto real desde
 * el Admin, las cards mostraban la URL como texto gigante. Este componente es
 * el ÚNICO punto que conoce esa dualidad: URL → `<img>` (contain, lazy);
 * cualquier otro valor → emoji decorativo, idéntico a hoy.
 *
 * `<img>` nativo (precedente: BrandCard, OrdersView); la graduación a
 * `next/image` (remotePatterns por entorno) se evalúa con la fotografía real
 * de U090, no antes.
 */

/** ¿URL de imagen (absoluta o raíz-relativa) vs emoji placeholder? */
function isImageUrl(value: string): boolean {
  return /^(https?:\/\/|\/)/.test(value);
}

export interface ProductImageProps {
  /** `Product.imageUrl` del dominio (URL real o emoji placeholder). */
  image?: string;
  /** Nombre del producto (alt de la foto; el emoji es decorativo). */
  alt: string;
  /** Clases de la foto real (por defecto llena el contenedor sin recortar). */
  imgClassName?: string;
  /** Clases del emoji placeholder (tamaño tipográfico del packshot). */
  emojiClassName?: string;
}

export function ProductImage({ image, alt, imgClassName, emojiClassName }: ProductImageProps) {
  if (image && isImageUrl(image)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- next/image requiere remotePatterns del backend; se gradúa con U090
      <img
        src={image}
        alt={alt}
        loading="lazy"
        className={cn("size-full object-contain", imgClassName)}
      />
    );
  }
  return (
    <span className={emojiClassName} aria-hidden>
      {image ?? "📦"}
    </span>
  );
}
