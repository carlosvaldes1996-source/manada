# API — Endpoints, contratos, integraciones

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Contratos de API entre frontend y backend, e integraciones externas CL. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Contratos IMPLEMENTADOS y vivos: catálogo (§5), carrito+checkout (§6), cuentas+sesión (§7), buscador+envío (§8), mascotas (§9), medios de pago (§10), emails (§11), backoffice (§12), pago con **Flow** (§14, D58). suscripción (§13, D55/D56): creación al checkout + lectura + gestión (`PATCH`) IMPLEMENTADAS; scheduler + pago recurrente pendientes. |
> | **Last Updated** | 2026-07-24 |
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

### 6.2 Checkout → pago con Flow (`checkout.ts` + `flow.ts`) — secuencia (D58)
1. `POST /store/carts/:id` — `email` (invitado) + `shipping_address` + `billing_address`
   (Chile: `country_code: "cl"`, comuna→`city`, región→`province`). El RUT va en `metadata.rut`.
2. `GET /store/shipping-options?cart_id=:id` (`fulfillment.listCartOptions`) → opciones
   reales (Estándar $3.990 / Express $5.990) → `POST /store/carts/:id/shipping-methods`.
3. **Pago con Flow** (§14): `POST /store/carts/:id/flow-payment` → el backend crea la
   orden de pago en Flow y devuelve `{ url }`. El front guarda un snapshot de compra
   (analítica) y **redirige** al checkout de Flow (`window.location = url`).
4. **La orden Medusa NO se crea aquí.** Nace cuando **Flow confirma el pago** (webhook
   `urlConfirmation` + `payment/getStatus`, §14). El navegador vuelve por `urlReturn` a
   `/checkout/confirmacion?estado=<exito|rechazado|cancelado|pendiente|error>&orden=<display_id>`;
   en éxito el front mide `purchase` (snapshot) y vacía el carrito.

> **Por qué se difiere la orden hasta la confirmación de Flow (D58):** en Manada TODO
> el post-pago cuelga del evento nativo `order.placed` (§6.3), que se dispara al
> **completar el carrito**. Mover ese `complete` del click del usuario al webhook de
> Flow ya verificado garantiza que la orden y sus efectos (correos, suscripción,
> anticipación) solo ocurran con **pago confirmado**, sin tocar los subscribers.

### 6.3 Efectos al confirmarse el pago (evento nativo `order.placed`)
Se disparan cuando Flow confirma y el backend completa el carrito (§14), **una sola vez**
(idempotencia por `completeCartWorkflow` + registro `flow_payment`):
- **Inventario:** crear la orden **reserva** stock (baja el disponible); el `stocked`
  físico baja al marcar el **fulfillment manual** en el Admin.
- **Orden** queda `pending` con el pago **capturado** (best-effort: refleja "Pagado" en
  el Admin, ya que Flow cobró). Subscribers de `order.placed`: correo de compra (§11),
  reancla de anticipación (D35), creación de suscripción (§13, D55). Sin courier/SII/WhatsApp.

### 6.4 Estado
Pago **integrado con Flow (D58, §14)** — reemplaza el pago manual de D24 (proveedor interno
`pp_system_default` conservado solo como vehículo de Medusa para materializar la orden).
*La transferencia carrito→cliente al iniciar sesión ya está implementada — ver §7.3.*

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

## 8. Buscador + política de envío — IMPLEMENTADO (Fase 5 · Etapa B, D28 · buscador reescrito 2026-08-03)

### 8.1 Buscador — relevancia propia sobre el catálogo cacheado

> **Reemplaza al `q` nativo de Medusa** (implementación original de D28). El contrato
> con el backend no cambió: sigue siendo `GET /store/products` sin `q`. Lo que cambió
> es **dónde se decide la relevancia**.

**Dueño único: `apps/web/src/lib/search/`** (`normalize` · `lexicon` · `engine`).
Todo lo que busque productos entra por ahí: la página `/buscar`, el autocompletado del
header y el endpoint de sugerencias. `searchProducts()` fue eliminado de `lib/medusa`.

**Por qué el `q` nativo no daba el ancho** (verificado contra el código de
`@medusajs/utils` y el catálogo real):
1. Solo mira columnas de texto marcadas `searchable` (`title`, `subtitle`,
   `description`, título/SKU de variante). **La marca de Manada vive en
   `product.metadata` → es invisible para `q`**, y 32 de 153 productos (21 %) no
   llevan la marca en el título ("Pacific Stream Salmón Ahumado" es Taste of the Wild).
2. Exige **todos** los términos (AND de `ilike`): "acana cachorro" devolvía cero,
   porque el producto se llama "Acana Puppy".
3. `ilike` **no ignora tildes**: "salmon" no encontraba "Salmón".
4. Sin ranking: el orden lo ponía la base de datos.
5. `description` está vacía en todo el catálogo → la superficie buscable real era
   el título y poco más.

**Cómo funciona ahora.** El catálogo entero ya se lee en una sola llamada cacheada
(`getCachedCatalog`, Data Cache 300s, D68). Sobre esa lista, el motor:
- pliega texto (minúsculas, sin tildes ni apóstrofes) en un solo lugar, para índice y
  consulta por igual;
- indexa nombre, **marca**, formatos de variante y **conceptos** — los del léxico
  (nombre) más los estructurales que ya da el backend (`species`, `stage`, `category`);
- traduce cómo habla el cliente a cómo se llaman los productos con un **léxico de
  conceptos** ES↔EN con jerarquía (`cachorro`≡`puppy`≡`kitten`; `salmón`⊂`pescado`),
  de modo que buscar *pescado* alcanza al salmón pero *salmón* no arrastra a todo el mar;
- puntúa por **cobertura** (cuántos términos cubre) y literalidad, y **degrada** en vez
  de vaciar la pantalla: exacto → marca → concepto → parecidos → destacados;
- corrige tipeos contra el vocabulario real con Damerau-Levenshtein (transposición =
  1 error, "orijne" → "orijen"), y solo adopta la corrección si mejora el resultado.

Coste: ~0,05–0,13 ms por búsqueda con 153 productos y **cero** llamadas nuevas al backend.

**Sugerencias mientras se escribe:**
- **`GET /api/buscar?q=<texto>`** (route handler de `apps/web`, no del backend) →
  `{ total, terms: string[], products: [{ slug, name, brand, image, price }] }`.
  Mínimo 2 caracteres; respuesta < 2 KB con `Cache-Control: s-maxage=300`.
- Cliente: `SearchSuggest` (`components/commerce/search-suggest.tsx`) con debounce de
  140 ms, `AbortController` contra respuestas fuera de orden, caché por consulta en la
  sesión y patrón ARIA combobox/listbox. Lo usan el header y la página `/buscar`.

