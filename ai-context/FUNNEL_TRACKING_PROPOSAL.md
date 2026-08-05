# PROPUESTA TÉCNICA — Ciclo de vida de carritos, órdenes y tracking del funnel

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Diagnóstico de la implementación real + arquitectura propuesta para no seguir ciegos antes de la Order. **Documento de propuesta, NO ratificado.** |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟡 Propuesta — pendiente validación de Carlos |
> | **Last Updated** | 2026-08-04 |
> | **Depends On** | `CURRENT_STATE.md`, `DATABASE.md §5–§10`, `API.md §14`, D24 · D46 · D55 · D58 · D73 |
> | **Supersedes** | — |
> | **Source of Truth** | ❌ Ninguna todavía. Si se ratifica → entrada `D75` en `DECISIONS.md` + dueño temático definitivo. |

> **Regla de lectura:** todo lo que sigue está verificado contra el código real (`apps/backend`, `apps/web`, `node_modules/@medusajs` 2.16.0), no contra la documentación de Medusa. Cada afirmación no obvia lleva su archivo y línea.

---

## 1. Diagnóstico de la implementación actual

### 1.1 Ciclo de vida del Cart — lo que REALMENTE pasa

**Cuándo se crea.** El carrito **NO** se crea al entrar al sitio. Es **perezoso**: nace exactamente en el primer `addItem`.

```
apps/web/src/components/providers/cart-provider.tsx:94-99
  ensureCart() → si no hay cartRef.current → createCart()
```

Esto es más importante de lo que parece: **el concepto persistente que nace apenas el cliente agrega el primer producto, y que sobrevive todo el funnel, ya existe. Es el Cart de Medusa.** No hay que inventarlo. La intuición de tu brief es correcta; lo que falta no es la entidad.

`createCart()` → `POST /store/carts` con `region_id` → emite `cart.created` (`create-carts.js:217`).

**Cómo persiste.** `cart_id` en `localStorage` bajo la clave `manada_cart_id` (`cart-provider.tsx:30`). Sobrevive cierres de pestaña y de navegador, indefinidamente. Es compartido entre pestañas del mismo origen (localStorage es por origen, no por pestaña) → **múltiples pestañas ya funcionan bien hoy**. Es por dispositivo y por navegador → **múltiples dispositivos NO están cubiertos**.

**Cuándo se actualiza y qué evento emite cada acción** (verificado en `@medusajs/core-flows`):

| Acción de la UI | Función en `apps/web` | Workflow Medusa | Evento emitido |
|---|---|---|---|
| Agregar producto | `addLineItem` | `addToCartWorkflow` | `cart.updated` (`add-to-cart.js:238`) |
| Agregar suscripción | `addSubscriptionLineItem` → ruta propia | `addToCartWorkflow` (dentro de nuestra ruta) | `cart.updated` |
| Cambiar cantidad | `setLineItemQuantity` | `updateLineItemInCartWorkflow` | `cart.updated` (`update-line-item-in-cart.js:227`) |
| Quitar producto | `removeLineItem` | `deleteLineItemsWorkflow` | `cart.updated` (`delete-line-items.js:46`) |
| Email + dirección + RUT | `setCheckoutInfo` | `updateCartWorkflow` | `cart.updated` (`update-cart.js:219`) · `cart.customer_updated` si cambia el cliente (`:194`) · `cart.region_updated` si cambia la región (`:207`) |
| Elegir despacho | `selectShippingMethod` | `addShippingMethodToCartWorkflow` | `cart.updated` (`add-shipping-method-to-cart.js:146`) |
| Login con carrito | `transferCartToCustomer` | `transferCartCustomerWorkflow` | `cart.customer_transferred` (`transfer-cart-customer.js:93`) |

**Cuándo se elimina.** **NUNCA.** Verificado: Medusa v2 no tiene job de limpieza, ni TTL, ni purga de carritos (no existe ningún `jobs/` en `@medusajs/medusa/dist`). La fila `cart` vive para siempre. Nuestro `clear()` (`cart-provider.tsx:152`) **no borra** el carrito viejo: crea uno nuevo y cambia el puntero de `localStorage`.

**Y el hallazgo que más valor tiene:** quitar un producto del carrito **no borra la fila**.

```
@medusajs/core-flows/dist/line-item/steps/delete-line-items.js:12
  await service.softDeleteLineItems(ids)
```

Es un **soft delete**. La línea queda en `cart_line_item` con `deleted_at` poblado. **Ya tenemos, hoy, en producción, el registro de cada producto que alguien sacó del carrito y a qué hora lo sacó.**

**Cuándo se convierte en Order.** Solo por `settleFlowPayment` (`apps/backend/src/lib/flow-settle.ts:97`), tras verificar con Flow `payment/getStatus`. Llama a `completeCartWorkflow`, que en una sola transacción:
- fija `cart.completed_at` (`complete-cart.js:484`),
- **copia `cart.metadata` a `order.metadata`** (`complete-cart.js:404`),
- crea la fila del link **`order_cart`** (`@medusajs/link-modules/dist/definitions/order-cart.js`),
- emite `order.placed` con prioridad `CRITICAL`.

**El vínculo carrito ↔ orden definitiva que pides en el brief ya existe y es nativo.** Es la tabla `order_cart`.

### 1.2 Qué tablas participan hoy

| Tabla | Dueño | Qué guarda | ¿Se conserva tras abandono? |
|---|---|---|---|
| `cart` | Medusa | `id`, `customer_id`, `email`, `region_id`, `sales_channel_id`, `metadata` (JSONB), `completed_at`, `created_at`, `updated_at` | ✅ para siempre |
| `cart_line_item` | Medusa | producto, variante, título, `unit_price`, cantidad, `metadata` (nuestro `is_subscription`/`frequency_weeks`), `deleted_at` | ✅ incluso lo eliminado |
| `cart_line_item_adjustment` | Medusa | promociones aplicadas a la línea | ✅ |
| `cart_shipping_method` | Medusa | despacho elegido | ✅ |
| `cart_address` | Medusa | dirección de envío/facturación | ✅ |
| `cart_payment_collection` | Medusa | link a la payment collection | ✅ |
| `order_cart` | Medusa (link) | **orden ↔ carrito de origen** | ✅ |
| `flow_payment` | **Manada** (D58) | `cart_id`, `token`, `commerce_order`, `amount`, `status` (`pending`/`paid`/`rejected`/`canceled`), `order_id`, `error` | ✅ |

### 1.3 Qué tenemos implementado nosotros

