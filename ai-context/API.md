# API — Endpoints, contratos, integraciones

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Contratos de API entre frontend y backend, e integraciones externas CL. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Contratos IMPLEMENTADOS y vivos: catálogo (§5), carrito+checkout (§6), cuentas+sesión (§7), buscador+envío (§8), mascotas (§9). |
> | **Last Updated** | 2026-07-11 |
> | **Depends On** | ARCHITECTURE.md, DATABASE.md |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ de *contratos de API*. Regla `ARCHITECTURE.md §2`: todo contrato nuevo se escribe AQUÍ antes de implementarse. |

## 1–4. (Superseded) Borrador conceptual de Fase 4
> 🗄️ El borrador original de dominios/integraciones fue **superado por los contratos reales §5–§9** (todo lo implementado) y por `ARCHITECTURE.md §4` (integraciones CL pendientes: Mercado Pago primero, luego Webpay/courier/SII/WhatsApp). Contratos futuros (suscripción recurrente, webhooks de pago) se escribirán aquí antes de implementarse.

---

## 5. Contrato de catálogo — IMPLEMENTADO (Fase 5 · Etapa 2, D23)

`apps/web` consume el catálogo **solo** por la **Store API REST de Medusa**
(`http://localhost:9000/store/*`, header `x-publishable-api-key`). La capa que lo
encapsula vive en `apps/web/src/lib/medusa/` (cliente SDK + `listProducts` /
`getProductByHandle` + `mapProduct`). El frontend **no hace cálculos de negocio**.

### 5.1 Lectura de productos
- `GET /store/products?region_id=<clp>&fields=<PRODUCT_FIELDS>` — lista.
- `GET /store/products?handle=<slug>&region_id=<clp>&...` — por slug (PDP).
- **`region_id` obligatorio**: Medusa calcula el precio CLP (`variant.calculated_price`)
  según la región. Región resuelta una vez (`getRegionId`, cachea la de moneda `clp`).
- **`PRODUCT_FIELDS`** (en `lib/medusa/map-product.ts`) incluye `+metadata`
  (¡el `+` es obligatorio: un `metadata` "pelado" hace que Medusa devuelva solo
  `id`+`metadata` y descarte `title`/`handle`!), `*variants.calculated_price`,
  `+variants.inventory_quantity`, `*categories`, `*images`.

### 5.2 Campo calculado `subscription_price` (regla de precio, D23)
Manada tiene **un solo precio base**. El **backend** expone además el precio de
suscripción ya calculado, para que el frontend solo lo consuma (`price` +
`subscription_price`), sin recalcular:

- Implementado en `apps/backend/src/api/middlewares.ts`: un middleware envuelve
  `res.json` de `GET /store/products[/:id]` e inyecta `product.subscription_price`.
- Fórmula: `floor( base × (1 − subscription_discount_percentage/100) / 10 ) × 10`
  (redondeo CLP a $10, **idéntico** a `apps/web/src/lib/format.ts`, U066).
- `null` si el producto no es suscribible o no hay descuento.
- Se preservan intactos los features nativos de `/store/products` (precio por
  región, filtros, paginación).

### 5.3 Mapeo a dominio (`mapProduct`)
`StoreProduct` → `Product` (tipo del frontend). Único punto que conoce la forma de
Medusa. Lee atributos de `metadata` (ver `DATABASE.md §5.2`) y campos nativos; **no
infiere nada desde el nombre**. Filtros de PLP (especie/etapa/categoría/marca) y
facetas se resuelven en `apps/web/src/lib/catalog.ts` sobre los productos reales.

### 5.4 Checkout (verificado en D22)
Sin cambios en Etapa 2: `POST /store/carts` → line-items → dirección/email →
shipping-options/methods → payment-collections/sessions (`pp_system_default`) →
`complete`. Pago manual (transferencia); fulfillment y boleta a mano en el Admin.

### 5.5 Estado de lo demo en `apps/web` *(actualizado 2026-07-11)*
Ya **no queda ningún flujo real sobre datos demo** (D33): dashboard/perfil/anticipación
se derivan de `/store/pets` (§9) + catálogo real. `lib/demo-data.ts` solo alimenta el
hero de la landing (decisión de marca, D28) y el styleguide `/dev/*` (gateado en prod, D29).