**Límite conocido:** la degradación es tan buena como los datos. Consultas de atributos
que el backend no expone (p. ej. "sin granos") no tienen con qué resolverse y caen a
destacados; se arreglan agregando metadata, no tocando el motor.

Sigue **sin índice externo** (Meilisearch/Algolia = escala, diferido). El motor se
reemplaza cuando el catálogo deje de caber en una lectura; el contrato (`searchCatalog`)
no cambia.

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

> **Nota (D58):** la pasarela real del checkout es **Flow** (§14), no Mercado Pago. Flow
> hospeda los medios de pago del comprador, así que "Mis tarjetas" (guardar/reusar tarjetas)
> sigue siendo una feature **futura**; este módulo persiste referencias de presentación y no
> participa del flujo de pago actual. La mención a Mercado Pago abajo es el análisis histórico
> que originó el esquema (se conserva; el esquema es agnóstico de la pasarela).

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

## 11. Contrato de emails transaccionales — EN VIVO en producción (D45 · D49)

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
- **Producción EN VIVO (D49):** dominio `tumanada.cl` **verificado** en Resend (SPF/DKIM vía DNS de
  Vercel; Vercel solo aporta DNS, el envío corre en el backend) + en Railway `RESEND_API_KEY`,
  `RESEND_FROM=Manada <contacto@tumanada.cl>` (el **nombre visible** va delante del buzón) y
  `STOREFRONT_URL=https://tumanada.cl` → envío real (bienvenida verificada E2E).

### 11.2 Emails ↔ eventos (los 4 críticos)
| Email | Evento nativo | Subscriber | Filtro / notas |
|---|---|---|---|
| Bienvenida | `customer.created` | `customer-created.ts` | solo si `has_account` (no a invitados de checkout); CTA → `/cuenta/mascotas`, que adapta en tiempo de clic (perfil con acciones vs. crear) — D49 |
| Recuperar contraseña | `auth.password_reset` | `password-reset.ts` | reemplaza el `console.log`; `data.url` = enlace de un solo uso |
| Compra realizada | `order.placed` | `order-placed-email.ts` | subscriber **separado** de `food-purchased.ts` (anticipación, D35) |
| Pedido enviado | `shipment.created` | `order-shipped.ts` | orden resuelta desde el fulfillment (link nativo); respeta `no_notification` |

### 11.3 Suscripción — EN VIVO (D57·R5): correos del ciclo de vida
Cinco correos cubren el ciclo del **Plan Manada**, disparados por **eventos de dominio propios**
(no nativos): la suscripción emite su evento y **un subscriber por correo lo escucha** — mismo
patrón que §11.2, **sin acoplar el correo al `PATCH`**. Esto deja el terreno listo para el
scheduler y el cobro recurrente de D55, que también consumirán estos eventos.

**Eventos de dominio (nuevos)** — payload uniforme `{ id }` (id de la suscripción), emitidos con el
**Event Bus** (`Modules.EVENT_BUS`):

| Evento | Emitido por | Cuándo |
|---|---|---|
| `subscription.created` | `subscription-created.ts` (tras crear la fila) | checkout con línea de suscripción |
| `subscription.paused` | `PATCH /store/subscriptions/:id` | `status` → `paused` |
| `subscription.resumed` | `PATCH …` | `status` → `active` (desde no-activo) |
| `subscription.cancelled` | `PATCH …` | `status` → `cancelled` |
| `subscription.skipped` | `PATCH …` | cambia `next_delivery_date` **sin** cambiar `status` |

El `PATCH` deriva el evento comparando el **estado previo** con el body; **cambiar solo la frecuencia
NO emite evento** (no genera correo de ruido).

**Correos ↔ eventos** — cada uno = **1 `.tsx` + 1 entrada en el registro + 1 subscriber** (patrón D45),
100% sobre `EmailLayout` y los componentes comunes:

| Email | Evento | Subscriber | Foco |
|---|---|---|---|
| Plan activo | `subscription.created` | `subscription-created-email.ts` | **explica cómo funciona el Plan Manada** (gestionar/pausar/cambiar frecuencia/cancelar) + resumen del plan; **NO repite la compra** (esa es `order.placed`, que no menciona la suscripción) |
| Plan pausado | `subscription.paused` | `subscription-paused-email.ts` | "no recibirás envíos hasta reanudar"; CTA **Reanudar** |
| Plan reanudado | `subscription.resumed` | `subscription-resumed-email.ts` | "sigue en marcha" (tono del momento in-sheet, R3) + próxima fecha estimada |
| Plan cancelado | `subscription.cancelled` | `subscription-cancelled-email.ts` | cálido, sin culpa; invita a volver |
| Envío saltado | `subscription.skipped` | `subscription-skipped-email.ts` | "movimos tu próximo envío al {fecha}" |

**Datos:** un helper único (`src/lib/subscription-email.ts`) resuelve por `{ id }` el `customer.email`/
`first_name` (Module Link `customer↔subscription`), el `product_title` (query, como el `GET`) y el
**nombre de la mascota** si el link opcional `pet↔subscription` resuelve. Formato con `formatCLP` /
`formatDate` del tema.

