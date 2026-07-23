# DATABASE — Modelo de datos

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Modelo de datos: entidades, relaciones, y el diseño del moat (Perfil de Mascota). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Implementado y vivo: catálogo (§5), cuentas/sesión (§6), envío (§7), perfil de mascota (§8) — Medusa-native + módulo custom `pet`. 🟡 EN CONSTRUCCIÓN: suscripción (§9, módulo custom `subscription`, D55). |
> | **Last Updated** | 2026-07-23 |
> | **Depends On** | ARCHITECTURE.md, UX.md (§3 personalización) |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ del *modelo de datos*. |

## 1–4. (Superseded) Borrador conceptual del moat
> 🗄️ El borrador original fue **materializado**: la entidad crítica "Perfil de Mascota" es hoy la tabla real `pet` (§8, módulo custom D34) y el principio "modelar para anticipación" se implementó con `current_food_id` + `food_assigned_at` (reloj del servidor, re-anclado a la compra por D35). **Siguen pendientes (post-tracción):** `suscripcion` como entidad (recipe Medusa), `evento_mascota` (timeline), `boleta` (folio SII), y la **política de datos/privacidad (Ley 19.628 CL)** — esta última conviene resolverla antes del lanzamiento público.

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

### 5.5 Fuera del MVP (post-tracción) *(actualizado: el perfil ya entró)*
~~Perfil de Mascota~~ → ✅ implementado como módulo `pet` (§8, D34). Siguen post-tracción:
suscripción como entidad, motor de anticipación completo, boleta SII (D21/D22).

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

---

## 8. Perfil de mascota — IMPLEMENTADO (D34) · módulo custom `pet`

Materializa la entidad crítica de §1 con el alcance del MVP actual (los campos que el
frontend ya usa). **Primer módulo custom** (`apps/backend/src/modules/pet`), según D21:
extiende Medusa sin tocar el core. Tabla `pet`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | pk (`pet_…`) | DML `model.id({ prefix: "pet" })` |
| `name` | text | |
| `species` | enum `perro\|gato\|otro` | |
| `stage` | enum `cachorro\|adulto\|senior` | etapa, no fecha de nacimiento (FUNNEL §1.2) |
| `weight_kg` | float, null | |
| `weight_source` | enum `exacto\|rango\|estimado`, null | confianza del peso (F3) |
| `breed` | text, null | |
| `neutered` | boolean, null | |
| `conditions` | json, null | `string[]` (ej. `["renal"]`) |
| `avatar_url` | text, null | se llena con Pet Experience B4 (foto) |
| `current_food_id` | text, null | id de producto Medusa ("su alimento", B6) |
| `food_assigned_at` | timestamptz, null | **estampado por el backend** al cambiar `current_food_id`; ancla del cálculo de anticipación |

- **Relación con Customer: Module Link nativo 1→N (`src/links/customer-pet.ts`, D47),**
  que **gradúa** el atajo `customer_id` plano original de D34. La asociación vive en la
  tabla de enlace gestionada por el Link Module (`customer_customer_pet_pet`), respetando
  el aislamiento entre módulos y habilitando joins nativos con `query.graph`
  (`customer.pets` / `pet.customer`). La columna `customer_id` **fue eliminada** del modelo
  (fuente única, sin duplicar la referencia). **El contrato HTTP de `/store/pets` no cambió**
  (el mapper del front nunca leyó `customer_id`): las rutas resuelven la propiedad por el link.
- **`completeness` NO se almacena** (derivada; la calcula el front). La ración/anticipación
  tampoco: se derivan de `weight_kg` + `stage` + formato del producto (`lib/anticipation.ts`).
- Servicio: `MedusaService({ Pet })` (CRUD autogenerado). Contrato de API en `API.md §9`.
- §5.5 queda **superado en lo relativo al perfil**: la mascota ya es real; suscripción
  como entidad y boleta SII siguen post-tracción.

---

## 9. Suscripción — EN CONSTRUCCIÓN (Fase 6 · Punto 1, D55) · módulo custom `subscription`

Materializa el moat de recurrencia diferido en §5.5 (D22/D29), **reabierto por D55**. Tercer
módulo custom (`apps/backend/src/modules/subscription`), **mismo patrón que `pet` (§8) y
`payment-method` (API.md §10)**: extiende Medusa sin tocar el core. Se construye **por capas de
riesgo creciente** (D55); esta tabla es el **Punto 1** (modelo + creación al checkout con pago
simulado/manual — cero dinero). Contrato de API en `API.md §13`.