---

## 6. Contrato de carrito + checkout — IMPLEMENTADO (Fase 5 · Etapa 3, D24)

Compra de punta a punta sobre la Store API de Medusa, **100% nativo**. Capas en
`apps/web/src/lib/medusa/`: `cart.ts` (carrito) y `checkout.ts` (checkout→orden).
El `cart_id` se persiste en `localStorage` (`manada_cart_id`).

### 6.1 Carrito (`cart-provider` + `cart.ts`)
- `POST /store/carts` (`region_id`) — crea carrito (perezoso, al primer ítem).
- `GET /store/carts/:id?fields=+items.product.metadata,*items.product.categories` —
  hidrata; cada línea trae marca (metadata) y categoría para la UI.
- `POST /store/carts/:id/line-items` · `POST .../line-items/:lineId` · `DELETE .../line-items/:lineId`.
- La línea de Medusa → `CartItem` con `mapLineItemProduct` (precio = `unit_price`).

### 6.2 Checkout → orden (`checkout.ts`) — secuencia nativa
1. `POST /store/carts/:id` — `email` (invitado) + `shipping_address` + `billing_address`
   (Chile: `country_code: "cl"`, comuna→`city`, región→`province`).
2. `GET /store/shipping-options?cart_id=:id` (`fulfillment.listCartOptions`) → opciones
   reales (Estándar $3.990 / Express $5.990) → `POST /store/carts/:id/shipping-methods`.
3. Pago **manual**: `initiatePaymentSession(cart, { provider_id: "pp_system_default" })`
   (crea payment collection + sesión).
4. `POST /store/carts/:id/complete` → `{ type: "order", order }` = **orden real**
   (o `{ type: "cart", error }` si falla). Tras crear la orden, el front vacía el
   carrito (`clear`) y va a `/checkout/confirmacion?orden=<display_id>`.

### 6.3 Efectos nativos (sin código propio)
- **Inventario:** crear la orden **reserva** stock (baja el disponible); el `stocked`
  físico baja al marcar el **fulfillment manual** en el Admin.
- **Orden** queda `pending` con pago `authorized` (manual), visible en el Admin
  para preparar el despacho a mano (D22). Sin courier/SII/WhatsApp.

### 6.4 Siguiente etapa
**Mercado Pago Checkout Pro** (payment provider module + webhook + redirect/
confirmación). *La transferencia carrito→cliente al iniciar sesión ya está
implementada — ver §7.3.*

---

## 7. Contrato de cuentas y sesión — IMPLEMENTADO (Fase 5 · Etapa A, D26)

Auth de cliente **100% nativa de Medusa** (Auth + Customer + Order Modules). Capas
en `apps/web/src/lib/medusa/`: `auth.ts` (sesión) y `account.ts` (pedidos +
direcciones). El SDK se configura con `auth: { type: "jwt" }` (client.ts): en el
navegador el token vive en `localStorage` (**sesión persistente**) y viaja como
`Authorization: Bearer`; en SSR cae a `nostore` (sin token) → el catálogo
`force-dynamic` se sigue leyendo con la publishable key. `actor = "customer"`,
`provider = "emailpass"`.

### 7.1 Registro / login / logout
- **Registro (3 pasos, patrón oficial):** `auth.register("customer","emailpass",{email,password})`
  (token de registro) → `store.customer.create({email,first_name,last_name})` →
  `auth.login(…)` (token final, ya con `customer_id`). Lanza si el correo ya existe.
- **Login:** `auth.login("customer","emailpass",{email,password})` → `store.customer.retrieve()`.
- **Logout:** `auth.logout()` (limpia el token del SDK).
- **Sesión inicial:** `store.customer.retrieve()` al montar (`getCurrentCustomer` →
  `null` si no hay token válido). `mapCustomer`: `StoreCustomer` → `User` del front.

### 7.2 Recuperación de contraseña
- **Solicitud:** `auth.resetPassword("customer","emailpass",{identifier:email})` →
  Medusa emite el evento `auth.password_reset`. Respuesta **anti-enumeración** (no
  revela si el correo existe). Pantalla `/recuperar`.
