/**
 * Arquitectura de navegación de Manada (UX.md §2, PROTOTYPE_BRIEF §6).
 * Navegación por NECESIDAD: especie → necesidad → etapa (nunca por marca).
 */

export interface NavItem {
  label: string;
  href: string;
  /** Nombre de icono de lucide-react (se resuelve en el componente). */
  icon?: string;
  children?: NavItem[];
}

/**
 * Navegación principal (barra de necesidad bajo el header en desktop).
 * SOLO catálogo (por necesidad). Los destinos personales (suscripciones,
 * pedidos, mascotas) viven en "Mi cuenta", no se mezclan aquí (AUDIT U061).
 */
export const MAIN_NAV: NavItem[] = [
  {
    label: "Comprar",
    href: "/categoria/todo",
    children: [
      { label: "Perro", href: "/categoria/perro", icon: "Dog" },
      { label: "Gato", href: "/categoria/gato", icon: "Cat" },
      { label: "Otros", href: "/categoria/otros", icon: "Bird" },
    ],
  },
  { label: "Alimento", href: "/categoria/alimento" },
  { label: "Accesorios", href: "/categoria/accesorios" },
  { label: "Farmacia", href: "/categoria/farmacia", icon: "Pill" },
  { label: "Marcas", href: "/categoria/marcas" },
  { label: "Ofertas", href: "/categoria/ofertas" },
];

/**
 * Barra inferior fija en móvil — 5 destinos con la mascota al centro.
 * "Buscar" se quitó (redundante con el buscador del header, AUDIT U059);
 * el search móvil vive ahora en el header (U060).
 */
export const BOTTOM_NAV: NavItem[] = [
  { label: "Inicio", href: "/", icon: "Home" },
  { label: "Comprar", href: "/categoria/todo", icon: "LayoutGrid" },
  { label: "Mascotas", href: "/cuenta/mascotas", icon: "PawPrint" },
  { label: "Cuenta", href: "/cuenta", icon: "User" },
  { label: "Carrito", href: "/carrito", icon: "ShoppingBag" },
];

/**
 * Mega-menú "Comprar" — navegación por NECESIDAD (especie → necesidad → etapa),
 * no por marca (UX.md §2, DESIGN_SYSTEM §12.4).
 */
export interface MegaColumn {
  title: string;
  items: { label: string; href: string }[];
}

export const MEGA_MENU: MegaColumn[] = [
  {
    title: "Por mascota",
    items: [
      { label: "Perro", href: "/categoria/perro" },
      { label: "Gato", href: "/categoria/gato" },
      { label: "Otros", href: "/categoria/otros" },
    ],
  },
  {
    title: "Por necesidad",
    items: [
      { label: "Alimento", href: "/categoria/alimento" },
      { label: "Farmacia y salud", href: "/categoria/farmacia" },
      { label: "Accesorios", href: "/categoria/accesorios" },
      { label: "Higiene", href: "/categoria/higiene" },
    ],
  },
  {
    title: "Por etapa",
    items: [
      { label: "Cachorro", href: "/categoria/cachorro" },
      { label: "Adulto", href: "/categoria/adulto" },
      { label: "Senior", href: "/categoria/senior" },
    ],
  },
];

/** Secciones de "Mi cuenta" (UX.md §2.1). */
export const ACCOUNT_NAV: NavItem[] = [
  { label: "Mis mascotas", href: "/cuenta/mascotas", icon: "PawPrint" },
  { label: "Mis suscripciones", href: "/cuenta/suscripciones", icon: "RefreshCw" },
  { label: "Pedidos", href: "/cuenta/pedidos", icon: "Package" },
  { label: "Direcciones", href: "/cuenta/direcciones", icon: "MapPin" },
  { label: "Medios de pago", href: "/cuenta/pagos", icon: "CreditCard" },
  { label: "Boletas", href: "/cuenta/boletas", icon: "Receipt" },
];

/**
 * Rutas de "Mi cuenta" YA implementadas (fuente única). El menú móvil solo enlaza
 * estas para no generar 404; el panel de cuenta muestra el resto como "Pronto".
 */
export const LIVE_ACCOUNT_HREFS = new Set<string>([
  "/cuenta/mascotas",
  "/cuenta/pedidos",
  "/cuenta/direcciones",
]);