- **Subscribers (15):** todos sobre `order.placed`, `customer.*`, `auth.password_reset`, `shipment.created` y nuestros eventos propios `subscription.*`. **Cero subscribers sobre eventos de `cart`.**
- **Workflows:** consumimos los nativos (`completeCartWorkflow`, `createPaymentCollectionForCartWorkflow`, `capturePaymentWorkflow`…). **No tenemos workflows propios.**
- **Hooks:** ninguno registrado sobre el ciclo del carrito.
- **Eventos de dominio propios:** `subscription.created/paused/resumed/cancelled/skipped/renewed/payment_failed/ended_unpaid` (D57·R5). **El patrón de eventos propios ya está establecido y probado en el proyecto** — esto importa para la propuesta.
- **Tracking del funnel:** `apps/web/src/lib/analytics/events.ts` — 6 eventos empujados al `dataLayer` de GTM (`onboarding_start`, `recommendation_shown`, `add_to_cart`, `begin_checkout`, `purchase`, `subscription`). **100% cliente.**

### 1.4 ¿Medusa ya entrega parte de esto y no lo estamos usando?

**Sí, y es la mayor parte.** Esta es la conclusión central del diagnóstico:

| Tu pregunta de negocio | ¿Se puede responder HOY con la BD de producción? |
|---|---|
| ¿Cuántos usuarios agregaron un producto al carrito? | ✅ **Sí.** `count(*) from cart where exists(line items)`. Como la creación es perezosa, **carrito creado ≡ hubo un add-to-cart**. |
| ¿Qué productos son los más abandonados? | ✅ **Sí.** `cart_line_item` (incluyendo `deleted_at IS NOT NULL`) contra carritos con `completed_at IS NULL`. Distingue además *quitado del carrito* vs *abandonado dentro del carrito*. |
| ¿Cuántos llegaron al checkout pero nunca pagaron? | ✅ **Sí, y con tres niveles de precisión.** `cart.email IS NOT NULL` (el email solo se fija en el checkout, `checkout.ts:51`) = llenó el formulario · existe `cart_shipping_method` = eligió despacho · existe `flow_payment` con `status != 'paid'` = **llegó a la pasarela y no pagó**. |
| ¿Cuánto tiempo permaneció un carrito antes de abandonarse? | ⚠️ **Aproximable, no exacto.** Ver §2.3: `cart.updated_at` está roto para este fin. |
| ¿Qué % del abandono ocurre antes vs durante el checkout? | ✅ **Sí.** Es la partición de la fila anterior. |
| ¿Qué usuario o invitado estuvo a punto de comprar X? | 🟡 **Solo parcialmente.** Autenticado: ✅ (`cart.customer_id`). Invitado que llegó al checkout: ✅ (`cart.email`). **Invitado que abandonó antes del checkout: ❌ imposible.** No existe ningún identificador. |

**El diagnóstico honesto es que hoy el problema es 70% de *acceso* y 30% de *datos*.** El dato existe, está persistido y nadie lo consulta porque no hay dónde consultarlo. Solo una cosa se está perdiendo de forma irrecuperable, y es la identidad anónima previa al checkout — cada día que pasa sin resolverla es dato que no se recupera nunca.

### 1.5 Mecanismos nativos disponibles y sin usar

1. **Analytics Module de Medusa v2** — `@medusajs/analytics` 2.16.0 está instalado (dependencia transitiva). Expone `track()` e `identify()` server-side con providers enchufables (`analytics-local` ya presente; PostHog/Segment son paquetes aparte). **Es un *sumidero*, no un *almacén*:** sirve para mandar eventos a un destino externo, no para responder "muéstrame los carritos vivos ahora" desde nuestra BD. Es complementario a la propuesta, no sustituto.
2. **Eventos de cart** (§1.1) — cinco eventos nativos, ninguno escuchado.
3. **Link `order_cart`** — el vínculo carrito↔orden ya está resuelto.
4. **`cart.metadata` (JSONB)** — punto de extensión libre, ya usado para el RUT, y **el `POST /store/carts` nativo lo acepta al crear** (`validators.js:23`).
5. **`flow_payment`** — sin proponérnoslo, D58 construyó un *ledger de intención de pago*. Es la señal más limpia de "estuvo a un paso de comprar" y no se explota.

---

## 2. Debilidades de la arquitectura existente

**D1 · No existe identidad anónima.** No hay `visitor_id`, `session_id` ni anónimo de ningún tipo en `apps/web`. Un invitado que agrega al carrito y se va deja una fila con `customer_id = NULL` y `email = NULL`. Es la única pérdida irrecuperable, y afecta directo a remarketing y a la recuperación de carrito multi-dispositivo.

**D2 · `cart.updated_at` es poco fiable para "último movimiento".** Verificado: `addToCartWorkflow` **no toca la fila `cart`** — solo crea líneas (`add-to-cart.js` no invoca `updateCartsStep`). Solo `updateCartWorkflow` y `completeCartWorkflow` escriben la fila. Consecuencia: un carrito al que le agregaron 4 productos puede tener `updated_at == created_at`. Cualquier métrica de permanencia o de "carrito inactivo hace N horas" construida sobre `cart.updated_at` da un resultado silenciosamente falso.

**D3 · Los totales del carrito NO son columnas.** El modelo declara `total`, `item_total`, `subtotal`, `discount_total`, etc. como `model.bigNumber().computed()` (`@medusajs/cart/dist/models/cart.js`), y el `CREATE TABLE "cart"` **no tiene ninguna columna de totales**. Se calculan en lectura a partir de líneas + ajustes + métodos de envío + tax lines. Esto ya nos costó dinero real una vez: es exactamente la causa raíz del defecto de D73 en el que se cobraban $3.990 de $29.500. **Para analítica implica que no existe un `SELECT total FROM cart`**: listar "carritos abandonados por valor" obliga a cargar todas las relaciones de cada carrito. Es el argumento técnico más fuerte de toda esta propuesta.

**D4 · No hay índices para acceso analítico.** La tabla `cart` tiene índices en `customer_id`, `region_id`, `sales_channel_id`, `currency_code`, `deleted_at`. **Ninguno en `created_at`, `updated_at` ni `completed_at`.** Y los índices de `cart_line_item` sobre `product_id`/`variant_id` son **parciales con `WHERE deleted_at IS NULL`** — o sea, la consulta de "productos más abandonados", que necesita justamente las líneas eliminadas, no los usa.

**D5 · El estado del funnel es una heurística, no un hecho.** "Llegó al checkout" se infiere de `email IS NOT NULL`. Funciona hoy porque el email solo se fija ahí, pero es un acoplamiento implícito: el día que el checkout pida el email antes, o que el funnel F5 (D65) auto-cree cuentas, la métrica histórica cambia de significado sin que nadie se entere.