### 9.1 Tabla `subscription`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | pk (`sub_…`) | `model.id({ prefix: "sub" })` |
| `variant_id` | text | variante suscrita (formato elegido); id de Medusa |
| `product_id` | text | snapshot del producto (agrupar/mostrar) |
| `quantity` | integer (def. 1) | cantidad por entrega |
| `frequency_weeks` | integer | cadencia (2·4·6·8); las ofrecidas viven en el front (`SUBSCRIPTION_FREQUENCIES`) |
| `next_delivery_date` | timestamptz | próxima entrega; default natural derivado de la duración del saco (`lib/anticipation.ts`) |
| `status` | enum `active\|paused\|cancelled` | ciclo de vida; **las transiciones (pausar/cancelar) son Bloque 3**, no Punto 1 |
| `agreed_unit_price` | integer | **precio pactado** (CLP entero), **snapshot al crear** |
| `currency_code` | text (def. `clp`) | |
| `shipping_address` | json | **snapshot** de la dirección de entrega (no puntero) |
| `payment_method_id` | text, null | ref a `saved_card.id` (API.md §10); **null en Punto 1** (pago manual) |
| `source_order_id` | text, null | la orden de checkout que originó la suscripción (trazabilidad) |
| `created_at`/`updated_at`/`deleted_at` | timestamptz | nativos del modelo (soft-delete) |

### 9.2 Relaciones — Module Links nativos (como `pet`, §8)
- **`customer ↔ subscription` (1→N)** — `src/links/customer-subscription.ts`. La propiedad se
  resuelve traversando el link (`customer.subscriptions`), **sin columna plana `customer_id`**
  (mismo criterio que graduó a `pet` en D47). Un cliente tiene muchas suscripciones.
- **`pet ↔ subscription` (1→N, OPCIONAL)** — `src/links/pet-subscription.ts`. Se crea **solo si**
  la compra está ligada a una mascota del cliente → alimenta "el plan de {nombre}" (D42). Una
  mascota puede tener varias suscripciones; una suscripción alimenta a lo sumo una mascota.

### 9.3 Diseño (por qué así — escalable, sin romper nada)
- **Precio pactado como snapshot** (`agreed_unit_price`): la política de qué pasa si el precio de
  catálogo sube es un **borde del scheduler/pago real** (Bloque 2/4); el modelo guarda el pactado y
  no fuerza la decisión ahora.
- **Dirección como snapshot** (no FK a `customer_address`): cambiar la dirección de la cuenta **no**
  reescribe entregas ya pactadas; cada suscripción es autónoma.
- **`payment_method_id` nullable** desde ya: el **Bloque 4** (pago recurrente real) llena esta
  referencia contra `saved_card`/Mercado Pago **sin migración** (el esqueleto de `payment-method`
  ya está diseñado para MP recurrente, API.md §10.1). Escalabilidad sin trabajo muerto.
- **`status` acotado a 3 estados** en Punto 1; estados de fallo (`past_due`, `paused_no_stock`, …)
  se **anexan** al enum cuando exista el cobro (Bloque 5), no antes.
- **Aditivo puro:** tabla nueva + 2 links + registro del módulo. **No toca** ninguna tabla, módulo
  ni contrato existente (catálogo, cuentas, envío, `pet`, `payment-method`, órdenes).
- Servicio: `MedusaService({ Subscription })` (CRUD autogenerado).

### 9.4 Creación — server-side al checkout
La **fila** `subscription` **nace en un subscriber de `order.placed`** (Punto 1 · Bloque 1.3), no desde
un formulario (mismo criterio que `saved_card`, API.md §10.1). La intención + el **precio suscrito**
viajan en la **metadata de la línea del carrito** (`is_subscription` + `frequency_weeks`), que el
storefront agrega por una **ruta propia** (`POST /store/carts/:id/subscription-items`, API.md §13.2)
que además fija el precio con descuento como precio custom de la línea → sobrevive a
`order.items[].metadata` → el subscriber crea la suscripción con el snapshot (`agreed_unit_price` = el
precio de la línea). Convive con los dos subscribers de `order.placed` ya existentes
(`food-purchased.ts`, `order-placed-email.ts`) **sin tocarlos**: Medusa admite múltiples handlers por evento.