**Honestidad (invariante):** los correos **describen lo ocurrido** y muestran la próxima fecha como
**estimada**; **ninguno promete cobro ni despacho automático** (aún NO hay scheduler ni pago
recurrente — D55). El "Plan activo" lo dice explícito ("todavía no hacemos cobros automáticos: cada
compra la confirmas tú"). Modo DEV sin `RESEND_API_KEY` sigue **logueando** (no envía).

## 12. Contrato de Backoffice (`/admin/*`) — extensiones del Admin (D47 · D50)

> Owner técnico: `apps/backend/src/api/admin/` + `src/admin/`. Rutas `/admin/*` **autenticadas
> automáticamente** por Medusa (sesión del operador). No hay contrato de storefront: las consume
> el propio Admin (UI routes / widgets) vía `src/admin/lib/sdk.ts`.

### 12.1 `GET /admin/pets` — explorador de mascotas (D47)
Read-only; alimenta la sección "Mascotas" del Admin (`src/admin/routes/pets`). Resuelve cliente y
alimento por traversal del Module Link Customer↔Pet. Query: `limit`, `offset`, `q`, `species`, `stage`.

### 12.2 `POST /admin/products/:id/formats` — alta de formato en un paso (D50)
Encapsula el flujo de Medusa v2 (opción→valor→variante) para que crear un formato sea un solo
request. Owner: `src/api/admin/products/[id]/formats/` (lógica en `add-format.ts`, validación zod en
`validators.ts` registrada en `middlewares.ts`). Lo consume el widget `product-add-format` inyectado
en `product.details.after`.

- **Body:** `{ format: string, price_clp: number (>0), sku?: string, manage_inventory?: boolean }`.
- **Comportamiento:** asegura la opción **"Formato"** (la crea si falta), suma el valor si no existe,
  y crea la variante con `options: { Formato: format }` + precio CLP. Si el producto está con la
  **"Default variant"** sin opciones, la **reemplaza** por el formato real (borra la placeholder,
  crea la opción y la variante). Rechaza (`NOT_ALLOWED`) productos ya estructurados con múltiples
  variantes/opciones de otra forma → esos van al editor nativo. Duplicado de formato = `INVALID_DATA`.
- **Respuesta:** `201 { product_id, formats: [{ id, title }] }` (lista actualizada para refrescar el widget).
- **Convención:** opción **"Formato"** y variante `title` = el formato (ej. "14 kg"), espejo del `seed`.

---

## 13. Contrato de suscripción (`/store/subscriptions`) — módulo custom `subscription` (D55 · D56)

> Owner técnico: `apps/backend/src/modules/subscription/` + `src/api/store/subscriptions/` + los
> Module Links `customer↔subscription` y `pet↔subscription`. Modelo en `DATABASE.md §9`.
> **IMPLEMENTADO:** creación al checkout con pago **simulado/manual** (Punto 1, D55) + **lectura**
> (`GET`) + **gestión** (`PATCH`: frecuencia/pausar/reanudar/cancelar/saltar — D56·D). **PENDIENTE
> (frente D55):** el **scheduler** (motor de entregas recurrentes) y el **pago recurrente real** — por
> eso la gestión **configura** el plan pero aún no dispara entregas/cobros automáticos.

### 13.1 Decisión de arquitectura
- **La suscripción (la fila) nace SERVER-SIDE al checkout, no desde un formulario:** un
  **subscriber de `order.placed`** (`src/subscribers/subscription-created.ts`) lee las líneas de la
  orden con `metadata.is_subscription` y crea la fila con el **snapshot** (variante/producto/cantidad/
  precio pactado/dirección/`source_order_id`) y `next_delivery_date`. Convive con `food-purchased.ts`
  y `order-placed-email.ts` **sin tocarlos** (Medusa admite varios handlers por evento).
- **La intención + el precio suscrito viajan en la línea del carrito.** El storefront agrega la línea
  de suscripción por una **ruta propia** (§13.2), NO por `cart.createLineItem`: la Store API no deja
  fijar `unit_price` y una promoción estándar no puede leer la metadata de la línea ni variar el % por
  producto. La ruta computa el descuento server-side (fuente única: `product.metadata.
  subscription_discount_percentage`, igual que el middleware) y lo fija como **precio custom**
  (`is_custom_price` → el recálculo del carrito no lo pisa). Así el **precio suscrito se cobra desde la
  primera compra** y la línea lleva `metadata: { is_subscription, frequency_weeks }`, que Medusa propaga
  a `order.items[].metadata`. El `agreed_unit_price` de la suscripción = el `unit_price` de la línea.
- **Cero blast-radius:** la **compra única** sigue usando la ruta core `cart.createLineItem` intacta.
- **Pago = manual (D24) en el Punto 1.** No se tokeniza ni se cobra: `payment_method_id` queda
  `null`. El cobro recurrente real es el **Bloque 4** (go estratégico aparte, D55).

### 13.2 Endpoints
- **`POST /store/carts/:id/subscription-items`** → agrega una línea de suscripción con el precio
  suscrito. Body: `{ variant_id, quantity, frequency_weeks: 2|4|6|8 }`. Sin auth de cliente (carritos
  de invitado permitidos, como la ruta core de line-items); publishable key global. Owner:
  `src/api/store/carts/[id]/subscription-items/` (validación zod en `middlewares.ts`).
- **`GET /store/subscriptions`** → `{ subscriptions: StoreSubscription[] }` (orden `created_at` desc,
  enriquecido con `product_title` + `thumbnail`). Auth y alcance **idénticos a §9.1 / §10.2**
  (`authenticate("customer", …)` + publishable key; propiedad por `customer_id`; ajena → **404**).
  Alimenta la vista read-only de `/cuenta` (Punto 1 · Bloque 1.4); la propiedad se resuelve traversando
  el Module Link (`customer.subscriptions`), como `/store/pets`.
- **`PATCH /store/subscriptions/:id`** (gestión del plan, D56·D) → actualiza la suscripción del
  cliente. Auth/propiedad **idénticas al GET** (ajena → **404**). Body **parcial**:
  `{ frequency_weeks?: 2|4|6|8, status?: "active"|"paused"|"cancelled", next_delivery_date?: ISO }`.
  Un solo endpoint flexible cubre las acciones de la `PlanManageSheet`: **cambiar frecuencia**
  (`frequency_weeks`; NO mueve la próxima fecha —criterio Chewy—), **pausar / reanudar / cancelar**
  (`status`; al reanudar, el front manda además una próxima fecha fresca) y **saltar** el próximo envío
  (`next_delivery_date` = actual + frecuencia, computado en el front). Devuelve `{ subscription }`.
  Owner: `src/api/store/subscriptions/[id]/` (validación zod en `middlewares.ts`).
- **Honestidad (D56·D):** **aún NO existe el scheduler** que genere entregas/cobros a partir de estas
  fechas (es un bloque posterior de D55). La gestión **configura** el plan; su ejecución automática
  llega con el motor de entregas. Por eso se **excluyen** a propósito: **"adelantar/entregar ahora"**
  (necesita el scheduler) y **cambiar formato/cantidad/dirección** (fast-follow).
- **Emite eventos de dominio (D57·R5):** tras actualizar, el `PATCH` emite
  `subscription.paused` / `.resumed` / `.cancelled` / `.skipped` según la transición (compara el estado
  previo con el body; **cambiar solo la frecuencia no emite**) y la creación emite `subscription.created`
  desde `subscription-created.ts` — los consumen los subscribers de correo del ciclo de vida (§11.3).

### 13.3 `StoreSubscription` (shape del backend)
`{ id, product_id, variant_id, quantity, frequency_weeks, next_delivery_date, status:
"active"|"paused"|"cancelled", agreed_unit_price, currency_code, payment_method_id: string|null,
source_order_id: string|null, created_at, updated_at }`.
Mapper del front (futuro, Bloque 1.4): `StoreSubscription → SubscriptionView` (frecuencia legible
"Cada N semanas", `next_delivery_date` formateada, precio con `formatCLP`).

---

## 14. Contrato de pago con Flow — IMPLEMENTADO (D58)

Pasarela de pago real del checkout (**reemplaza el pago manual de D24**). Doc oficial de
Flow: `https://developers.flow.cl/api`. Módulo custom `flow-payment` (espejo de `pet`/
`subscription`) + `src/lib/flow.ts` (cliente HTTP) + `src/lib/flow-settle.ts` (conciliación).
**Owner del código:** `apps/backend/src/modules/flow-payment/`, `src/lib/flow*.ts`,
`src/api/store/carts/[id]/flow-payment/`, `src/api/flow/`. Front: `apps/web/src/lib/medusa/flow.ts`.

### 14.1 Principio (por qué se difiere la orden)
Todo el post-pago de Manada cuelga del evento nativo `order.placed` (correos §11, suscripción
§13, anticipación D35), que se dispara al **completar el carrito**. En vez de completar en el
click (pago manual, D24), el carrito se completa **solo cuando Flow confirma el pago**. Así la
orden y sus efectos nacen con pago verificado, **sin tocar ningún subscriber existente**. La
confirmación **nunca** se asume por el retorno del navegador: se re-consulta a Flow con
`payment/getStatus`.

### 14.2 Firma (HMAC-SHA256)
Todos los parámetros (excepto `s`) se ordenan **alfabéticamente por nombre**, se concatenan
como `nombreValor` **sin separadores** y se firman con **HMAC-SHA256** usando `FLOW_SECRET_KEY`.
El hash hex viaja como parámetro `s`. Implementado en `signParams` (`src/lib/flow.ts`).

### 14.3 Endpoints propios
- **`POST /store/carts/:id/flow-payment`** (pub key, guest OK) → `{ url }`. Asegura payment
  collection + sesión del proveedor interno `pp_system_default`, crea el pago en Flow
  (`payment/create`, `paymentMethod: 9` = todos los medios) por el **total del carrito**
  (server-side, autoritativo), persiste `flow_payment` (`pending`) y devuelve la URL del
  checkout de Flow. **Reusa** un intento `pending` del mismo carrito/monto (no duplica cobros).
- **`POST /flow/confirmation`** (público, fuera de `/store`) — webhook `urlConfirmation` de Flow.
  Recibe `token` (form-encoded) → `settleFlowPayment` → 200. Devuelve **500 solo** si el pago
  está confirmado pero la orden no se pudo crear (para que Flow **reintente**).
- **`POST|GET /flow/return`** (público) — `urlReturn` del navegador. Verifica con `settleFlowPayment`
  y **redirige** a `${STOREFRONT_URL}/checkout/confirmacion?estado=…&orden=…`.

### 14.4 Llamadas a Flow (REST)
- **`POST payment/create`** (`${FLOW_API_URL}/payment/create`, form-encoded): `apiKey`,
  `commerceOrder` (único), `subject`, `amount` (CLP entero), `email`, `currency: CLP`,
  `paymentMethod: 9`, `urlConfirmation`, `urlReturn`, `optional` (JSON `{rut}`), `s`.
  Respuesta `{ token, url, flowOrder }` → redirect = `url?token=token`.
- **`GET payment/getStatus`** (`?apiKey&token&s`): fuente de verdad. `status` → **1** pendiente ·
  **2** pagada · **3** rechazada · **4** anulada.

### 14.4b Cobro de suscripción — "no pude" ≠ "no pagó" (D73)

Validado E2E contra Sandbox. Tres reglas que gobiernan todo cobro con `customer/charge`:

**(1) `commerceOrder` ESTABLE por período**, sin sufijo por intento.
> ⚠️ **Flow NO deduplica `customer/charge` por `commerceOrder`** — medido: dos cargos
> aceptados con el mismo id y `flowOrder` distintos. Es trazabilidad, **no un candado**.
> La única protección contra el doble cobro es la nuestra: **lock + ledger + verificación**.

La referencia estable es lo que permite preguntar *"¿este período ya se cobró?"* y que la
respuesta cubra **todos** los intentos.

**(2) `lookupFlowStatusByCommerceId` devuelve un resultado discriminado de TRES variantes** —
`{ outcome: "found", status } | { outcome: "not_found", message } | { outcome: "unavailable", message }`.
Nunca `null` ambiguo.

| Desenlace | Cuándo | Qué significa para quien pregunta |
|---|---|---|
| `found` | Flow devolvió un estado | Único caso sobre el que se decide si está pagado |
| `not_found` | **400** con `"Transaction not found"` | **Veredicto:** Flow no tiene esa transacción ⇒ no la cobró. Se puede cobrar |
| `unavailable` | Red, timeout, 5xx, 429, respuesta sin `status` | **No sabemos.** Se aplaza; jamás se cobra sobre esto |

> ⚠️ **Corrige lo que decía esta sección hasta el 2026-08-05** ("no se distingue «no existe»
> de «error», a propósito, porque el spec no lo documenta"). El spec sigue sin documentarlo,
> pero **está medido**: Flow responde `400 "Transaction not found"`. Unificarlos tenía un
> costo real — un cargo que moría antes de llegar a Flow dejaba el ledger `pending` con una
> referencia que Flow nunca registró, y desde ahí **la suscripción se aplazaba para siempre**,
> activa e invisible en el Admin (defecto #10 de D73).
>
> **Deuda declarada:** la clasificación compara hoy el **texto** del error, no el `code` de
> Flow, porque ese número aún no se conoce. Es **transitorio**; falla hacia el lado seguro (si
> el texto cambia, vuelve a `unavailable`).

El ledger sigue siendo la otra mitad: solo se pregunta si consta un intento previo; sin
intento previo no hay nada que preguntar.

**(3) `chargeFlowCustomer` clasifica el fallo** con `failureKind`:

| `failureKind` | Cuándo | Qué hace el motor |
|---|---|---|
| `rejected` | Flow dio veredicto: estado **3** (rechazada) o **4** (anulada) | **Dunning**: `past_due`, `failed_charge_count++`, correo al cliente, baja a los 3 intentos |
| `unavailable` | Cualquier error HTTP (red, timeout, 429, 5xx, **400**, 401) o estado 1/ausente | **`deferred`**: no toca contadores, no cambia estado, **no manda correo**. Sigue `active` y vencida → el próximo barrido la retoma |

Motivo medido: al agotarse la cuota diaria de Sandbox, Flow respondió `400 "has exceeded the
daily transaction quota"` y una suscripción sana acabó en `past_due` con su correo de cobro
fallido. Un problema de Flow o nuestro **nunca** debe castigar al cliente.

En el alta (`/flow/register-return`) el equivalente es **`unverified`** → la confirmación
muestra **"pendiente"**, jamás "rechazado": decirle al comprador que falló lo invitaría a
reintentar un pago que quizá ya se hizo.

> ⚠️ **`deferred` es invisible en el listado del Admin** (la suscripción se ve normal). El
> motivo queda en `last_charge_error` y en los logs — es la única señal de que algo lleva
> días sin poder cobrarse.

### 14.5 Idempotencia (sin duplicados)
Dos capas: (1) el registro `flow_payment` como mutex — si ya está `paid`, no-op; (2)
`completeCartWorkflow` es idempotente y **toma un lock** sobre el `cart_id` (consulta el link
`order_cart`: si la orden ya existe la devuelve **sin re-emitir** `order.placed`). Aunque Flow
reintente el callback o `urlReturn`/`urlConfirmation` lleguen a la vez, la orden y sus efectos
ocurren **exactamente una vez**.

**Tercera capa, añadida en D73: lock por carrito en la conciliación.** Las dos anteriores
protegían la ORDEN, no el COBRO. Medido en Sandbox: dos callbacks simultáneos sobre un carrito
sin conciliar ejecutaron **ambos** `customer/charge` — una sola orden, **dos cargos**. Ahora
`settleSubscriptionRegistration` corre dentro de `locking.execute("subscription-registration:<cartId>")`,
espejo de `chargeSubscriptionLocked` en el cobro recurrente.

**Cuarta capa: conciliación de monto.** Si lo que Flow reporta haber cobrado no coincide con el
total del carrito, se registra un `¡ATENCIÓN!` con ambas cifras. No bloquea la orden (el cliente
ya pagó), pero deja rastro: el descuadre de D73 —cobrar $3.990 de un carrito de $29.500— vivió
sin detectarse porque **nadie comparaba lo cobrado contra lo facturado**.

> ⚠️ **Al leer el monto del carrito**: Medusa calcula `cart.total` sobre las relaciones
> **cargadas**. Pedir solo `items.id` deja el subtotal en 0 y el total colapsa al envío. Hay que
> cargar `items.*`, sus `adjustments`/`tax_lines` y `shipping_methods.*`. Este bug apareció dos
> veces —en el pago único (D58) y otra vez en la ruta de suscripción (D59), que no heredó la
> corrección—, así que **cualquier ruta nueva que lea un total debe copiar ese juego de campos**.

### 14.6 Configuración (env, nunca hardcodeada)
`FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_API_URL` (`https://sandbox.flow.cl/api` ↔
`https://www.flow.cl/api`). Las URLs de callback las arma el backend con `MEDUSA_BACKEND_URL`
(confirmation/return) y `STOREFRONT_URL` (redirect final). El frontend **no** recibe secretos.
En dev, Flow no alcanza `localhost` → usar una URL pública (ngrok) en `MEDUSA_BACKEND_URL`.

### 14.7 `flow_payment` (shape del backend)
`{ id, cart_id, commerce_order, token, flow_order, redirect_url, amount, currency_code,
status: "pending"|"paid"|"rejected"|"canceled", raw_status: number|null, order_id: string|null,
payment_collection_id: string|null, error: string|null, created_at, updated_at }`.

---

## 15. Contrato de clientes de Flow (Customers) — módulo custom `flow-customer` (D70)

Etapa 1 de la integración de suscripción con Flow. Un **Customer de Flow** es la *bóveda* de
la tarjeta de un cliente: Flow lo identifica con un hash `cus_…` y guarda contra él, como
máximo, **una** tarjeta. Es el prerequisito común a los dos modelos de cobro posibles
(`customer/charge` server-to-server, y `plans`/`subscription` nativos de Flow), por eso se
construye primero y por separado del cobro.

**Owner del código:** `apps/backend/src/modules/flow-customer/` (persistencia) ·
`src/lib/flow/customers.ts` (API de Flow) · `src/lib/flow-customer.ts` (orquestación) ·
`src/subscribers/flow-customer-sync.ts`. Fuente: spec oficial `developers.flow.cl/es-openApiFlow.yaml`.

### 15.1 El objeto Customer (según el spec oficial)
| Campo | Tipo | Significado |
|---|---|---|
| `customerId` | string | Hash de Flow (`cus_onoolldvec`). La referencia cobrable. |
| `externalId` | string | **Nuestro** id (`customer.id` de Medusa). Requerido al crear. |
| `name` · `email` | string | Datos del cliente en Flow (el `email` recibe los comprobantes). |
| `pay_mode` | string | **`auto`** = tiene tarjeta, se le puede cobrar · **`manual`** = sin tarjeta utilizable (Flow cobraría por email). |
| `status` | string | **`'1'`** activo · **`'0'`** eliminado. Es *string*, no número. |
| `creditCardType` · `last4CardDigits` | string | Presentación de **la** tarjeta registrada (singular). |
| `created` · `registerDate` | `yyyy-mm-dd hh:mm:ss` | Alta del cliente · registro de su tarjeta. |

> ⚠️ **Flow NO devuelve fecha de vencimiento** de la tarjeta en ningún servicio (ni el objeto
> Customer ni `RegisterResult`). Cualquier `exp_month`/`exp_year` local es un dato inventado.

### 15.2 Restricción estructural — no se puede buscar por `externalId`
`customer/get` exige el `customerId`; `customer/list` **solo filtra por nombre** y estado. No
existe lookup por `externalId` ni por email, y el spec **no declara** que `externalId` sea único.
**Consecuencia de diseño:** la idempotencia "un cliente de Flow por cliente de Manada" *no puede*
delegarse en Flow — se garantiza en nuestra BD con el **UNIQUE** sobre `flow_customer.customer_id`.
Si se pierde el vínculo local, el `cus_…` **no es recuperable por API** (solo desde el panel).

### 15.3 Llamadas a Flow (REST) — servicio `customer`
Todas firmadas igual que §14.2. Reintentos **solo** donde repetir es inocuo:

| Endpoint | Método | Reintento | Nota |
|---|---|---|---|
| `customer/create` | POST | **No** | Repetir crearía un `cus_…` huérfano. |
| `customer/edit` | POST | Sí | Converge al mismo estado. |
| `customer/get` | GET | Sí | Lectura. |
| `customer/list` | GET | Sí | Paginado (`limit` máx 100). |
| `customer/delete` | POST | No | Exige sin suscripciones activas ni importes pendientes. |
| `customer/register` | POST | No | Abre una transacción de registro nueva. |
| `customer/getRegisterStatus` | GET | Sí | Fuente de verdad del registro. |
| `customer/unRegister` | POST | No | Deja `pay_mode` en `manual`. |
| `customer/charge` | POST | **Nunca** | Repetir puede **cobrar dos veces**; un timeout se resuelve *consultando*. |

`customer/register` responde `{url, token}` → redirigir a `url?token=token`; Flow devuelve el
navegador por **POST** a `url_return` con `token`. `getRegisterStatus` responde
`{status, customerId, creditCardType, last4CardDigits, cardNumber, issuerBank}` —
`cardNumber` es BIN + últimos 4 enmascarados; `cardNumber`/`issuerBank` pueden venir `null`.

⚠️ Nombres que se prestan a confusión: en `payment/create` el extra es `optional` (singular);
en `customer/charge` es `optionals` (plural).

### 15.4 Cuándo se crea el cliente en Flow
**Perezosamente, al primer intento de suscripción** — no al registrar la cuenta. Crear un
cliente en Flow por cada cuenta nueva metería en la pasarela a la mayoría, que nunca se
suscribe, y ataría el alta de Manada a la disponibilidad de Flow. Lo que **sí** cambió (D70):
el vínculo se persiste **al crear el cliente**, antes de redirigir a la tokenización — no
después de que el usuario complete la tarjeta.

### 15.5 Idempotencia
1. **UNIQUE `flow_customer.customer_id`** (índice parcial `WHERE deleted_at IS NULL`) — la
   garantía dura. Verificado: un segundo insert para el mismo cliente es rechazado por la BD.
2. `ensureFlowCustomer` lee el vínculo antes de tocar la red; si existe, no llama a Flow.
3. **Carrera:** dos peticiones simultáneas pueden crear dos `cus_…` en Flow (inevitable, no hay
   create-if-not-exists), pero solo una gana el UNIQUE. La perdedora **descarta el suyo y reusa
   el ganador**, así que nunca se cobra contra el huérfano; el huérfano se loguea con su id.
4. **Auto-sanación:** si Flow reporta `status='0'`, se crea uno nuevo y se repunta el vínculo.

### 15.6 `flow_customer` (shape del backend)
`{ id, customer_id (UNIQUE), flow_customer_id (UNIQUE), status: "0"|"1",
pay_mode: "auto"|"manual"|null, register_date: Date|null, last_synced_at: Date|null,
created_at, updated_at, deleted_at }`.

**Qué NO se guarda aquí:** marca y últimos 4 de la tarjeta — ese hecho es de `saved_card`
(§10) y no se duplica. Tampoco nombre/correo: su dueño es el `customer` de Medusa.
**Nunca** PAN ni CVV: la tarjeta jamás toca nuestros servidores.

### 15.7 Sincronización
- `customer.updated` (evento nativo) → `syncFlowCustomerProfile` → `customer/edit`.
  **Best-effort**: no-op si el cliente no tiene vínculo (la mayoría), y un fallo de Flow
  **nunca** rompe la edición de perfil — se loguea y el próximo cambio reintenta.
- `syncFlowCustomer(customerId)` re-lee con `customer/get` y refresca el espejo local cuando
  hace falta la verdad más reciente.
- `canChargeFlowCustomer(customerId)` responde "¿puedo cobrarle?" con el estado local
  (`status='1'` + `pay_mode='auto'`), sin ir a la red.

### 15.8 Verificación
`npx medusa exec ./src/scripts/verify-flow-customer.ts` — 11 comprobaciones sin red: firma HMAC
contra el ejemplo trabajado de la doc, UNIQUE efectivo, y el orquestador (lectura, registro de
tarjeta, `status='0'`/`pay_mode='manual'` ⇒ no cobrable). El E2E real con Flow exige llaves +
ngrok (`apps/backend/DEV.md`).

---

## 16. Contrato de suscripciones nativas de Flow — módulo `flow-subscription` (D71) · 💤 DORMIDO

Etapa 2. Capa de integración con el modelo de suscripción **nativo** de Flow (`plans/*`,
`subscription/*`, `subscription_item/*`). Terminada y testeada (22/22).

> 💤 **NO ESTÁ EN USO (D72).** Carlos decidió que **Medusa mantiene la propiedad de la cadencia**
> (Modelo A: Flow = bóveda de tarjeta + `customer/charge`), porque Flow **no modela pausar ni
> saltar** y Manada ya los tiene desplegados (D56/D57). Esta capa se conserva como **camino de
> migración** si algún día conviene ceder la cadencia a Flow, y porque fue lo que permitió decidir
> con evidencia. **Nada la llama hoy** — no la leas como código vivo. El cobro recurrente real se
> documenta en §14 (Flow) y D59.

**Fuente de verdad:** `ai-context/assets/flow-openapi-3.0.1.yaml` (spec oficial versionado en el
repo; sha256 `2ea10638…`). **Owner del código:** `src/lib/flow/{plans,subscriptions}.ts` (API) ·
`src/modules/flow-subscription/` (persistencia) · `src/lib/flow-{plan,subscription}.ts` (orquestación).

### 16.1 El modelo de Flow, con evidencia
| Pregunta | Respuesta | Endpoint / schema |
|---|---|---|
| ¿Qué es una Subscription? | La unión de un **cliente** y un **plan**, más su reloj (`period_start`/`period_end`/`next_invoice_date`). | schema `Subscription` |
| ¿Qué requiere para crearse? | Solo `apiKey`, **`planId`**, **`customerId`**, `s`. Opcionales: `subscription_start`, `couponId`, `trial_period_days`, `periods_number`, `planAdditionalList`. | `subscription/create` |
| ¿Existe el concepto de Plan? | Sí, y es una entidad **previa e independiente**. | `plans/create` |
| ¿Cómo se referencia? | Por `planId`, **string elegido por el comercio** ("sin espacios, ejemplo: PlanMensual"). | `plans/create` |
| ¿Quién es dueño del precio? | **El Plan** (`amount` + `currency`). La suscripción no lleva precio. | schema `Plan` |
| ¿Quién es dueño de la frecuencia? | **El Plan** (`interval` 1 diario/2 semanal/3 mensual/4 anual × `interval_count`). | schema `Plan` |
| ¿Cómo se representan los productos? | **No se representan.** No hay producto, SKU ni cantidad en ningún schema. Lo más cercano son los `subscription_item` (monto plano con nombre). | schemas `Plan`, `ItemAdditional` |
| ¿Se puede modificar una suscripción viva? | Parcialmente: trial, cupones, items y **cambio de plan**. El precio/cadencia **no** se editan en el plan. | `plans/edit`, `subscription/*` |
| ¿Cómo se cancela? | `at_period_end`: **0** inmediata · **1** al terminar el período vigente. | `subscription/cancel` |

**La restricción que manda sobre todo el diseño** — textual de `plans/edit`:
> "Si el plan tiene clientes suscritos sólo se puede modificar el campo **trial_period_days**."

Es decir: **el precio de un plan con suscriptores es inmutable**. Cambiar el precio de una
suscripción viva NO es editar el plan, sino crear otro y mover la suscripción con `changePlan`.

### 16.2 `changePlan`, `changePlanPreview`, `changePlanCancel`
- **`changePlan`** (`subscriptionId`, `newPlanId`, `startDateOfNewPlan?`) mueve la suscripción a
  otro plan. Flow prorratea y devuelve `balance` (negativo = a favor · positivo = cargo). La
  fecha debe caer dentro del ciclo de facturación actual y puede ser futura → cambio **programado**.
- **`changePlanPreview`** calcula lo mismo **sin aplicarlo** (incluye `credit_expiration_*` y
  advertencias si el saldo a favor no alcanzará a consumirse). Es lo que permite mostrarle al
  cliente qué le van a cobrar antes de confirmar.
- **`changePlanCancel`** anula un cambio **programado** pendiente.

### 16.3 `addItem` / `deleteItem`
Asocian y desasocian un `subscription_item` (entidad aparte, `subscription_item/create`:
`name` + `amount` + `currency`). `amount` **positivo = recargo, negativo = descuento**. Son
**ajustes monetarios planos**, no productos: no tienen cantidad ni SKU. `changeType` (`to_future`
\| `all`) es obligatorio al editar/eliminar y define si el cambio alcanza a las suscripciones vivas.

### 16.4 Estados
`Subscription.status`: **0** no iniciada · **1** activa · **2** en trial · **4** cancelada.
`morose`: **0** al día · **1** vencido · **2** pendiente no vencido.
`Plan.status`: **1** activo · **0** eliminado (eliminar impide nuevas suscripciones, pero
"las suscripciones activas continuarán su ciclo de vida").

> ⚠️ **Flow no tiene "pausada" ni "saltar un período".** Se verificó por ausencia en el spec:
> no existen esos estados ni esas operaciones. Manada sí los ofrece hoy (D56/D57) — es la
> brecha funcional principal si se adopta el modelo nativo.

### 16.5 Mapeo Manada → Flow
| Manada | Flow | Mapeo |
|---|---|---|
| `customer` | `Customer` (`cus_…`) | **Directo** (1:1, resuelto en D70). |
| `subscription` | `Subscription` (`sus_…`) | **Directo** en identidad; **con brecha** en estados (`paused`/`skipped` no existen). |
| `product` / `variant` | — | **Sin equivalente.** Flow no modela productos: la identidad de qué se despacha se queda en Manada. |
| `frequency_weeks` | `interval=2` + `interval_count=N` | **Directo y sin pérdida** (Flow tiene intervalo semanal). Se usa semanal incluso para múltiplos de 4: "cada 4 semanas" son 13 cobros/año, "mensual" 12. |
| `agreed_unit_price` | `Plan.amount` | **Requiere transformación**: el precio deja de vivir en la suscripción y pasa a una entidad previa compartida. |
| — | `Plan` | **Entidad nueva sin contraparte** en Manada. |

### 16.6 Arquitectura — planes por ECONOMÍA, no por producto
Como el Plan solo codifica (monto, moneda, cadencia), **no se crea un plan por variante** sino
**uno por punto de precio × cadencia**, compartido entre productos y clientes. Modelarlo por
variante exigiría cientos de planes (~172 variantes × 4 frecuencias); por economía, el número
crece con los precios realmente suscritos y se reutiliza.

El `planId` se deriva determinísticamente del contenido: `MANADA-CLP-29990-W4`
(= $29.990 cada 4 semanas). Como el id lo elige el comercio, **la idempotencia sale gratis**:
el mismo precio+cadencia produce siempre el mismo id y no puede duplicarse, ni en una carrera.
`ensureFlowPlan` resuelve local → `plans/get` → `plans/create` (adoptar un plan preexistente es
un desenlace esperado, no un error).

### 16.7 Persistencia
`flow_plan`: `{ id, plan_id (UNIQUE), amount, currency_code, interval, interval_count, status, last_synced_at }`.
`flow_subscription`: `{ id, flow_subscription_id (UNIQUE), flow_plan_id, flow_customer_id,
subscription_id (UNIQUE, nullable), status, morose, cancel_at_period_end, period_start,
period_end, next_invoice_date, last_synced_at }`.

`subscription_id` nullable **a propósito**: la capa está terminada pero sin conectar, así que
enlazar después es un `update`, no una migración. El UNIQUE sobre columna nullable permite N
suscripciones sin enlazar (Postgres admite múltiples NULL) y a lo sumo una por cada suscripción
de Manada — evita el doble cobro. Los campos de reloj son **espejo**: manda Flow.

### 16.8 Verificación
`npx medusa exec ./src/scripts/verify-flow-subscription.ts` — **22 comprobaciones** sin red:
determinismo del `planId`, mapeo de cadencia, validaciones, los tres UNIQUE (incluida la
convivencia de NULLs), la **carrera real** sobre un mismo plan y el enlace tardío con Manada.

### 16.9 Reutilización de un Plan por N suscriptores — evidencia
**Confirmado.** El Plan es un molde compartido, no una instancia por cliente:
- Guía oficial (`/docs/suscripciones/create-plan`): *"el comercio debe crear uno o varios planes
  que desee **poner a disposición de sus clientes**"* — plural, y el plan precede a los clientes.
- Guía oficial (`/docs/suscripciones/integration-flow`): *"Finalmente, **el cliente se asocia a un
  plan**"*.
- `subscription/list` **pagina las suscripciones DE UN plan** (`start`, `limit` máx 100): un
  modelo 1:1 no necesitaría paginación.
- `plans/edit`: *"Si el plan tiene clientes **suscritos**…"* · `plans/delete`: *"las
  **suscripciones activas** continuarán su ciclo de vida"* — ambos en plural.
- `trial_period_days` y `periods_number` se pueden **sobrescribir por suscripción** en
  `subscription/create` ("Si null, entonces tomará el `periods_number` del plan") — la marca
  inconfundible de un molde con overrides.
- El schema `Plan` no tiene ningún campo de cupo, tope ni contador de suscriptores.

> ⚠️ **Lo que NO se puede afirmar.** "No existe ninguna limitación relevante" **no es
> demostrable desde un spec**: solo consta que **ninguna está documentada**. El OpenAPI no
> declara cuotas de planes por comercio, tope de suscriptores ni límites de tasa (`rate limit`).
> Ausencia de documentación ≠ ausencia de límite. **Pendiente de confirmar con Flow** antes de
> operar a volumen.

### 16.10 Ciclo de vida de un Plan
| Etapa | Qué ocurre | Evidencia |
|---|---|---|
| **Creación** | `plans/create` (o el portal de Flow). El `planId` lo elige el comercio. | `plans/create` · guía `create-plan` |
| **Reutilización** | N suscripciones apuntan al mismo `planId`. Por suscripción se pueden variar **solo** `trial_period_days` y `periods_number`. | `subscription/create` |
| **Cambio de precio** | **Imposible con suscriptores**: *"sólo se puede modificar `trial_period_days`"*. Se crea un plan nuevo y se mueve la suscripción. | `plans/edit` |
| **Eliminación** | `status → 0`. *"ya no podrá suscribir nuevos clientes… las suscripciones activas continuarán su ciclo de vida"*. No es destructivo. | `plans/delete` |
| **Sin suscriptores** | **NO DOCUMENTADO.** El spec y la guía no describen borrado automático ni caducidad. Se asume que persiste con `status = 1`. | — (ausencia) |

**Consecuencia operativa del compartir:** `days_until_due` y `charges_retries_number` son
**del plan** y **no** admiten override por suscripción. Mientras Manada use la misma política de
mora para todos, compartir es correcto; el día que se quiera una política distinta por cliente,
el plan deja de poder compartirse y habría que particionarlo también por esos campos.

**Política de Manada:** los planes **no se borran**. Como se reutilizan por (precio × cadencia) y
`plans/delete` solo bloquea altas nuevas, borrar no aporta y sí puede romper una reutilización
futura. Se acumulan; el crecimiento es el histórico de puntos de precio, no el catálogo.

### 16.11 Algoritmo de creación de una suscripción
```
ensureFlowCustomer(customer)                  → cus_…            (D70)
        ↓
planId = MANADA-{CUR}-{AMOUNT}-{W}{N}         (determinista, sin red)
        ↓
¿flow_plan local con ese planId y status≠0?
   sí → reutilizar ─────────────────────────────────────┐
   no ↓                                                 │
¿plans/get(planId) existe y está activo?                │
   sí → adoptar + anotar en flow_plan ──────────────────┤
   no ↓                                                 │
plans/create(planId, amount, interval, count)           │
   ├─ éxito       → anotar en flow_plan ────────────────┤
   └─ falla       → REPREGUNTAR plans/get               │
         ├─ ahora existe → adoptar (carrera benigna) ───┤
         └─ no existe    → propagar el error real       │
        ↓                                               │
subscription/create(planId, customerId)  ←──────────────┘
        ↓
anotar en flow_subscription (UNIQUE subscription_id)
```

**Idempotencia en tres capas, y una asimetría importante:**
1. **El `planId` es determinista.** Dos procesos concurrentes no pueden crear *planes distintos*:
   calculan el mismo id, que codifica el mismo precio y cadencia. La carrera es **benigna** —a
   diferencia de la de clientes (D70), que sí deja un `cus_…` huérfano, y la de suscripciones,
   que dejaría una cobrando.
2. **`plans/create` que falla se REPREGUNTA, no se interpreta.** El spec no documenta qué error
   devuelve Flow ante un `planId` duplicado, así que no se adivina por código: se vuelve a
   consultar `plans/get` y, si el plan ya está ahí, se adopta. Si no está, el fallo era real y se
   propaga.
3. **UNIQUE en la BD** sobre `flow_plan.plan_id` — la red de seguridad final.

**Probado, no afirmado:** 8 registros simultáneos del mismo plan dejan **exactamente 1 fila**
(1 éxito, 7 rechazos del UNIQUE) — `verify-flow-subscription.ts`.

### 16.12 Traducción de frecuencias
Flow tiene intervalo **semanal** (`interval = 2`) y un multiplicador `interval_count`, así que el
mapeo es directo y exacto:

| Manada (`frequency_weeks`) | `interval` | `interval_count` | `planId` (ej. $29.990) |
|---|---|---|---|
| 2 semanas | 2 (semanal) | 2 | `MANADA-CLP-29990-W2` |
| 4 semanas | 2 (semanal) | 4 | `MANADA-CLP-29990-W4` |
| 6 semanas | 2 (semanal) | 6 | `MANADA-CLP-29990-W6` |
| 8 semanas | 2 (semanal) | 8 | `MANADA-CLP-29990-W8` |

**Por qué semanal y no mensual para 4 semanas:** no son lo mismo. *Cada 4 semanas* = **13 cobros
al año**; *mensual* (`interval = 3`) = **12**. La cadencia de Manada la fija el consumo del saco,
que se mide en semanas (D64), así que usar el intervalo mensual introduciría una deriva real
contra la fecha en que la mascota se queda sin comida.

### 16.13 Cambio de frecuencia y cambio de precio
Ambos son el **mismo caso**: cambia la tarifa ⇒ cambia el `planId` ⇒ hay que **mover** la
suscripción. Nunca se edita el plan (`plans/edit` no lo permite con suscriptores).

```
nueva tarifa (precio y/o frecuencia)
        ↓
ensureFlowPlan(nuevo spec)                        → nuevo planId  (§16.11)
        ↓
[opcional] subscription/changePlanPreview         → mostrar el prorrateo al cliente
        ↓
subscription/changePlan(subscriptionId, newPlanId[, startDateOfNewPlan])
        ↓
subscription/get → refrescar el espejo local
```

- **`changePlan`** devuelve `balance`: **negativo = saldo a favor**, **positivo = cargo** al
  cambiar. Flow prorratea; Manada no calcula nada.
- **`changePlanPreview`** entrega lo mismo **sin aplicar**, más `credit_expiration_*` y una
  advertencia si el saldo a favor no alcanzará a consumirse. Es lo que permite mostrar "esto es
  lo que te vamos a cobrar" antes de confirmar.
- **`startDateOfNewPlan`** (opcional, `yyyy-mm-dd`) debe caer **dentro del ciclo de facturación
  vigente** y puede ser futura → el cambio queda **programado** (`newPlanId` /
  `new_plan_scheduled_change_date` en la suscripción). **`changePlanCancel`** lo anula.
- **El plan viejo NO se toca**: probablemente lo sigan usando otras suscripciones.

> ⚠️ **Dos puntos a confirmar en sandbox antes de conectar** (el spec no los resuelve):
> 1. `changePlan` entre planes de **distinta cadencia** (4 → 2 semanas) no está prohibido en el
>    spec, pero tampoco descrito: hay que verificar cómo reprograma `next_invoice_date`.
> 2. Omitir `startDateOfNewPlan` debería significar "inmediato", pero **no está documentado**.