**D6 · GA4/Pixel no responde estas preguntas y nunca lo hará.** Es agregado (no individual), se pierde con bloqueadores (~20-30 % en LATAM), no se puede unir con la Order para LTV, y no es consultable desde el backoffice. Además la compra se mide con un snapshot en `sessionStorage` (`checkout-snapshot.ts`) que **se pierde si el usuario vuelve de Flow en otra pestaña o en otro dispositivo** — es decir, hoy hay `purchase` sub-reportados y no lo sabemos.

**D7 · Sin política de retención.** Los carritos se acumulan para siempre. Irrelevante hoy, un costo real a escala.

---

## 3. Alternativas evaluadas

### Alternativa A — El Cart como fuente de verdad

Explotar lo que ya está: `cart` + `cart_line_item` (con soft-deletes) + `flow_payment` + `order_cart`. Agregar solo índices, una consulta y una pantalla.

**Pros**
- Cero escritura nueva en el camino crítico del checkout. Riesgo de producción prácticamente nulo.
- **Retroactivo:** el día que se despliega, todos los carritos históricos de producción quedan consultables.
- Respeta "un hecho, un dueño" de forma total: no puede haber deriva porque no hay copia.
- Nativo de Medusa: promociones, suscripciones, precio suscrito custom, Flow — todo sigue funcionando porque no se intercepta nada.

**Contras**
- No resuelve D1 (identidad anónima). Deja fuera "qué invitado estuvo a punto de comprar X".
- No resuelve D3: sin totales almacenados, cualquier listado ordenado por valor es caro.
- No hay historia de movimientos: se ve el estado actual y las líneas eliminadas, pero no la secuencia de cambios de cantidad ni cuándo se cruzó cada etapa.
- El estado del funnel sigue siendo heurístico (D5).

**Escalabilidad.** Con índices, correcta hasta cientos de miles de carritos. El problema no es el volumen sino el **coste por fila** de calcular totales (D3).

**Veredicto:** es la base correcta e imprescindible, pero **insuficiente por sí sola**.

### Alternativa B — Nueva entidad (Draft Order / Purchase Intent / Cart Session)

Un módulo nuevo que **espeje** el carrito: sus ítems, cantidades, precios y totales.

**Estructura:** tabla `purchase_intent` + `purchase_intent_item`, escritas desde subscribers o desde las rutas.

**Pros:** esquema propio, estable frente a cambios de Medusa; consulta trivial; ideal para BI.

**Contras — y son graves para Manada**
- **Viola frontalmente "un hecho, un dueño"** (`PROJECT_HEALTH_REPORT.md §5`), la regla anti-deuda central del proyecto. Habría dos verdades sobre qué hay en un carrito.
- **La copia va a derivar, garantizado.** El precio de una línea de suscripción lo fija nuestra ruta custom; las promociones las recalcula `updateCartPromotionsWorkflow`; el envío gratis lo aplica un ajuste automático; `refreshCartItemsWorkflow` recalcula precios cuando cambia el catálogo. Un espejo tiene que reproducir toda esa cadena o mentir. **Es exactamente la clase de defecto de D73**, donde una corrección no cruzó de una ruta a la otra.
- Doble escritura en el camino del checkout → o latencia añadida, o consistencia eventual con bugs difíciles.
- **Arranca ciego:** no puede reconstruir el histórico que ya tenemos.
- Cada funcionalidad futura tiene que acordarse de actualizarlo.
- Medusa **ya tiene** una entidad `draft_order` (`@medusajs/draft-order`): es para que un operador arme un pedido desde el Admin, no para intención de compra del cliente. Reusarla sería torcerla.

**Veredicto:** es tu intuición del brief, y es la que voy a desafiar. **La entidad persistente que describes ya existe: es el Cart.** Duplicarla añade el mayor riesgo de todas las opciones a cambio de comodidad de consulta, que se puede conseguir sin duplicar.

### Alternativa C — Event sourcing liviano

Tabla append-only `funnel_event` alimentada por subscribers: `cart_created`, `product_added`, `product_removed`, `checkout_started`, etc.

**Pros:** historia temporal completa; responde "cuánto tardó entre etapas"; append-only = cero contención con el camino de escritura; ideal para disparar CRM y para ETL.

**Contras — incluido un impedimento técnico duro**
- **Medusa emite `cart.updated` con payload `{ id }` y nada más.** No dice *qué* cambió. Para distinguir `product_added` de `product_removed` de `quantity_changed` hay que **diferenciar contra el estado anterior**, lo que obliga a guardar el estado anterior en alguna parte → se necesita un almacén igual. Un event sourcing puro sobre los eventos nativos no es implementable sin agregar un almacén.
- Sin proyección, "muéstrame los carritos vivos ahora" obliga a plegar eventos en cada lectura.
- El event bus de producción es Redis, con semántica **at-least-once**: hay que asumir duplicados.
- Volumen: decenas de filas por carrito.

**Veredicto:** aporta lo único que A no puede dar (secuencia temporal), pero **no puede ser el mecanismo principal.**

---

## 4. Comparación

| Criterio | A · Cart | B · Entidad espejo | C · Eventos puro |
|---|---|---|---|
| Riesgo para producción | **Nulo** | Alto (doble escritura) | Bajo (async) |
| Riesgo de deriva de datos | **Ninguno** | **Alto y estructural** | Medio (duplicados) |
| Retroactivo sobre prod | **✅ Total** | ❌ Arranca vacío | ❌ Arranca vacío |
| Identidad de invitado | ❌ | ✅ | ✅ |
| Estado en tiempo real | ✅ | ✅ | ❌ requiere plegado |
| Historia temporal | Parcial (soft-deletes) | ❌ | **✅** |
| Coste de consulta | Alto por D3 | Bajo | Alto |
| Compatible con promos/suscripción/Flow | **✅ por construcción** | ⚠️ hay que replicarlo todo | ✅ |
| Respeta "un hecho, un dueño" | **✅** | ❌ | ✅ |
| Implementable con los eventos nativos | ✅ | ✅ | ❌ (payload `{id}`) |
| Líneas de código nuevas | ~pocas | Muchas | Medias |

---

## 5. Recomendación final

### Ninguna de las tres pura. **A como columna vertebral + una tabla "sidecar" que guarda SOLO lo que Medusa no tiene.**

La diferencia con la Alternativa B es la que decide todo: **un sidecar no copia nada.** No guarda ítems, ni precios de línea, ni promociones, ni el detalle del carrito. Guarda exclusivamente los hechos de los que Medusa no es dueño y que el Cart no puede expresar. Por eso no puede derivar: no hay dos verdades sobre el mismo hecho.

**Módulo propuesto: `cart-funnel`** — una fila por carrito, escrita por **un solo subscriber**, fuera del camino crítico.

