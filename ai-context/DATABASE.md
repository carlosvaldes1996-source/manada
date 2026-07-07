# DATABASE — Modelo de datos

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Modelo de datos: entidades, relaciones, y el diseño del moat (Perfil de Mascota). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟡 Implementado: catálogo (§5) + cuentas/sesión (§6), Medusa-native. Moat (§1) aún borrador. |
> | **Last Updated** | 2026-07-06 |
> | **Depends On** | ARCHITECTURE.md, UX.md (§3 personalización) |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ del *modelo de datos* (cuando madure en Fase 4). |

> *Estado: §1–4 = borrador conceptual del moat (post-MVP). §5 = catálogo MVP YA
> implementado en el backend Medusa (Fase 5 · Etapa 2); es la fuente de verdad viva.*

## 1. Entidad crítica: PERFIL DE MASCOTA (el moat)
El activo que se compone con el tiempo. Debe diseñarse para enriquecerse con cada interacción.

Campos preliminares:
- `id`, `owner_id`, `nombre`, `especie`, `raza`, `fecha_nacimiento` (→ edad/etapa), `peso`, `condiciones` (alergias, enfermedades), `nivel_actividad`, `preferencias` (sabores, texturas), `comuna`.
- Derivados: etapa de vida (cachorro/adulto/senior), frecuencia de consumo estimada, próximas necesidades anticipadas.

## 2. Entidades core (borrador)
- `usuario` (1—N) `mascota`
- `producto` (variantes, marca, categoría, etapa de vida objetivo)
- `suscripcion` (mascota, producto, frecuencia, próxima_fecha, descuento)
- `orden` / `linea_orden`
- `direccion`
- `boleta` (folio SII)
- `evento_mascota` (timeline: cambios de etapa, recordatorios de salud)

## 3. Principio de diseño
Modelar para **anticipación**: la DB no solo registra compras, sino que permite predecir cuándo se acaba el alimento y qué necesitará la mascota a futuro.

## 4. Pendientes
- Esquema completo + relaciones + índices.
- Modelo del motor de frecuencia de recompra.
- Política de datos/privacidad (Ley 19.628 CL).

---

## 5. Catálogo MVP — IMPLEMENTADO (Fase 5 · Etapa 2, D23) · Medusa-native

Modelo real del catálogo, ya en el backend (`apps/backend`). **Todo lo que define
cómo se muestra y vende un producto vive en el catálogo administrable de Medusa**:
agregar productos = crearlos en el Admin, sin tocar código ni el frontend.

### 5.1 Campos NATIVOS de Medusa (primera clase en el Admin)
| Concepto Manada | Entidad Medusa | Notas |
|---|---|---|
| precio base (`price`) | `variant.prices[currency=clp]` | **único precio**; CLP entero |
| formato / peso | `variant.title` (opción "Formato"/"Talla") + `product.weight` | ej. "3 kg" |
| SKU | `variant.sku` | |
| stock | `inventory_item` + `inventory_level.stocked_quantity` | por bodega |
| categoría (departamento) | `product.categories` | Alimento · Accesorios · Farmacia · Higiene · Snacks |
| imágenes | `product.thumbnail` / `product.images` | hoy vacío → placeholder emoji (U090); al subir fotos en el Admin se muestran solas |
| nombre / descripción | `product.title` / `product.description` | título con patrón "Marca — Nombre" |

### 5.2 Metadata propia de Manada (`product.metadata`)
Atributos de merchandising que Medusa no modela nativamente. Viven en la metadata
del producto (editable en el Admin, sección *Metadata*). **Convención de claves:**

| Clave | Tipo | Ejemplo | Uso |
|---|---|---|---|
| `brand` | string | `"Royal Canin"` | marca visible (overline, filtro de marca) |
| `species` | string (coma) | `"perro,gato"` | valores: `perro` \| `gato` \| `otro` |
| `stage` | string (coma) | `"adulto,senior"` | valores: `cachorro` \| `adulto` \| `senior` |
| `subscribable` | boolean | `true` | ¿admite suscripción? |
| `subscription_discount_percentage` | number | `15` | % de ahorro; **el precio de suscripción lo calcula el backend** (no se almacena) |
| `rating` | number | `4.8` | 0–5 |
| `review_count` | number | `212` | nº de reseñas |

- Semilla: `apps/backend/src/scripts/seed.ts` (comentario con la convención).
- El Admin guarda metadata como **strings**; el backend y el mapper aceptan string
  o valor nativo (boolean/number). No requiere código por producto.
