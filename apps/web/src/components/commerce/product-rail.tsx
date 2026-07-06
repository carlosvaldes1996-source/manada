import type { Product, ShippingEstimate } from "@/types";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils";

export interface ProductRailProps {
  title: React.ReactNode;
  overline?: string;
  products: Product[];
  shipping?: ShippingEstimate;
  href?: string;
  linkLabel?: string;
  className?: string;
}

/**
 * Carrusel horizontal con scroll-snap (cross-sell "Para la manada de Toby",
 * destacados de Home). En móvil muestra ~1.3 tarjetas; crece con el viewport.
 * Sin librería de carrusel: scroll nativo accesible con teclado.
 */
export function ProductRail({ title, overline, products, shipping, href, linkLabel, className }: ProductRailProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <SectionHeading overline={overline} title={title} href={href} linkLabel={linkLabel} as="h3" />
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:px-0">
        {products.map((p) => (
          <li key={p.id} className="w-[78%] shrink-0 snap-start sm:w-[44%] md:w-[31%] lg:w-[23%]">
            <ProductCard product={p} shipping={shipping} />
          </li>
        ))}
      </ul>
    </section>
  );
}
