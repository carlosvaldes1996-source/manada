# TODO — Pendientes y decisiones abiertas

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Detalle táctico de pendientes, por frente. Lo hecho no se re-narra aquí: vive en `DECISIONS.md` (D#). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-08-04 |
> | **Depends On** | CURRENT_STATE.md (frentes), ROADMAP.md (fases), AUDIT_UI_UX.md (backlog fino de FE) |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ del *detalle táctico de pendientes*. El backlog UI/UX fino vive en AUDIT_UI_UX.md. |

> ✅ **Hecho hasta hoy (no re-abrir):** Fases 0–4 cerradas (D1–D21) · flujo propio del MVP cerrado y endurecido (D22–D29) · funnel F1–F4 sobre catálogo real (D32/D33) · perfil de mascota persistido con edición real y separación comprar≠definir (D34–D39). Cronología y rationale: `DECISIONS.md`.

## 🔴 Frente 1 — Infraestructura de producción (bloquea el lanzamiento)

> 🚧 Etapa 1 (Railway backend) hecha en disco, **sin commitear**; D30 reservada. Punto exacto de continuación y decisiones de la sesión: `CURRENT_STATE.md §WIP`.

- [ ] `railway login` (Carlos) → `railway init` (proyecto `manada`).
- [ ] Provisionar **PostgreSQL** (`railway add`) → `railway up` → gate `/health` → 200.
- [ ] **Redis** gestionado (los módulos ya están condicionados a `REDIS_URL`).
- [ ] **Secrets de producción fuertes** (`JWT_SECRET`/`COOKIE_SECRET`; el fallback `"supersecret"` ya se eliminó en el WIP).
- [ ] **CORS** (`STORE_CORS`/`ADMIN_CORS`/`AUTH_CORS`) apuntando al dominio del frontend.
- [ ] Migraciones + seed de prod + publishable key de prod.
- [ ] Env vars en Vercel (`NEXT_PUBLIC_MEDUSA_BACKEND_URL` + `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, D27) → redeploy.
- [ ] Smoke punta a punta en la URL de Vercel (catálogo · carrito · checkout → orden real).
- [ ] Decidir rama `production` dedicada vs `main`=prod (D27 §3) → conectar dominio `tumanada.cl`.
- [ ] Al validar cada etapa: **documentar D30 + actualizar `DEPLOYMENT.md` + commit/push** (mandato del WIP).

## 🔴 Frente 1b — Flow · Etapa 3: endurecer el motor de cobro (D72)

> **Punto exacto de continuación tras D70/D71/D72.** Contexto completo: `DECISIONS.md` D72 ·
> contratos `API.md §14` (pago), `§15` (customers), `§16` (nativo, **dormido**).
> Rama: `flow/customers-etapa1`. Modelo elegido: **Medusa dueño de la cadencia** (Modelo A).
> El cobro sigue **APAGADO** (`SUBSCRIPTION_CHARGES_ENABLED=false`) — no encender hasta cerrar 1–3.

- [x] ~~**(1) Cerrar el doble cobro**~~ → **HECHO en D73** (F6+F9): `lookupFlowStatusByCommerceId`
      con resultado discriminado, `failureKind` en el cobro, desenlaces `deferred`/`unverified`
      y `commerceOrder` **estable por período**. ⚠️ Ojo al leer el planteamiento original de este
      punto: daba por hecho que Flow deduplica cargos con el mismo `commerceOrder`. **Se midió y
      es falso** — por eso quitar el sufijo no era la corrección, sino un efecto lateral de ella.
      **Falta revalidarlo E2E** (la corrida se topó con la cuota diaria de Sandbox).
- [ ] **(2) Medir producción ANTES de desplegar — lo corre Carlos** (no hay acceso a la BD de prod
      desde el entorno de desarrollo):
      `select status, count(*), count(*) filter (where payment_method_id is null) from subscription group by status;`
      En local hay **4 `active` sin tarjeta**. Si prod tiene lo mismo, encender D59 las manda a
      `past_due` → **correos de dunning a clientes reales**. Decidir qué hacer con ellas antes.
- [ ] **(3) Unificar `saved_card.gateway_customer_id` ↔ `flow_customer`** (D70 lo dejó como copia
      denormalizada declarada). El cobro lee la referencia desde `saved_card` vía
      `subscription.payment_method_id`; `flow_customer` es el dueño desde D70.
- [ ] **(4) E2E en sandbox** con `FLOW_API_KEY`/`FLOW_SECRET_KEY` + ngrok en `MEDUSA_BACKEND_URL`
      (`apps/backend/DEV.md`). Validar de paso los 2 puntos abiertos de `API.md §16.13`
      (`changePlan` entre cadencias distintas · omitir `startDateOfNewPlan`) **solo si** alguna vez
      se despierta la capa nativa.
- [ ] **(5) Consultar a soporte de Flow** los límites no documentados (`API.md §16.9`): cuotas de
      planes, tope de suscriptores por plan, rate limits. No bloqueante hoy.

### Abierto por la validación E2E en Sandbox (2026-08-04)

> Los defectos ya corregidos **no se re-narran aquí** (commits `3c1ba8e` y `845b74d`; la
> entrada `DECISIONS.md` **D73 está pendiente de escribir** al cerrar la etapa).
> Hallazgo que cambia el análisis del punto (1): **Flow NO deduplica `customer/charge`
> por `commerceOrder`** — medido, dos cargos aceptados con el mismo id. D72 asumía lo
> contrario. Quitar el sufijo `-a${attempt}` no basta: la única protección es la nuestra.

- [ ] **Arnés E2E de Flow — existe, está SIN COMMITEAR y necesita curación.**
      Ubicación provisional: **`tools/flow-e2e/`** (untracked; ver su `README.md`). Conduce el
      flujo real contra el backend desplegado y encierra conocimiento caro de re-derivar: la
      secuencia exacta del checkout, que los rails se distinguen por la URL de Flow
      (`/app/customer/disclaimer.php` = suscripción · `/app/web/pay.php` = compra única), la
      tarjeta de prueba de Transbank y la cuota diaria. **`sandbox-limpieza.sql` es lo más
      valioso del conjunto** y ni siquiera es un script de prueba: es la purga obligatoria.
      Antes de commitearlo hay que resolver tres cosas:
      - **Ubicación:** `tools/` en la raíz sería un paquete nuevo → lo prohíbe
        `ARCHITECTURE.md §2` regla 5 sin aprobación explícita. Alternativa que **no** necesita
        excepción: **`apps/backend/e2e/`** (backend verificando backend, fuera de `src/`).
      - **Curación:** `carrera.mjs`, `guardia.mjs`, `callbacks.mjs` y `compra-unica.mjs` tienen
        ids de carrito y tokens de la sesión **hardcodeados**. Commitearlos así sería guardar
        código muerto que además miente. Deben volverse escenarios parametrizados dentro de
        `flow-e2e.mjs`; `verificar.mjs` + `ordenes.mjs` se fusionan en un `estado.mjs`.
      - **Guard de seguridad (lo importante):** hoy el arnés **cobra de verdad** y escribe en la
        BD de producción. Cuando las credenciales vuelvan a Producción, correrlo por inercia
        **cobraría una tarjeta real**. Debe negarse a ejecutar si el backend no apunta a
        Sandbox, salvo bandera explícita. Es la diferencia entre una herramienta y un arma.
- [ ] **Revalidar el escenario de RENOVACIÓN en Sandbox** — es lo único de los tres escenarios
      que quedó a medias. F7 (orden impaga) y F8 (sin reservar stock) están corregidos y
      desplegados **pero sin verificar**: la corrida se topó con la **cuota diaria de Flow
      Sandbox**. Debe verse la orden en **Paid** y **Allocated**, y un solo cargo.
      La suscripción usada quedó en `past_due` con `failed_charge_count=1` por F9 (antes de
      corregirlo) → resetear `status`, `failed_charge_count` y `next_charge_attempt_at` antes
      de reintentar, o usar otra.
- [ ] **Preguntar a Flow por la cuota diaria de transacciones** (`400 has exceeded the daily
      transaction quota`, medido en Sandbox tras 6 cargos al mismo cliente): ¿rige en
      Producción, con qué número, y es por cliente o por comercio? Sustituye a la parte (a) del
      punto (5) —ahora la pregunta es concreta—. **Con volumen real esto puede frenar un
      barrido completo de renovaciones**, así que deja de ser "no bloqueante".
- [ ] **Despacho gratis para suscriptores — decisión de producto tomada, falta implementar.**
      Hoy la incoherencia es un efecto secundario, no una regla: la 1ª compra cobra
      **$3.990** de despacho (el suscrito no alcanza el umbral de envío gratis de $30.000)
      y las renovaciones no cobran nada, simplemente porque `createRenewalOrder` **no le
      pone método de envío** a la orden. Implementar en **las dos puntas**:
      (a) la 1ª compra suscrita no cobra despacho; (b) la orden de renovación lleva un
      método de envío **en $0** —no "sin método"— para que el despacho opere normal y
      quien prepara el pedido vea transportista y servicio.
- [ ] **Entregabilidad del correo de renovación:** llegó a **spam en Hotmail/Outlook**
      (verificado E2E). El de cobro es justo el que el cliente debe ver. Revisar
      DMARC/alineación y reputación del remitente antes de Producción.
- [ ] **Copy del correo de renovación:** afirma *"Tu pedido ya está en camino 🚚"* cuando la
      orden aún está sin despachar. Contradice el principio de correos honestos (D45/D57).
      Debe decir que **se está preparando**. Copy validado por Carlos → cambiarlo con su OK.
- [ ] **Purgar los datos de prueba ANTES de volver a credenciales de Producción.**
      Obligatorio, no cosmético: los `cus_…` creados en Sandbox quedan en `flow_customer` y
      `saved_card`, y **no existen** en el Flow real. `ensureFlowCustomer` solo se auto-sana
      ante `status='0'` — **no detecta que un id es de otro ambiente**, así que el cliente
      afectado queda con la suscripción rota de forma permanente. Cuentas de prueba:
      `carlosvaldescarmona@hotmail.com` y `carlosvaldescarmona+victima@hotmail.com`
      (+ `sandbox+preflight-…@tumanada.cl`). Guion de consultas y purga preparado en la sesión.

## 🟠 Frente 2 — Terceros (post-infra, pre/post-lanzamiento)

- [ ] **Mercado Pago Checkout Pro** (fast-follow tras infra live con pago manual): provider module + webhook + habilitar en región + redirect/confirmación. Decidido: Checkout Pro redirect; "construir todo, credenciales de prueba después" (D24).
- [ ] **Email transaccional**: entrega real del enlace de recuperación (hoy subscriber → log, D26) + confirmaciones de orden/datos de transferencia.

## 🟡 Frente 3 — Producto (en paralelo, por bloques; un bloque → validado → un commit)

- [ ] **Funnel F5 — momento de registro:** empieza por **decisión de producto** con Carlos (dónde vive la captura de cuenta; alternativas en `FUNNEL_TARGET.md §1.6`). No implementar antes de decidir.
- [ ] **Pet Experience B4 — foto de la mascota:** directivas vinculantes de Carlos en `PET_EXPERIENCE_TARGET.md` B4 (foto faltante obvia · sin storage temporal · consistencia ante todo).
- [ ] **Pet Experience B7 — restyle `/cuenta` + estados vacíos** (después de B4).
- [ ] Menor diferido: multi-selección "mismo alimento para dos mascotas" (`PET_EXPERIENCE_TARGET.md §1.3`).
- [ ] **PLP con paginación real en servidor** (dispara la deuda consciente de **D68**). Detonantes, en orden de llegada: (a) catálogo > ~1.500 productos → la entrada de `unstable_cache` supera el **límite de 2 MB por item del Data Cache de Vercel** y deja de cachear *en silencio*; (b) catálogo > 1.000 → `CATALOG_LIMIT` truncaría (hoy hay `console.error` que avisa); (c) orden/filtros sobre el catálogo real (hoy `CategoryView` ordena solo lo que ya bajó) o SEO de páginas de categoría. Alcance del refactor: `searchParams` (`page`/`sort`/filtros) → una página por request con `category_id`/`q`/`order`/`offset`; `<Pagination>` navegando por URL; `fields` livianos para listado vs. completos para PDP; y revisar los consumidores que hoy bajan todo sin necesitarlo (sitemap solo necesita `handle`; PDP, bienvenida, recomendación y `/cuenta/mascotas` necesitan subconjuntos acotados).

## ⏸ En pausa — Polish 3.4 (se retoma cuando existan fotos)

- [ ] **Lote 2 no-fotográfico:** U086 (vuelo al carrito) · U100 (home con un clímax) · U096/U097 (confianza) · U094 (cumpleaños) · U095 (tono salud) · U098/U099 (acento/texturas) · U104 (urgencia) · **U003** (color suscripción — decisión de marca pendiente).
- [ ] **Track fotográfico** (U080/U081/U082/U084/U091/U092), bloqueado por assets: política IA vs fotografía real (**U090, sin decidir**); fotos IA de ChatGPT por probar; existe shot list por pantalla como brief candidato.

## ⬜ Post-tracción (Fases 6–7 — no tocar ahora)

- [ ] **Suscripción recurrente** (el moat transaccional; recipe oficial de Medusa) + encendido de `SUBSCRIPTIONS_ENABLED` + hipótesis tarjeta-en-archivo (`FUNNEL_TARGET.md §1.5`).
- [ ] Motor de anticipación completo (recordatorios proactivos).
- [ ] Webpay (payment provider custom, sujeto a afiliación Transbank) · courier (Blue Express/Starken/Chilexpress) · boleta SII (LibreDTE/Bsale) · WhatsApp Business API.

## 🟢 Operativos de marca (no bloquean)

- [ ] Registrar `tumanada.cl` + handles (@manada / @somosmanada / @tumanada).
- [ ] Verificar marca "Manada" en INAPI.
- [ ] Ejecutar logo en vector (spec en `BRANDING.md §7`).
- [ ] Benchmarking visual fino de DrPet y Chewy (quedó bloqueado por scraping).

> **Backlog vivo de UI/UX:** ítem a ítem en `AUDIT_UI_UX.md` (columna *estado*).