- **Entrega del token:** subscriber del backend `apps/backend/src/subscribers/password-reset.ts`
  (evento `auth.password_reset`) → **email transaccional real** vía Notification Module + Resend
  (plantilla `reset-password`, D45 · ver §11). **Dev sin `RESEND_API_KEY`:** el provider loguea el
  enlace `/recuperar/nueva?token=…` (mismo DX que antes). El frontend no cambió.
- **Fijar nueva:** `auth.updateProvider("customer","emailpass",{password}, token)`.
  Pantalla `/recuperar/nueva?token=…` → al éxito, `/ingresar`.

### 7.3 Transferencia de carrito invitado → cliente
- Nativo `store.cart.transferCart(cart_id)`. `useAuthActions` lo llama tras login/
  registro (con el `cart_id` persistido en `localStorage`) → el carrito pasa a
  `customer_id`, de modo que la orden que se complete queda **ligada al cliente**
  y aparece en su historial. Al cerrar sesión se **olvida** el carrito local (reset).

### 7.4 Historial de pedidos y direcciones (cliente autenticado)
- **Pedidos:** `store.order.list({ fields, order: "-created_at", limit })` →
  `OrderView` (display_id, fecha, total, estado legible, líneas). Ruta `/cuenta/pedidos`.
- **Direcciones (CRUD nativo):** `store.customer.listAddress` · `createAddress` ·
  `updateAddress(id,…)` · `deleteAddress(id)` (Chile: `country_code:"cl"`,
  comuna→`city`, región→`province`). Ruta `/cuenta/direcciones`.

### 7.5 Compra de invitado (sin cambios)
El checkout de invitado (§6.2) sigue **idéntico**; para el cliente autenticado solo
se **prellenan** nombre/correo desde la sesión. Guest checkout nunca se bloquea.

### 7.6 Pendiente (recomendaciones, no implementadas)
Email transaccional ✅ **implementado** (D45, §11). Sigue pendiente: **reclamo de órdenes de
invitado** al registrarse con el mismo correo (`order.requestTransfer`, nativo, requiere email);
selección de dirección guardada dentro del checkout.

---

## 8. Buscador + política de envío — IMPLEMENTADO (Fase 5 · Etapa B, D28)

### 8.1 Buscador (`q` nativo)
- **`GET /store/products?q=<texto>&region_id=<clp>&fields=<PRODUCT_FIELDS>`** — búsqueda
  de texto libre nativa de Medusa (título, descripción, etc.). Encapsulado en
  `apps/web/src/lib/medusa/products.ts` → `searchProducts(query)` / `listProducts({ q })`.
- La página `/buscar?q=` (server, `force-dynamic`) consume `searchProducts` y renderiza
  la grilla real; el `SearchBar` del header (`HeaderSearch`) navega ahí. Sin índice
  externo (Meilisearch/Algolia = escala, diferido).

### 8.2 Política de envío — FUENTE ÚNICA en el backend
Manada tiene **una sola regla de envío**, definida en el backend y **nunca duplicada
en el front**: *gratis sobre `free_shipping_threshold`; bajo ese monto, `base_shipping_amount`.*

- **`GET /store/shipping-policy`** → `{ shipping_policy: { currency_code, base_shipping_amount,
  free_shipping_threshold } }`. Valores en `apps/backend/src/lib/shipping.ts` (fuente única;
  hoy `3990` / `30000` CLP). El front lo consume con `getShippingPolicy()`
  (`apps/web/src/lib/medusa/shipping.ts`) para la barra de envío gratis, la PDP
  (`ShippingPolicyNote`) y el carrito. **No hay umbral ni costo hardcodeados en el front.**
- **Cobro real (nativo):** la opción "Despacho Estándar" ($3.990) vive en el seed; el
  "gratis sobre el umbral" es una **promoción automática** (`is_automatic`,
  `application_method: { type: "percentage", target_type: "shipping_methods", value: 100,
  allocation: "across" }`, regla `item_total ≥ 30000`) creada por el script idempotente
  `apps/backend/src/scripts/setup-free-shipping.ts` (sin reseed). Así, al completar el
  carrito, **la orden real queda con `shipping_total = 0`** cuando el subtotal alcanza el
  umbral (verificado: orden bajo umbral → $3.990; orden sobre umbral → $0).

