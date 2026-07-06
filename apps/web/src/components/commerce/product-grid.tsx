import type { Product, ShippingEstimate } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Grid } from "@/components/ui/grid";
import { ProductCard } from "./product-card";

export interface ProductGridProps {
  products: Product[];
  shipping?: ShippingEstimate;
  /** Estado de carga: muestra skeletons en la misma grilla (2→3→4). */
  loading?: boolean;
  skeletonCount?: number;
  emptyState?: React.ReactNode;
  className?: string;
}

/**
 * Grilla de catálogo (2 móvil → 3 tablet → 4 desktop, §9.4). Maneja sus
 * estados loading (skeletons) y empty (EmptyState cálido) de forma consistente.
 */
export function ProductGrid({
  products,
  shipping,
  loading = false,
  skeletonCount = 8,
  emptyState,
  className,
}: ProductGridProps) {
  if (loading) {
    return (
      <Grid cols={2} md={3} lg={4} gap={6} className={className}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface p-4">
            <Skeleton className="aspect-square w-full" />
            <Skeleton shape="text" className="w-1/3" />
            <Skeleton shape="text" className="w-2/3" />
            <Skeleton shape="text" className="mt-1 h-6 w-1/2" />
          </div>
        ))}
      </Grid>
    );
  }

  if (products.length === 0) {
    return (
      <>
        {emptyState ?? (
          <EmptyState
            icon="🔍"
            title="No encontramos productos"
            description="Prueba ajustar los filtros o buscar de otra forma."
          />
        )}
      </>
    );
  }

  return (
    <Grid cols={2} md={3} lg={4} gap={6} className={className}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} shipping={shipping} />
      ))}
    </Grid>
  );
}
