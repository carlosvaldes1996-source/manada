# API — Endpoints, contratos, integraciones

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Contratos de API entre frontend y backend, e integraciones externas CL. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟡 Contrato de catálogo implementado (Fase 5 · Etapa 2, §5); resto borrador. |
> | **Last Updated** | 2026-07-06 |
> | **Depends On** | ARCHITECTURE.md, DATABASE.md |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ de *contratos de API* (cuando madure en Fase 4). |

> *Estado: §1–4 = borrador. §5 = contrato de catálogo YA implementado y consumido
> por `apps/web` (Store API de Medusa + campo calculado); fuente de verdad viva.*

## 1. Alcance (a definir)
API entre frontend Next.js y backend e-commerce (Medusa u otro), más integraciones externas CL.

## 2. Dominios de endpoints (borrador)
- **Catálogo:** productos, categorías, búsqueda, filtros.
- **Carrito / Checkout:** carrito, cálculo de despacho, creación de orden, pago.
- **Mascotas:** CRUD de perfil de mascota, recomendaciones personalizadas.
- **Suscripciones:** crear/pausar/cancelar, cálculo de frecuencia, próxima entrega.
- **Cuenta:** auth, direcciones, pedidos, boletas.
- **Webhooks:** pago (Webpay/MercadoPago), courier (tracking), WhatsApp.

## 3. Integraciones externas
- Transbank Webpay Plus · Mercado Pago · Khipu.
- Couriers (Blue Express/Starken/Chilexpress) — cotización y tracking.
- SII (LibreDTE/Bsale) — emisión de boleta.
- WhatsApp Business API — recordatorios.

## 4. Pendientes
- Definir contratos (REST/GraphQL), auth, rate limiting, idempotencia en pagos.

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

### 5.5 Aún demo en `apps/web`
El dashboard personalizado (mascota/anticipación) sigue con datos demo
(`lib/demo-data.ts`) hasta construir el moat. Carrito y checkout ya son reales (§6).

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
Transferencia carrito→cliente al iniciar sesión (`cart.transferCart`) y **Mercado
Pago Checkout Pro** (payment provider module + webhook + redirect/confirmación).