```ts
// apps/backend/src/modules/cart-funnel/models/cart-funnel.ts
cart_id            // 1:1 con el carrito. La verdad del contenido vive allá.
visitor_id         // ← D1. Identidad anónima. Medusa no la tiene.
customer_id        // se llena en cart.customer_transferred / customer_updated
email              // se llena en el checkout
stage              // ← D5. Etapa MÁXIMA alcanzada, explícita y monótona.
first_item_at      // ← nace con el primer producto (tu intuición del brief)
last_activity_at   // ← D2. Lo que cart.updated_at no puede dar.
identified_at / checkout_at / payment_at / converted_at   // marcas de tiempo por etapa
items_count        // ← D3. Snapshot para LISTAR, no fuente de verdad.
total              // ← D3. Idem.
order_id           // vínculo con la orden definitiva (además del order_cart nativo)
recovery_email_at  // etapa 5: evita re-enviar recuperación
```

Sobre `items_count` y `total`: **son la única denormalización de toda la propuesta y está justificada por D3.** Como los totales de Medusa son columnas calculadas, listar 5.000 carritos abandonados ordenados por valor sin este snapshot obliga a hidratar todas las relaciones de cada carrito. Se declaran explícitamente como *foto del último movimiento para listar*; el detalle de un carrito se lee **en vivo** contra el Cart, que sigue siendo el dueño. Es exactamente la misma disciplina de D59 (catálogo cacheado para las páginas ISR, carrito/checkout leyendo en vivo).

**Estados del funnel** (monótonos: nunca retroceden, así la métrica histórica no cambia de significado):

```
active            ≥1 producto en el carrito          ← nace aquí
identified        email fijado (llegó al checkout)
checkout_started  método de despacho elegido
payment_pending   existe flow_payment pending        ← llegó a la pasarela
payment_failed    flow_payment rejected/canceled
converted         completed_at fijado + order_id
```

`abandoned` **no se almacena**: se deriva en lectura (`stage != 'converted' AND last_activity_at < now() - interval`). Derivarlo garantiza que siempre esté correcto sin depender de que un job corra.

### Por qué es la mejor para Manada, concretamente

1. **No toca el checkout.** Todo cuelga de subscribers, que son asíncronos y no pueden romper un pago. El mandato "no romper absolutamente nada" se cumple por construcción arquitectónica, no por cuidado al escribir.
2. **Es retroactivo.** Una migración de backfill deja consultable todo el histórico de producción desde el minuto uno (menos `visitor_id`, que empieza a existir al desplegar).
3. **Respeta las reglas del proyecto.** El Cart sigue siendo dueño del contenido; el sidecar es dueño de la identidad anónima y de la etapa — hechos que hoy no tienen dueño porque no existen.
4. **Sigue patrones ya probados aquí.** Módulo custom + migración + subscriber + ruta admin: es literalmente la forma de `pet` (D34), `subscription` (D55) y `flow-payment` (D58). Y los eventos de dominio propios ya son un patrón establecido (D57·R5).
5. **Compatible con promociones, suscripciones y Flow sin escribir una línea para ello**, porque nunca los intercepta.
6. **Deja el terreno listo** para el Analytics Module nativo (§1.5.1): el mismo subscriber puede llamar a `track()` el día que se enchufe PostHog, sin re-instrumentar.

### Sobre tu intuición

Era correcta en el fondo y equivocada en la forma. El concepto persistente que nace con el primer producto y sobrevive todo el funnel **ya existe y ya está vinculado a la Order** (`order_cart`). Crear una entidad nueva que lo espeje habría duplicado la verdad justo en el dominio donde D73 demostró lo caro que sale tener dos caminos para el mismo hecho. Lo que falta es más chico y más barato de lo que parecía: **identidad anónima, etapa explícita, timestamp de actividad, índices y una pantalla.**

---

## 6. Riesgos de implementación

| # | Riesgo | Severidad | Mitigación |
|---|---|---|---|
| R1 | **Bucle infinito de eventos**: si el subscriber de `cart.updated` escribiera en el carrito, dispararía `cart.updated` otra vez. | 🔴 Crítico | **El sidecar nunca escribe en `cart`.** Escribe en su propia tabla. El riesgo se elimina por diseño, no por cuidado. |
| R2 | Un fallo en el subscriber rompe el checkout. | 🔴 Crítico | Los subscribers son **asíncronos** y corren fuera de la transacción del workflow. Además: `try/catch` total con log, jamás relanzar. El tracking nunca puede tumbar una venta. |
| R3 | **Duplicados**: el event bus Redis es *at-least-once*. | 🟠 Medio | `cart_id` con índice **único** + escritura idempotente (upsert). Las marcas de tiempo por etapa solo se fijan si están en `NULL`. |
| R4 | **Carrera de escritura** entre dos `cart.updated` concurrentes del mismo carrito. | 🟡 Bajo | La etapa es **monótona** (solo avanza) → el orden de llegada no altera el resultado final. |
| R5 | Backfill largo bloqueando la BD. | 🟠 Medio | Script `medusa exec` por lotes, idempotente y reanudable — mismo patrón que `backfill-customer-pet-links.ts`, que ya existe. |
| R6 | `CREATE INDEX` bloqueando escrituras en producción. | 🟡 Bajo | `CONCURRENTLY`, fuera de transacción. Las tablas hoy son chicas. |
| R7 | Deriva del snapshot `total` respecto del carrito real. | 🟡 Bajo | Declarado explícitamente como foto para listar. El detalle se lee en vivo. Se refresca en cada `cart.updated`. |
| R8 | `visitor_id` y privacidad. | 🟠 Medio | UUID aleatorio propio, sin dato personal, sin cookies de terceros. **Requiere revisar la política de privacidad** — es la única decisión de esta propuesta que no es puramente técnica. |
| R9 | Un `visitor_id` inventado por un cliente malicioso ensucia los datos. | 🟡 Bajo | Es dato analítico, nunca autorización. Validar formato UUID y descartar el resto. |

---

## 7. Impacto en performance

**Camino del checkout: cero.** No se agrega ninguna llamada síncrona. `POST /store/carts` ya acepta `metadata` de forma nativa (`validators.js:23`), así que el `visitor_id` viaja en una petición que ya se hace.

**Subscriber por evento:** 1 lectura `query.graph` del carrito + 1 upsert. Estimado 5–15 ms, **fuera del ciclo de respuesta al usuario**. En producción el event bus es Redis, así que corre en el worker.

**Volumen de eventos.** Un carrito típico genera ~6-10 `cart.updated` (3 productos + cambios de cantidad + email + despacho). Verificado que `refreshCartItemsWorkflow` **no emite eventos propios** (`refresh-cart-items.js`), así que no hay tormenta de eventos anidados. Con el tráfico actual el volumen es despreciable.

