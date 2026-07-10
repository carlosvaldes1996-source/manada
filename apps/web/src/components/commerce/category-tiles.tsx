import { Grid } from "@/components/ui/grid";
import { CATEGORIES } from "@/lib/catalog";
import { CategoryCard } from "./category-card";

export interface CategoryTilesProps {
  /** Cuántas categorías mostrar (la Home muestra 4: alimento, accesorios, farmacia, higiene). */
  count?: number;
  className?: string;
}

/**
 * Grid de accesos a categorías de la Home ("navegación por necesidad").
 *
 * Fuente ÚNICA compartida por la landing anónima (<LandingView>) y el panel con
 * sesión (<DashboardView>): ambos estados muestran EXACTAMENTE el mismo diseño
 * —íconos-foto por slug (`/fotos/icono-${slug}.jpg`), con fallback cálido si la
 * foto falta—. Antes cada vista inlineaba el grid con íconos distintos (foto en
 * landing vs. emoji en dashboard), lo que dejaba al usuario logueado con una
 * versión antigua de las tarjetas. Consolidado para evitar esa divergencia.
 */
export function CategoryTiles({ count = 4, className }: CategoryTilesProps) {
  return (
    <Grid cols={2} md={4} gap={4} className={className}>
      {CATEGORIES.slice(0, count).map((c) => (
        <CategoryCard
          key={c.id}
          label={c.label}
          href={`/categoria/${c.slug}`}
          description={c.description}
          imageUrl={`/fotos/icono-${c.slug}.jpg`}
        />
      ))}
    </Grid>
  );
}