- **Escalabilidad:** una marca nueva escrita en `brand` aparece sola como faceta en
  la PLP (las facetas de marca se derivan de los productos reales).

### 5.3 Regla de precio (D23) — un solo precio base
Cada producto tiene **un único `price`** (precio de variante). Si es suscribible,
guarda `subscription_discount_percentage`. El **precio de suscripción es derivado,
NUNCA almacenado**: si cambia el precio normal, el de suscripción se actualiza solo.
Cálculo y contrato de API en `API.md §5`.

### 5.4 Rebajas / "precio antes" (compareAt)
No se siembran rebajas falsas (coherente con marca honesta). Una rebaja real se
modela con el mecanismo nativo de Medusa (**price list / sale**, administrable); el
frontend ya la refleja automáticamente (`original_amount` > `calculated_amount`).

### 5.5 Fuera del MVP (post-tracción)
Perfil de Mascota (§1), suscripción como entidad, motor de anticipación, boleta SII
→ módulos custom de Medusa **después** del MVP (D21/D22). El catálogo actual es el piso.

---

## 6. Cuentas y sesión — IMPLEMENTADO (Fase 5 · Etapa A, D26) · Medusa-native

Las cuentas de cliente usan **entidades nativas de Medusa** (Auth + Customer +
Order Modules); **cero tablas propias, cero módulos custom**. El frontend solo
consume la Store API (ver `API.md §7`); mapea a `User` en `lib/medusa/auth.ts`.

| Concepto Manada | Entidad / mecanismo nativo de Medusa | Notas |
|---|---|---|
| identidad de acceso | **Auth Module** (`auth_identity`, provider `emailpass`) | email + contraseña; JWT emitido por el backend |
| cliente / cuenta | **Customer** (`customer`: `email`, `first_name`, `last_name`) | `mapCustomer` → `User` (`firstName`/`lastName`/`email`) |
| sesión | **JWT** persistido por el SDK en `localStorage` (browser) | `auth:{type:"jwt"}`; SSR = `nostore`; re-hidrata con `customer.retrieve()` |
| recuperación de clave | evento **`auth.password_reset`** + token de un solo uso | entrega vía subscriber (`password-reset.ts`); email real diferido |
| direcciones | **Customer Address** (`customer_address`) | CRUD nativo; Chile: `country_code:"cl"`, comuna→`city`, región→`province` |
| pedidos del cliente | **Order** ligada a `customer_id` | historial vía `store.order.list`; la orden se liga al completar el carrito transferido |
| carrito ↔ cliente | `store.cart.transferCart` (nativo) | asocia el carrito de invitado al cliente al iniciar sesión |

- **Compra de invitado:** una orden creada sin sesión queda ligada al **email**, no
  a un `customer`. Vincular órdenes de invitado a una cuenta creada después = flujo
  nativo `order.requestTransfer` (requiere email) → **recomendación futura**, no MVP.
- **Secrets:** `JWT_SECRET`/`COOKIE_SECRET` son de desarrollo; rotarlos para producción
  (infra de lanzamiento, D25). El `STORE_CORS`/`AUTH_CORS` ya incluyen el storefront.

---

## 7. Envío — IMPLEMENTADO (Fase 5 · Etapa B, D28) · Medusa-native

Regla ÚNICA de envío, **definida en el backend** y consumida por el front (nunca
duplicada). Todo con entidades/mecanismos **nativos** de Medusa; cero lógica propia.

| Concepto | Mecanismo nativo | Notas |
|---|---|---|
| costo base | **Shipping Option** "Despacho Estándar" (flat) | `3990` CLP (seed); Express `5990` |
| envío gratis sobre umbral | **Promotion** automática (`is_automatic`) | `target_type: shipping_methods`, `value: 100`, regla `item_total ≥ 30000` → la **orden** queda con `shipping_total = 0` |
| valores (umbral + base) | `apps/backend/src/lib/shipping.ts` (constantes) | fuente única; alimenta seed + promoción + ruta |
| exposición al front | `GET /store/shipping-policy` | el front consume vía `getShippingPolicy()` (sin hardcodear) |

- La promoción se crea con el **script idempotente** `apps/backend/src/scripts/setup-free-shipping.ts`
  (`medusa exec`, sin reseed). Cambiar el umbral/costo = editar `lib/shipping.ts` (+ la
  opción en el Admin/seed) — un solo lugar.
- **Verificado:** orden bajo umbral → envío $3.990; orden sobre umbral → envío $0.