**Consultas de reporte:** pasan de "hidratar N carritos con todas sus relaciones" a un `SELECT` indexado sobre una tabla estrecha. Es el salto de rendimiento que justifica el snapshot.

**Frontend:** un `localStorage.getItem` al montar. Cero peticiones nuevas, cero bytes en el bundle crítico.

---

## 8. Impacto en base de datos

**Tablas nuevas:** una (`cart_funnel`). ~15 columnas, todas escalares. Una fila por carrito → **crece exactamente al ritmo de `cart`**, que ya crece igual hoy. Estimado ~200 bytes/fila: 100.000 carritos ≈ 20 MB. Irrelevante.

**Tablas modificadas: ninguna.** No se altera ni `cart` ni `cart_line_item` ni `order`. Esto es lo que hace la migración reversible sin riesgo: revertir es *drop table*, y el sistema queda idéntico a hoy.

**Índices nuevos:**
- En `cart_funnel`: `cart_id` (único), `visitor_id`, `customer_id`, `email`, `stage`, `last_activity_at`, `(stage, last_activity_at)` para el listado de abandonados.
- En tablas nativas (para las consultas de la Etapa 0, que no dependen del módulo): `cart (completed_at, created_at)` y un índice parcial sobre `cart_line_item (product_id) WHERE deleted_at IS NOT NULL` — el que hoy falta para "productos más abandonados" (D4).

**Retención (D7):** la propuesta **no borra nada**. Se documenta como decisión diferida, con la recomendación de revisarla al superar el millón de carritos.

---

## 9. Compatibilidad con lo que viene

| Frente | Encaje |
|---|---|
| **Suscripciones** | Directo. La intención de suscripción ya viaja en `cart_line_item.metadata.is_subscription` (D55) → el sidecar puede marcar el carrito como suscripción sin lógica nueva. Y responde algo que hoy no se puede: *cuántos intentaron suscribirse y no completaron*. |
| **Promociones** | Nativo, sin trabajo. El `total` del snapshot ya incluye los ajustes porque se lee del carrito calculado. El envío gratis ≥$30.000 se refleja solo. |
| **Flow / Mercado Pago** | Sin acoplamiento a la pasarela: el sidecar lee `flow_payment` para derivar `payment_pending`/`payment_failed`. Si algún día entra Mercado Pago junto a Flow, se agrega la lectura de su tabla sin tocar el resto. |
| **CRM / remarketing** | Es el caso de uso que habilita. `visitor_id` + `email` + `stage` + `last_activity_at` es exactamente el input de una campaña de recuperación. Reusa la infra de correo de D45 (Resend) sin código nuevo de envío. |
| **BI / dashboards** | Tabla plana, estrecha, indexada. Consultable con SQL directo o exportable a un warehouse sin transformación. |
| **Analytics Module nativo** | El mismo subscriber puede llamar a `track()` cuando se enchufe PostHog/Segment. Un solo punto de instrumentación server-side, a prueba de bloqueadores — resuelve D6. |
| **Funnel F5 · auto-cuenta (D65)** | Complementario: F5 crea la cuenta *después* de comprar; esto identifica al que *no* compró. |
| **Recuperación de carrito** | `visitor_id` permite ofrecer "retoma tu carrito" en otro dispositivo tras el login. |

### Cobertura de los casos del brief

| Caso | Cómo queda cubierto |
|---|---|
| Usuario autenticado | `customer_id` desde `cart.customer_id` |
| Invitado | **`visitor_id`** ← lo que hoy falta |
| Crea cuenta durante el checkout | `cart.customer_transferred` actualiza `customer_id` conservando el `visitor_id` → **el funnel queda unido de punta a punta** |
| Abandona | `stage` + `last_activity_at`; `abandoned` derivado en lectura |
| Vuelve días después | El carrito nunca se borra (§1.1) y el `cart_id` sigue en `localStorage` |
| Múltiples dispositivos | `visitor_id` por dispositivo, unificados por `customer_id` al iniciar sesión |
| Múltiples pestañas | Ya funciona: `localStorage` es por origen, no por pestaña |
| Recuperación de carrito | Habilitada por `visitor_id` + `email` |
| Suscripciones | Ver tabla anterior |
| Promociones | Ver tabla anterior |
| Mercado Pago | Ver tabla anterior |
| Checkout actual | **Intacto.** Cero cambios en su camino de escritura. |

---

## 10. Plan de implementación incremental

Cada etapa es desplegable a producción por sí sola, aporta valor sola, y es reversible sola.

### Etapa 0 — Responder las preguntas HOY, con cero código de producción
**Qué:** un script `medusa exec` (`src/scripts/funnel-report.ts`) con las consultas SQL que responden 5 de las 6 preguntas del brief sobre los datos que **ya están** en producción. Documentar cada consulta en `API.md`.
**Despliegue:** ninguno. Es un script que se ejecuta a mano.
**Riesgo:** nulo (solo lectura).
**Valor:** inmediato — sabes el tamaño del problema antes de construir nada, y validas el volumen real que justifica (o no) las etapas siguientes.
**Por qué primero:** si resulta que responde suficiente, las etapas 3-5 podrían no hacer falta. No construir antes de medir.

### Etapa 1 — Índices
**Qué:** migración con los índices de §8 sobre tablas nativas (`CONCURRENTLY`).
**Riesgo:** mínimo. Reversible con `DROP INDEX`.
**Valor:** las consultas de la Etapa 0 dejan de ser seq scans.

### Etapa 2 — `visitor_id` (la más urgente)
**Qué:** `apps/web` genera un UUID, lo persiste en `localStorage`, y lo manda como `metadata.visitor_id` en el `createCart()` que ya existe. **Cero cambios en el backend** (el validador nativo ya lo acepta).
**Riesgo:** muy bajo — un campo más en una petición que ya se hace.
**Valor:** cierra D1. **Es la etapa más urgente del plan**, porque es el único dato que se pierde para siempre mientras no exista.
**Por qué va antes que el módulo:** el `visitor_id` empieza a acumularse desde el día del deploy aunque el resto tarde semanas.

### Etapa 3 — Módulo `cart-funnel` + subscriber
**Qué:** el módulo de §5, un subscriber sobre `cart.created`/`cart.updated`/`cart.customer_transferred`/`order.placed`, y el script de backfill del histórico.
**Riesgo:** el de R1–R5, todos mitigados por diseño. **No toca ninguna ruta existente.**
**Valor:** estado explícito + último movimiento + snapshot para listar.

