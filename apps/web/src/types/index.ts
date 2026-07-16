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

/**
 * Confianza del peso registrado (funnel F3 · onboarding estimable):
 * - `exacto` — el dueño lo sabe o lo pesó.
 * - `rango`  — eligió un bucket de tamaño (se usa el punto medio).
 * - `estimado` — derivado de la raza reconocida.
 * Cuando ≠ `exacto`, la ración/anticipación se muestran como estimadas.
 */
export type WeightSource = "exacto" | "rango" | "estimado";

export interface Pet {
  id: string;
  name: string;
  species: Species;
  /** URL de avatar/foto, opcional (campo vacío = invitación cálida). */
  avatarUrl?: string;
  stage: LifeStage;
  /** Peso en kg — habilita el cálculo de ración y días restantes. */
  weightKg?: number;
  /** Cómo se obtuvo el peso (exacto / rango / estimado). Ver {@link WeightSource}. */
  weightSource?: WeightSource;
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
 * Usuario de la cuenta = cliente real de Medusa (Fase 5 · Etapa A). Mínimo
 * intencional (fricción baja, UX.md §1). El mapeo Medusa `StoreCustomer` → `User`
 * vive en `lib/medusa/auth.ts` (`mapCustomer`); la sesión persiste vía el JWT del SDK.
 */
export interface User {
  id: string;
  firstName: string;
  /** Apellido (Medusa `last_name`) — usado en el prellenado del checkout. */
  lastName?: string;
  email: string;
  comuna?: string;
  region?: string;
  /** RUT del cliente (Medusa `metadata.rut`) — prellena el checkout en futuras compras. */
  rut?: string;
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

/** Variante de producto (distinto tamaño/peso). */
export interface ProductVariant {
  variantId: string;
  /** Etiqueta visible, ej. "3 kg" o "15 kg". */
  title: string;
  price: Price;
  stock: number;
}

export interface Product {
  id: string;
  /** ID de la variante primaria en Medusa — necesario para agregar al carrito. */
  variantId?: string;
  slug: string;
  name: string;
  brand: Brand;
  category: ProductCategory;
  species: Species[];
  stage?: LifeStage[];
  price: Price;
  /** Formato/peso visible (ej. "3 kg"). */
  format?: string;
  /** Descripción larga del producto (Medusa `description`). */
  description?: string;
  /** Todas las variantes disponibles, ordenadas por rank (para el selector de tamaño). */
  variants?: ProductVariant[];
  /**
   * Energía metabolizable del alimento en kcal/kg — base del cálculo de ración
   * (RER/MER ÷ densidad). Solo aplica a `alimento`; viene de `metadata.kcal_per_kg`.
   */
  kcalPerKg?: number;
  /**
   * Condiciones de salud para las que el alimento está formulado (vocabulario de
   * `PET_CONDITIONS`) — habilita el score `conditionTarget` y una razón verificada.
   */
  suitableConditions?: string[];
  /**
   * Condiciones para las que el alimento NO es apropiado — puerta de
   * contraindicación: nunca se recomienda si la mascota tiene una de estas.
   */
  notFor?: string[];
  rating?: { value: number; count: number };
  imageUrl?: string;
  /** ¿Admite suscripción? Si sí, se muestra el ahorro. */
  subscribable: boolean;
  /** % de ahorro al suscribirse (ej. 15) — para el badge "Ahorra 15%". */
  subscriptionDiscount?: number;
  /**
   * Precio unitario de suscripción en CLP, **calculado por el backend** a partir
   * del precio base y `subscriptionDiscount` (nunca se almacena un segundo precio).
   * El frontend lo consume tal cual, sin recalcular (ver lib/format.ts).
   */
  subscriptionPrice?: number;
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