### 8.3 Auditoría de copy (sin promesas de terceros)
El contenido visible se alineó a la realidad del MVP: **no** se promete Webpay, boleta
electrónica SII automática ni "pago protegido"; el pago es **transferencia manual** y el
despacho se **coordina** tras la compra (sin fecha/comuna inventadas por tarjeta).
Reseñas y ratings **ocultos** hasta que exista un sistema real.

---

## 9. Contrato de mascotas (`/store/pets`) — módulo custom `pet` (D34)

Primer módulo custom del proyecto (previsto en D21 como `pet-profile`). Persiste el
perfil de mascota del cliente para que onboarding/perfil/dashboard/anticipación dejen
el estado en memoria y consuman **una sola fuente de verdad**. Encapsulado en
`apps/web/src/lib/medusa/pets.ts`; el frontend **no** conoce la forma del backend
fuera del mapper.

### 9.1 Autenticación y alcance
- Todas las rutas exigen **cliente autenticado**: `authenticate("customer", ["bearer","session"])`
  (mismo JWT de §7 vía `Authorization: Bearer`) **más** la publishable key de la Store API.
- Un cliente solo ve/toca **sus** mascotas (`customer_id` del `auth_context`); acceder a
  una ajena responde **404** (no revela existencia).
- **Invitados NO persisten** server-side: el funnel sigue creando la mascota en memoria;
  al registrarse/iniciar sesión, el frontend **empuja** las mascotas en memoria al backend
  (espejo del patrón `transferCart`, §7.3).

### 9.2 Endpoints
- **`GET /store/pets`** → `{ pets: StorePet[] }` — las mascotas del cliente (orden `created_at` asc).
- **`POST /store/pets`** — body `{ name, species, stage, weight_kg?, weight_source?, breed?,
  neutered?, conditions? }` → `{ pet: StorePet }` (201).
- **`PATCH /store/pets/:id`** — body parcial (los mismos campos + `current_food_id?`,
  `avatar_url?`) → `{ pet: StorePet }`. **Regla de anticipación:** cuando el body trae
  `current_food_id`, el **backend** estampa `food_assigned_at = now()` (reloj del servidor,
  fuente única del "desde cuándo come esto"); el cliente jamás envía esa fecha.
- **Re-anclaje a la compra (D35):** el subscriber `order.placed`
  (`apps/backend/src/subscribers/food-purchased.ts`) re-estampa `food_assigned_at` a la
  fecha de la orden cuando una orden confirmada del cliente incluye el alimento que una
  mascota suya tiene asignado (match `order.items.product_id` ↔ `pet.current_food_id` —
  sin `pet_id` en las líneas del carrito: el vínculo vive SOLO en la mascota). Orden de
  invitado → no-op.
- Validación con **zod** vía `validateAndTransformBody` (schemas en
  `src/api/store/pets/validators.ts`); enums de especie/etapa/fuente-de-peso rechazados
  en el borde. Sin `DELETE` por ahora (no existe UI que lo consuma; se agrega con su bloque).

### 9.3 `StorePet` (shape del backend)
`{ id, name, species: "perro"|"gato"|"otro", stage: "cachorro"|"adulto"|"senior",
weight_kg: number|null, weight_source: "exacto"|"rango"|"estimado"|null, breed: string|null,
neutered: boolean|null, conditions: string[]|null, avatar_url: string|null,
current_food_id: string|null, food_assigned_at: string(ISO)|null, created_at, updated_at }`.
Mapper del front: `StorePet → Pet` (camelCase; `completeness` NO se almacena — es derivada
y se calcula en el front). Modelo de datos en `DATABASE.md §8`.

---

## 10. Contrato de medios de pago (`/store/payment-methods`) — módulo custom `payment-method`

Referencias a las tarjetas guardadas del cliente para la vista "Mis tarjetas" de
`/cuenta/pagos`. Segundo módulo custom (patrón idéntico a `pet`, §9). Encapsulado en
`apps/web/src/lib/medusa/payment-methods.ts`; el frontend no conoce la forma del
backend fuera del mapper.

### 10.1 Decisión de arquitectura (evaluación Mercado Pago, 2026-07-12)
- **Persistencia interna de REFERENCIAS, no gestión directa de tokens MP** en esta etapa:
  MP aún no está provisionado (fast-follow post-infra, D25 G4) y la integración elegida
  es **Checkout Pro**, donde MP hospeda las tarjetas del comprador — la API de
  Customers & Cards solo se vuelve necesaria con Checkout API/suscripciones (post-tracción).