### Etapa 4 — Lectura: API Admin + pantalla
**Qué:** `GET /admin/cart-funnel` (solo lectura, paginado, con filtros por etapa/fecha) + una página en el Admin de Medusa, siguiendo el patrón del widget "Formatos" (D50) y de la sección de suscripciones (D59).
**Riesgo:** nulo (solo lectura, tras auth de admin).
**Valor:** deja de necesitarse un ingeniero para responder una pregunta de negocio.

### Etapa 5 — Activación (remarketing)
**Qué:** job diario que busca abandonados y emite un evento propio `cart.abandoned` → subscriber → correo por Resend, reusando la infra de D45. `recovery_email_at` impide el reenvío.
**Riesgo:** 🟠 **el más alto del plan, porque escribe hacia afuera (correos a clientes reales)**. Va gateado con env var apagada por defecto, exactamente como `SUBSCRIPTION_CHARGES_ENABLED` (D73) y `AUTO_ACCOUNT_ENABLED` (D65).
**Valor:** convierte la medición en ingresos.
**Nota:** requiere decisión de negocio (frecuencia, tono, ¿descuento?), no solo técnica.

### Etapa 6 — Opcional, diferida
Enchufar el Analytics Module nativo con un provider real (PostHog) reusando el mismo subscriber. Solo si la Etapa 4 se queda corta.

---

## 11. Diseño del esquema `cart_funnel` como capa de analytics y CRM

> Añadido tras la revisión de Carlos: el sidecar no se diseña como mínimo viable, sino como la capa de analytics/CRM del proyecto — con los campos que deben existir **hoy** para no migrar cada dos meses.

### 11.1 La regla que decide si un campo entra

Un campo pertenece al sidecar **si y solo si** cumple una de estas tres, y ninguna otra:

- **(a) Medusa no lo guarda en absoluto.** `visitor_id`, atribución UTM, etapa del funnel, estado de la campaña de recuperación.
- **(b) Medusa lo guarda pero lo *sobrescribe*, y nos interesa el momento.** El instante en que se cruzó cada etapa. `cart.updated_at` se pisa; `identified_at` no.
- **(c) Es una llave de consulta denormalizada cuyo cálculo es caro.** Los totales (D3) y las llaves de filtro (`customer_id`, `email`).

Todo lo demás **se queda en el Cart** y se lee en vivo. En particular, lo que **jamás** entra: líneas del carrito, precios por línea, ajustes de promoción, tax lines y direcciones. Una tabla `cart_funnel_item` sería la Alternativa B por la puerta de atrás.

Sobre la categoría (c) hay que ser explícito para no engañarse: `customer_id`, `email` y los totales **son copias**. La disciplina es que **nunca son autoritativas**: si discrepan del Cart, gana el Cart y el proyector las corrige en la siguiente pasada. Son índices materializados, no verdad.

### 11.2 Cómo se evitan las migraciones frecuentes

Cuatro decisiones, no una:

1. **Columnas planas y tipadas para lo que ya sabemos que vamos a consultar**, no JSONB. Un `where utm_source = 'meta'` sobre columna indexada es trivial; sobre JSONB es una extracción por fila. Las herramientas de BI leen columnas, no claves anidadas.
2. **Un solo `context` JSONB para la cola larga** de lo que aún no sabemos que necesitaremos. Es la válvula de escape que evita una migración por cada idea nueva.
3. **`projection_version`** — un entero que marca con qué versión del proyector se calculó la fila. Añadir un campo mañana deja de ser una migración de datos: se agrega la columna (nullable), se sube la versión, y un job re-proyecta solo las filas con versión antigua **usando el mismo proyector**. Este campo es, en la práctica, lo que hace baratas todas las migraciones futuras.
4. **Ejes separados.** Progreso, desenlace y activación son tres cosas distintas y viven en tres campos distintos. Mezclarlas es lo que obliga a reescribir enums.

### 11.3 La decisión de diseño que más importa: progreso ≠ desenlace

La tentación es un solo enum `ACTIVE | CHECKOUT_STARTED | PAYMENT_PENDING | PAID | ABANDONED | FAILED`. **Es una trampa**, y se ve al escribir el primer caso real: un cliente cuyo pago se rechaza y que a los cinco minutos paga con otra tarjeta. Con un enum único, `payment_failed` tendría que ser a la vez posterior a `payment_pending` y anterior a `paid`, y el orden deja de ser un orden. Cada estado nuevo obliga a revisar todas las comparaciones.

La separación:

- **`stage` — eje de progreso, estrictamente monótono.** `active < identified < checkout_started < payment_pending < paid`. Solo avanza, nunca retrocede. Esto hace que el orden de llegada de los eventos sea irrelevante (R4) y que las métricas históricas no cambien de significado.
- **`last_payment_status` + `payment_attempts` — eje de desenlace.** Que un pago se haya rechazado es un hecho ortogonal a cuán lejos llegó la persona. Y "intentó pagar 3 veces" es, por sí solo, un disparador de CRM excelente.
- **`recovery_*` — eje de activación.** Qué le hemos hecho nosotros al carrito.

**`abandoned` no se almacena.** Se deriva en lectura: `stage != 'paid' AND last_activity_at < now() - interval`. Almacenarlo obligaría a un job que lo marque, y ese job podría no correr; derivarlo está siempre correcto. Además, "abandonado" es una definición de negocio que va a cambiar (¿24 h?, ¿72 h?) — si es derivada, cambiarla es cambiar una consulta; si está almacenada, es re-procesar la tabla.

### 11.4 Campos propuestos

