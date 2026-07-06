/**
 * Tipos de dominio de Manada.
 * El núcleo del producto (y del moat) es el Perfil de Mascota: ver UX.md §3.
 * Estos tipos son la base sobre la que se construyen los componentes (Etapa 2)
 * y las pantallas (Etapa 3).
 */

/* ----------------------------- Mascota (moat) ---------------------------- */

export type Species = "perro" | "gato" | "otro";

/** Etapa de vida — alimenta sugerencias de transición de fórmula. */
export type LifeStage = "cachorro" | "adulto" | "senior";

export interface Pet {
  id: string;
  name: string;
  species: Species;
  /** URL de avatar/foto, opcional (campo vacío = invitación cálida). */
  avatarUrl?: string;
  stage: LifeStage;
  /** Peso en kg — habilita el cálculo de ración y días restantes. */
  weightKg?: number;
  breed?: string;
  neutered?: boolean;
  /** Condiciones de salud (ej. "renal", "sobrepeso") para filtrar catálogo. */
  conditions?: string[];
  /** Producto de alimento actual (id) — base del nudge de recompra. */
  currentFoodId?: string;
  /** Completitud del perfil 0–100 (barra "lo que sabemos nos deja cuidarlo mejor"). */
  completeness?: number;
}

/* ----------------------------- Usuario / sesión -------------------------- */

/**
 * Usuario de la cuenta. Mínimo intencional (fricción baja, UX.md §1): la cuenta
 * se crea para GUARDAR el perfil de la mascota ya construido. Sin backend aún:
 * la sesión vive en memoria (Fase 3); el modelo real entra en Fase 4.
 */
export interface User {
  id: string;
  firstName: string;
  email: string;
  comuna?: string;
  region?: string;
}

/* ----------------------------- Catálogo ---------------------------------- */

export type ProductCategory =
  | "alimento"
  | "accesorios"
  | "farmacia"
  | "higiene"
  | "snacks";

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface Price {
  /** Precio actual en CLP (entero). */
  current: number;
  /** Precio anterior tachado, si hay rebaja (nunca rojo de oferta). */
  compareAt?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: Brand;
  category: ProductCategory;
  species: Species[];
  stage?: LifeStage[];
  price: Price;
  /** Formato/peso visible (ej. "3 kg"). */
  format?: string;
  rating?: { value: number; count: number };
  imageUrl?: string;
  /** ¿Admite suscripción? Si sí, se muestra el ahorro. */
  subscribable: boolean;
  /** % de ahorro al suscribirse (ej. 15). */
  subscriptionDiscount?: number;
  stock: number;
}

/* ----------------------------- Comercio ---------------------------------- */

/** Frecuencia de suscripción, en semanas. */
export type SubscriptionFrequencyWeeks = 2 | 4 | 6 | 8;

export interface CartItem {
  product: Product;
  quantity: number;
  /** Si la línea es por suscripción, su frecuencia en semanas. */
  subscriptionWeeks?: SubscriptionFrequencyWeeks;
}

/** Despacho honesto: fecha y costo reales, siempre visibles (UX.md §1). */
export interface ShippingEstimate {
  comuna: string;
  /** Fecha estimada de entrega. */
  date: Date;
  /** Costo en CLP (0 = gratis). */
  cost: number;
}

/* ----------------------------- Anticipación ------------------------------ */

/** Cápsula de anticipación que la UI ofrece (nunca impone) — UX.md §3. */
export interface AnticipationNudge {
  id: string;
  petId: string;
  kind: "recompra" | "transicion-etapa" | "farmacia" | "estacional";
  title: string;
  body: string;
  /** Explicación de "¿por qué te lo decimos?" (transparencia = confianza). */
  reason: string;
}