- La tabla `saved_card` guarda SOLO presentación (franquicia, últimos 4, vencimiento) y
  punteros a la pasarela (`gateway`, `gateway_customer_id`, `gateway_card_id`), mapeo 1:1
  con el objeto `card` de MP → integrar MP después es llenar datos, no migrar esquema.
- **Nunca se almacena PAN/CVV** (alcance PCI cero). Por eso **no existe POST**: las filas
  nacen server-side en la integración de pago (checkout/webhook MP), jamás desde un
  formulario propio.

### 10.2 Endpoints
- Autenticación y alcance idénticos a §9.1: `authenticate("customer", ["bearer","session"])`
  + publishable key; propiedad por `customer_id` del `auth_context`; ajeno → **404**.
- **`GET /store/payment-methods`** → `{ payment_methods: SavedCard[] }` (orden `created_at` desc).
- **`DELETE /store/payment-methods/:id`** → `{ id, object: "saved_card", deleted: true }`.
  Soft delete (auditable). Al integrar MP, el servicio además revoca la card en MP
  (`DELETE /v1/customers/{gateway_customer_id}/cards/{gateway_card_id}`) sin cambio de contrato.

### 10.3 `SavedCard` (shape del backend)
`{ id, customer_id, gateway: "mercadopago", gateway_customer_id: string|null,
gateway_card_id: string|null, brand: string ("visa"|"master"|"amex"|…, ids de MP),
last4: string, exp_month: number, exp_year: number, created_at, updated_at }`.
Mapper del front: `StoreSavedCard → SavedCardView` (`brandLabel` legible + `expiry` "MM/AA").

---

## 11. Contrato de emails transaccionales — IMPLEMENTADO (D45)

> Owner técnico: `apps/backend/src/modules/resend/`. **No hay contrato de storefront**: los
> emails los dispara el backend al reaccionar a **eventos nativos de Medusa** — el frontend no
> cambia y no hay endpoints nuevos.

### 11.1 Arquitectura
- **Notification Module nativo** de Medusa (registrado en `medusa-config.ts`; en v2 no viene por
  defecto) + **provider custom Resend** (`src/modules/resend`, `AbstractNotificationProviderService`).
- **Sistema de plantillas reutilizable** en `src/modules/resend/emails/`: `theme.ts` (tokens de marca
  espejo de `globals.css` + `formatCLP`), `base.tsx` (`EmailLayout` + componentes comunes
  `Title`/`Paragraph`/`Button`/`Panel`/`DataRow`/`Divider`), plantillas `*.tsx`, y registro central
  `index.ts` (`EmailTemplate` id → `{ subject, render }`). **Agregar un email = 1 `.tsx` + 1 entrada.**
- **Envío:** los subscribers llaman `notificationModuleService.createNotifications({ to, channel:"email", template, data })`;
  el provider resuelve la plantilla, renderiza React Email y envía por Resend.
- **Modo DEV:** sin `RESEND_API_KEY` el provider **loguea** el email (destinatario, asunto, enlace) en
  vez de enviar → no bloquea dev ni el arranque. Prod se activa con la env var (`DEPLOYMENT.md`).

### 11.2 Emails ↔ eventos (los 4 críticos)
| Email | Evento nativo | Subscriber | Filtro / notas |
|---|---|---|---|
| Bienvenida | `customer.created` | `customer-created.ts` | solo si `has_account` (no a invitados de checkout) |
| Recuperar contraseña | `auth.password_reset` | `password-reset.ts` | reemplaza el `console.log`; `data.url` = enlace de un solo uso |
| Compra realizada | `order.placed` | `order-placed-email.ts` | subscriber **separado** de `food-purchased.ts` (anticipación, D35) |
| Pedido enviado | `shipment.created` | `order-shipped.ts` | orden resuelta desde el fulfillment (link nativo); respeta `no_notification` |

### 11.3 Suscripción — DIFERIDA
No se implementan emails de suscripción: **no existen eventos de suscripción recurrente** en el
backend (moat post-tracción, D22/D29). Con esta estructura, agregarlos es trivial cuando existan
(nueva `.tsx` + entrada en el registro + subscriber). Sin trabajo muerto.