| Grupo | Campos | Por qué (regla §11.1) |
|---|---|---|
| **Identidad** | `cart_id` (único), `visitor_id`, `customer_id`, `email` | (a) para `visitor_id` — Medusa no tiene identidad anónima. (c) para el resto. |
| **Progreso** | `stage`, `activated_at`, `identified_at`, `checkout_started_at`, `payment_pending_at`, `paid_at`, `last_activity_at` | (a) y (b). El instante de cada cruce es irrecuperable después. |
| **Desenlace del pago** | `payment_attempts`, `last_payment_status` | (a). Deriva de `flow_payment`, sin acoplarse a Flow. |
| **Snapshot comercial** | `items_count`, `units_count`, `subtotal`, `discount_total`, `shipping_total`, `total`, `currency_code`, `has_subscription`, `promo_codes` | (c) — **D3**. Se incluye el desglose y no solo `total` porque calcularlo cuesta lo mismo en la misma lectura, y pedirlo mañana sí costaría una migración. |
| **Conversión** | `order_id`, `order_display_id`, `converted_at` | (c). El vínculo canónico sigue siendo `order_cart`; esto es la llave denormalizada. |
| **Atribución** | `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `referrer`, `landing_path`, `device_type` | (a) y **se pierde para siempre si no se captura en el momento**. Son las 8 columnas que más migraciones evitan: sin ellas no se puede responder "¿qué campaña trae carritos que sí convierten?", que es la primera pregunta que hace cualquiera con un dashboard. |
| **Contexto Manada** | `pet_species`, `pet_stage` | (a) y **específico de este negocio**. El funnel de Manada empieza dando de alta una mascota; poder segmentar "dueños de cachorros que abandonaron" es el tipo de campaña que justifica todo esto. Cuesta 2 columnas hoy e es imposible reconstruirlo después. |
| **CRM / activación** | `recovery_email_count`, `recovery_email_at`, `recovered_at` | (a). `recovered_at` mide el ROI del programa de recuperación, no solo si se mandó el correo. |
| **Extensión** | `context` (JSONB) | La válvula de escape de §11.2.2. |
| **Housekeeping** | `projection_version`, `projected_at` | Hacen baratas las migraciones futuras y visible la deriva del proyector. |

Son ~35 columnas y hay que justificar por qué eso no contradice el "sin sobreingeniería" de la propuesta original. **La línea está en que las columnas son baratas y los caminos de escritura son caros.** Treinta y cinco columnas nullable en *una* tabla escrita por *una* función no añaden riesgo ni complejidad — una columna NULL en Postgres ocupa un bit en el mapa de nulos. Lo caro habría sido una segunda tabla, una segunda escritura en el checkout, o una segunda verdad. Nada de eso está aquí.

---

## 12. Dónde vive el mantenimiento de `last_activity_at` y del estado

### 12.1 La respuesta corta

**El punto correcto es una función proyectora idempotente (`src/lib/cart-funnel-projection.ts`) que los subscribers se limitan a disparar.**

La distinción no es retórica. Decir "lo hacemos con subscribers" describe el *disparador*; la arquitectura es el **proyector**. Y de ahí sale todo lo demás:

- El proyector **deriva el estado leyendo el carrito**, no interpretando el evento.
- Por eso es idempotente, es indiferente al orden y se auto-repara.
- Por eso el backfill del histórico y un futuro job de reparación **usan exactamente el mismo código**, sin una segunda implementación que se desincronice.

### 12.2 Por qué es superior a cada alternativa

**Workflow hooks — descartado por dos razones independientes, ambas verificadas.**

Primero, **no cubren el ciclo de vida**. Los hooks existentes en los workflows de carrito son:

```
add-to-cart.js              → validate, setPricingContext        (ningún hook posterior)
update-line-item-in-cart.js → validate, setPricingContext        (ningún hook posterior)
delete-line-items.js        → (ningún hook)
create-carts.js             → cartCreated  ✅
update-cart.js              → cartUpdated  ✅
complete-cart.js            → orderCreated ✅
```

Los tres movimientos que más importan —agregar, cambiar cantidad y quitar— **no tienen hook posterior**. Un enfoque basado en hooks sería ciego justo donde vive el dato que buscamos.

Segundo, y más grave: **un hook es un step del workflow y corre dentro de su transacción**. Si lanza, dispara la compensación y **revierte el add-to-cart del cliente**. Poner tracking analítico en el camino que puede tumbar una venta invierte exactamente la prioridad correcta.

**Middleware HTTP — descartado.** Corre en el camino de la petición: suma latencia a cada acción del cliente y un error suyo es un 500 en la cara del comprador. Cubre solo lo que pasa por las rutas que matchea, y **la conversión no pasa por ninguna ruta de store** — ocurre en `settleFlowPayment`, disparado por el webhook de Flow. Acoplaría además la analítica a la forma de la respuesta HTTP, como hace `augmentProducts`, que es aceptable para inyectar un precio pero no para mantener estado.

**Triggers de base de datos — descartado.** Invisibles para la aplicación, fuera del control de las migraciones de Medusa, intestables en CI y ejecutándose dentro de la transacción. Toda la deuda, ninguna ventaja.

**Sobrescribir las rutas core o parchear los workflows — descartado.** Viola el mandato explícito de no tocar el flujo actual y el principio "e-commerce primero" de D21.

**Job periódico de reconciliación como mecanismo principal — descartado, pero conservado como red de seguridad.** Latencia de horas: inservible para disparar CRM y para ver el funnel en tiempo real. Como *complemento* del proyector es valioso y sale gratis, porque llama a la misma función.

**Subscribers — la elección, por tres propiedades verificadas:**

1. **Cubren el ciclo completo.** Cada movimiento del carrito emite `cart.updated` (tabla de §1.1). Donde los hooks tienen agujeros, los eventos no.
2. **Corren estrictamente después de que el workflow confirma con éxito.** Esto no es una suposición: `emit-event.js` lo documenta y el bus de Redis lo implementa agrupando los eventos por `eventGroupId` en `staging:<id>` y liberándolos solo al terminar bien (`releaseGroupedEvents`). Si el workflow falla, **el evento no se emite nunca**. Es un *transactional outbox* incluido en el framework: el proyector no puede ver estado revertido, y un checkout fallido no ensucia el funnel.
3. **Son asíncronos y viven fuera del camino de la petición.** No pueden añadir latencia ni romper un pago. Y ya son el patrón establecido del proyecto: 15 subscribers en producción.

### 12.3 Las dos debilidades de los subscribers, y cómo las cierra el proyector

Ser honesto sobre esto es lo que separa el diseño de la elección por defecto:

**Debilidad 1 — entrega *at-least-once* y posible reordenamiento.** Se cierra derivando en lugar de acumular: el proyector nunca hace `count = count + 1` a partir del evento; **lee el carrito completo y recalcula la fila entera**. Procesar el mismo evento tres veces da el mismo resultado. Y el `stage` solo avanza, así que un evento que llega tarde no puede hacer retroceder el funnel.

**Debilidad 2 — un evento perdido dejaría deriva permanente.** Se cierra por la misma propiedad: como cada proyección recalcula todo desde cero, **el siguiente evento repara el anterior**. Solo un carrito cuyo último evento se pierda queda desactualizado, y para eso está el job de reconciliación, que llama a la misma función.

### 12.4 `last_activity_at`: derivar, no estampar

Es la decisión de detalle con más consecuencias, y por eso va explícita.

Lo obvio sería `last_activity_at = new Date()` al procesar el evento. **Sería un error que destruiría justo el dato que queremos recuperar**: al correr el backfill sobre los carritos históricos de producción, todos quedarían marcados con la fecha de hoy, y la pregunta "¿cuánto tiempo permaneció un carrito antes de abandonarse?" quedaría sin respuesta para siempre, esta vez por culpa nuestra.

El proyector lo **deriva de los datos**:

```
last_activity_at = GREATEST(
  cart.created_at,
  cart.updated_at,
  max(line_item.created_at, line_item.updated_at, line_item.deleted_at),   -- incluye eliminadas
  max(shipping_method.updated_at),
  max(flow_payment.updated_at),
  observed_at   -- solo en vivo; ausente en backfill
)
```

Incluir `deleted_at` de las líneas eliminadas es lo que resuelve D1 del apéndice: como quitar un producto no toca la fila `cart`, ese timestamp es la única huella de esa actividad.

El parámetro `observed_at` es la síntesis: **en vivo** vale `now()` y da precisión al segundo; **en backfill** se omite y el resultado se calcula solo desde los datos, quedando históricamente correcto. Una sola función, correcta en los dos modos. Y como siempre se toma el máximo contra el valor ya almacenado, nunca retrocede.

---

## 13. Estado de implementación (2026-08-04)

Implementado y verificado en local; **sin commitear, pendiente validación de Carlos**.

| Etapa | Estado | Artefactos |
|---|---|---|
| **0 · Reporte sobre datos nativos** | ✅ | `src/scripts/funnel-report.ts` |
| **1 · Índices** | ✅ | 3 índices sobre `cart` / `cart_line_item` en la migración del módulo |
| **2 · `visitor_id` + atribución** | ✅ | `apps/web/src/lib/funnel-context.ts` · `lib/medusa/cart.ts` · `recommendation-view.tsx` |
| **3 · Módulo + proyector + backfill** | ✅ | `src/modules/cart-funnel/*` · `src/lib/cart-funnel-projection.ts` · 2 subscribers · `src/scripts/backfill-cart-funnel.ts` |
| **4 · API Admin + pantalla** | ⬜ bloque siguiente | — |
| **5 · Remarketing (gateado)** | ⬜ bloque siguiente | — |

### Verificación ejecutada

- `tsc` backend y web limpios · `medusa build` verde · `eslint` limpio en los archivos tocados.
- **Etapa 0 sobre la BD local:** el reporte devolvió el embudo real (32 agregaron al carrito → 30 al checkout → 17 eligieron despacho → 13 compraron, 40,6 % de conversión), el desglose de abandono y el ranking de productos abandonados **distinguiendo lo que quedó en un carrito muerto de lo que el cliente sacó activamente**. Confirma la tesis del diagnóstico: el dato ya estaba.
- **Backfill:** 34 carritos históricos proyectados, 0 errores.
- **Validación cruzada contra órdenes reales:** para los 13 carritos convertidos, `total` del funnel = ítems de la orden + despacho − descuento, fila por fila, incluida la promoción de envío gratis ≥$30.000. El conteo de líneas coincide exactamente.
- **E2E en vivo** (servidor local, Store API): crear carrito con contexto → `visitor_id` y atribución persistidos · agregar producto → `activated_at` + snapshot correcto · fijar email → `stage` avanza a `identified` · **quitar producto → `last_activity_at` avanza** (el caso que ningún workflow hook cubre) y la línea queda con `deleted_at`.
- **Idempotencia:** re-correr el backfill sobre datos ya proyectados **no alteró un solo campo** —ni `last_activity_at`, ni las marcas de etapa, ni la atribución— y no duplicó filas (35 filas / 35 carritos distintos). Es la prueba directa de que derivar en vez de estampar era la decisión correcta.
- Datos de prueba eliminados de la BD local al terminar.

### Un defecto encontrado y corregido durante la verificación

La primera versión del proyector pedía `items.id`, `items.quantity`, `items.metadata` en vez de `items.*`. **Sin `unit_price` cargado, Medusa calculaba el subtotal de productos como 0** y el `total` quedaba igual al despacho: carritos de $49.980 se proyectaban como $0, y los de checkout como $3.990.

Es **exactamente la causa raíz del cobro de $3.990 sobre $29.500 de D73**, reapareciendo en un archivo nuevo pocas horas después de haberla documentado. Confirma que el problema no era un descuido puntual sino una trampa estructural de Medusa: **los totales dependen de las relaciones cargadas, y recortar la selección de campos los corrompe en silencio**. Aquí solo habría ensuciado un reporte; en la ruta de pago cuesta dinero. Queda comentado en el código para que la próxima persona no lo repita.

### Pendiente antes de desplegar

- **Registrar `D75` en `DECISIONS.md`** — el código ya referencia esa entrada, que aún no existe.
- **Política de privacidad:** el `visitor_id` es un identificador de primera parte sin dato personal, pero debe quedar reflejado antes de encenderlo (R8).
- Barrido de punteros al cerrar el hito: `CURRENT_STATE.md`, `DATABASE.md` (§11 nuevo), `API.md`, `PROJECT_MASTER.md §16`.
- Correr `funnel-report.ts` y el backfill **contra producción** (Carlos: no hay acceso a esa BD desde el entorno de desarrollo).

---

## Apéndice · Verificaciones que cambian el diseño

Siete hechos comprobados en el código que contradicen lo que la documentación de Medusa sugeriría, y que sostienen la recomendación:

1. **`add-to-cart` NO actualiza la fila `cart`** → `cart.updated_at` no sirve para "último movimiento". *(`add-to-cart.js`, sin `updateCartsStep`)*
2. **Quitar una línea es soft delete** → el histórico de productos abandonados ya existe en producción. *(`line-item/steps/delete-line-items.js:12`)*
3. **Los totales del carrito no son columnas** → justifica el snapshot; es la misma causa raíz del cobro incorrecto de D73. *(`models/cart.js`, `.computed()`; `CREATE TABLE "cart"` sin totales)*
4. **`cart.updated` lleva payload `{ id }` y nada más** → hace inviable un event sourcing puro sobre eventos nativos.
5. **`POST /store/carts` acepta `metadata` nativamente** → la Etapa 2 no necesita backend. *(`store/carts/validators.js:23`)*
6. **Los workflows de agregar / cambiar cantidad / quitar línea NO exponen hook posterior** (`add-to-cart.js` y `update-line-item-in-cart.js` solo tienen `validate` y `setPricingContext`; `delete-line-items.js` ninguno) → descarta los workflow hooks como mecanismo, §12.2.
7. **Los eventos se emiten solo si el workflow termina con éxito**, agrupados por `eventGroupId` y liberados al final (`common/steps/emit-event.js` + `event-bus-redis` `releaseGroupedEvents`) → es un *transactional outbox* nativo, y es lo que hace seguro proyectar desde subscribers.

Además, una corrección a una suposición razonable pero falsa: el `update` de MikroORM en Medusa usa `mergeObjectProperties: true` (`mikro-orm-repository.js:226`), así que **escribir `metadata: { rut }` en el checkout NO borra el resto de `cart.metadata`** — el `visitor_id` sobrevive. (El camino de `upsert`, línea 332, sí reemplaza; no lo usamos.)
