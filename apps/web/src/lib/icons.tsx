import {
  Bird,
  Cat,
  CreditCard,
  Dog,
  Home,
  LayoutGrid,
  MapPin,
  Package,
  PawPrint,
  Pill,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  User,
  type LucideIcon,
} from "lucide-react";

/**
 * Resuelve los nombres de ícono usados en `config/nav.ts` a componentes de
 * lucide-react. Mantener este mapa sincronizado con los `icon:` del nav evita
 * un import dinámico de todo el set (bundle) y da type-safety sobre los nombres.
 */
const ICONS: Record<string, LucideIcon> = {
  Dog,
  Cat,
  Bird,
  Pill,
  Home,
  LayoutGrid,
  Search,
  PawPrint,
  ShoppingBag,
  RefreshCw,
  Package,
  MapPin,
  CreditCard,
  Receipt,
  User,
};

export interface NavIconProps {
  name?: string;
  className?: string;
}

/** Renderiza el ícono por nombre; si no existe, no renderiza nada. */
export function NavIcon({ name, className = "size-5" }: NavIconProps) {
  if (!name) return null;
  const Icon = ICONS[name];
  return Icon ? <Icon className={className} strokeWidth={1.75} aria-hidden /> : null;
}
