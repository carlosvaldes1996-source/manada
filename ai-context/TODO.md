# TODO — Pendientes y decisiones abiertas

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Detalle táctico de pendientes, por frente. Lo hecho no se re-narra aquí: vive en `DECISIONS.md` (D#). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-08-05 |
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

## 🟢 Frente 1c — Analytics del funnel (D75) · implementado, pendiente de despliegue

> Módulo `cart-funnel` + proyector + `visitor_id`. **100 % aditivo**, verificado en local
> (backfill 34/34 · cruce contra 13 órdenes reales · idempotencia · regresión 20/20).
> Contexto completo: `DECISIONS.md` D75 · `ai-context/FUNNEL_TRACKING_PROPOSAL.md` · `DATABASE.md §11`.

- [ ] **Desplegar a Railway.** La migración corre sola en `preDeployCommand`. Crea la tabla
      `cart_funnel` + 3 índices sobre tablas nativas (`cart` y `cart_line_item`). Sin downtime:
      no altera ninguna tabla existente.
- [ ] **Correr el reporte contra producción — lo corre Carlos** (no hay acceso a esa BD desde
      desarrollo): `npx medusa exec ./src/scripts/funnel-report.ts`. Da el embudo real sin depender
      de la proyección. Sirve para dimensionar antes de nada.
- [ ] **Backfill del histórico en producción:** `npx medusa exec ./src/scripts/backfill-cart-funnel.ts`.
      Idempotente y reanudable; usar `FUNNEL_BACKFILL_LIMIT` para una primera pasada acotada.
      **No pasa `observedAt` a propósito** → los carritos históricos conservan su fecha real.
- [ ] **Política de privacidad:** reflejar el `visitor_id` (identificador propio, aleatorio, sin dato
      personal, no es cookie de terceros) antes de darlo por encendido.
- [ ] **Menor — carritos de prueba en la BD local:** quedaron 2 órdenes canceladas (#1500, #1501) del
      arnés de regresión, con su reserva de stock ya liberada. Inofensivas; se limpian si molestan al
      leer los reportes locales.

### Fuera del alcance del MVP (decisión de Carlos, 2026-08-05)

- ⬜ **API Admin + pantalla de administración** del funnel. Basta con que el dato quede persistido y
      consultable por SQL.
- ⬜ **Remarketing / recuperación de carritos** (job + correo por Resend + `recovery_*`). Las columnas
      ya existen; el mecanismo no se implementó. Cuando se retome: va **gateado y apagado**, como
      `SUBSCRIPTION_CHARGES_ENABLED` (D73) y `AUTO_ACCOUNT_ENABLED` (D65), y necesita decisión de
      negocio sobre frecuencia y tono, no solo técnica.

## 🔴 Frente 1b — Flow · Etapa 3: endurecer el motor de cobro (D72)

> **Punto exacto de continuación tras D70/D71/D72.** Contexto completo: `DECISIONS.md` D72 ·
> contratos `API.md §14` (pago), `§15` (customers), `§16` (nativo, **dormido**).
> Rama: `flow/customers-etapa1`. Modelo elegido: **Medusa dueño de la cadencia** (Modelo A).
> **Etapa 3 CERRADA (D73/D74).** El cobro automático sigue **APAGADO** y así se queda: por
> decisión de producto (**D76**) las renovaciones se ejecutan **a mano desde el Admin** hasta
> que haya tracción real. Antes de encender `SUBSCRIPTION_CHARGES_ENABLED` hay que cerrar el
> punto **(3)** y revisar el resto de este frente.

- [x] ~~**(1) Cerrar el doble cobro**~~ → **HECHO en D73** (F6+F9): `lookupFlowStatusByCommerceId`
      con resultado discriminado, `failureKind` en el cobro, desenlaces `deferred`/`unverified`
      y `commerceOrder` **estable por período**. ⚠️ Ojo al leer el planteamiento original de este
      punto: daba por hecho que Flow deduplica cargos con el mismo `commerceOrder`. **Se midió y
      es falso** — por eso quitar el sufijo no era la corrección, sino un efecto lateral de ella.
      **Falta revalidarlo E2E** (la corrida se topó con la cuota diaria de Sandbox).
- [x] ~~**(2) Medir producción ANTES de desplegar**~~ → **RESUELTO por la purga del 2026-08-05.**
      El riesgo era que hubiera suscripciones `active` sin tarjeta que el cobro mandaría a
      `past_due` con correos de dunning a clientes reales. Tras la purga **no queda ninguna
      suscripción en producción**, así que encender el cobro no puede dañar a nadie. Vuelve a
      ser un riesgo el día que existan suscripciones reales: si alguna vez se crean sin
      `payment_method_id`, hay que medirlo antes de encender el barrido.
- [ ] **(3) Unificar `saved_card.gateway_customer_id` ↔ `flow_customer`** — 🔒 **DEUDA TÉCNICA
      BLOQUEANTE DEL ENCENDIDO** (D76): no se hace ahora, pero **debe resolverse antes de poner
      `SUBSCRIPTION_CHARGES_ENABLED=true`**.
      D70 dejó `gateway_customer_id` como copia denormalizada declarada y `flow_customer` como
      dueño. El cobro lee **la copia** (`subscription.payment_method_id` → `saved_card`), nunca a
      la dueña. **Modo de fallo concreto:** si la auto-sanación de D70 se dispara (Flow reporta el
      cliente como eliminado), crea un `cus_…` nuevo y actualiza `flow_customer` **pero no
      `saved_card`** → el cobro apunta a un cliente inexistente, falla siempre y —con #10 ya
      corregido— la suscripción se **aplaza en cada barrido**: nunca cobra, nunca avisa, y en el
      Admin se ve sana. Misma clase de bug que #10, esperando en otra esquina.
      Hoy no puede morder porque no hay cobro automático ni suscripciones.
- [ ] **(4) E2E en sandbox** con `FLOW_API_KEY`/`FLOW_SECRET_KEY` + ngrok en `MEDUSA_BACKEND_URL`
      (`apps/backend/DEV.md`). Validar de paso los 2 puntos abiertos de `API.md §16.13`
      (`changePlan` entre cadencias distintas · omitir `startDateOfNewPlan`) **solo si** alguna vez
      se despierta la capa nativa.
- [ ] **(5) Consultar a soporte de Flow** los límites no documentados (`API.md §16.9`): cuotas de
      planes, tope de suscriptores por plan, rate limits. No bloqueante hoy.

### Abierto por la validación E2E en Sandbox (2026-08-04)

> Los defectos ya corregidos **no se re-narran aquí**: viven en **D73** (cerrada el
> 2026-08-05) y **D74**. Commits: `3c1ba8e`, `845b74d`, `0db8cce`, `2ac8d4e`.
> Hallazgo que cambia el análisis del punto (1): **Flow NO deduplica `customer/charge`
> por `commerceOrder`** — medido, dos cargos aceptados con el mismo id. D72 asumía lo
> contrario. Quitar el sufijo `-a${attempt}` no basta: la única protección es la nuestra.

- [x] ~~**Arnés E2E de Flow — sin commitear y necesita curación.**~~ → **RESUELTO el 2026-08-05
      (D76).** Se conservó **solo lo reutilizable** en **`apps/backend/e2e/`** (ubicación que no
      necesita excepción a `ARCHITECTURE.md §2`): `purga-total.sql` —probado en producción, con
      guarda de catálogo y el tratamiento correcto de `auth_identity`— y un `README.md` con el
      conocimiento de terreno que costó caro (los dos rails y su URL, la tarjeta de Transbank,
      la cuota por cliente, el `Transaction not found`, la receta para probar una renovación a
      mano y los desenlaces del motor). **Los `.mjs` se eliminaron**: cobraban de verdad sin
      comprobar el ambiente, y la mitad tenía ids y tokens de sesión hardcodeados.
      `sandbox-limpieza.sql` se fue con ellos. La regla quedó escrita en el README: un arnés que
      mueva dinero **debe negarse a correr** si el backend no apunta a Sandbox.
      El planteamiento original, que sigue explicando el porqué:
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
- [x] ~~**Revalidar el escenario de RENOVACIÓN en Sandbox**~~ → **APROBADO el 2026-08-04**,
      con un cliente nuevo (cuota fresca). Orden **Paid + Allocated**, cargo único
      (`flowOrder 9265675`, $42.290), ledger `paid` con `commerce_order` **estable** (sin el
      sufijo `-a1` → confirma la corrección de D73 corriendo de verdad), cadencia
      2026-07-20 → 2026-08-17, correo de renovación entregado y sin duplicar el de compra.
      **F7 y F8 verificados por primera vez.** Con esto los **tres escenarios** de la Etapa 3
      quedan aprobados. (La corrida destapó los defectos **#10** y **#11** de abajo.)
- [x] ~~**🔴 Defecto #10 — un `deferred` deja la suscripción TRABADA para siempre.**~~ →
      **CORREGIDO y VERIFICADO el 2026-08-05** (commit `2ac8d4e`; cierre en D73). La
      suscripción trabada volvió a cobrar: `outcome=renewed`, `attempt=2` con el
      `commerce_order` sin cambiar. El diagnóstico se conserva por su valor:
      **Medido** el 2026-08-04 contra Sandbox. Cuando un cargo muere **antes de llegar a
      Flow** (400 de cuota, 401, 5xx, red), `deferCharge` deja el ledger en `pending` con un
      `commerce_order` que Flow nunca registró. Cada intento posterior pregunta por él, recibe
      **`400 "Transaction not found"`**, `lookupFlowStatusByCommerceId` lo clasifica como
      `unavailable` y vuelve a aplazar — indefinidamente. La suscripción sigue `active`,
      vencida e **invisible en el Admin**: pérdida silenciosa de ingresos, sin alarma.
      ⚠️ **Es un defecto de la propia corrección de D73** (F6+F9), no anterior: antes el
      sufijo `-a${attempt}` cambiaba la referencia en cada intento y no había punto muerto.
      D73 cambió "castigar al cliente por un problema nuestro" por "dejar de cobrar en
      silencio".
      **Premisa de D73 que queda corregida:** la entrada dice que no se distingue "no existe"
      de "error" porque *"el spec no documenta qué devuelve Flow ante un `commerceId`
      desconocido"*. El spec sigue sin documentarlo, pero **ya está medido**. Gana lo medido.
      **Corrección propuesta:** tercer desenlace `not_found` → cobrar fresco (Flow es
      autoritativo: si no tiene la transacción, no la cobró).
      El caso de reproducción (`sub_01KZ5CYDBAR3RSG3E0K3Q3HET2`) cumplió su función el
      2026-08-05 y se fue en la purga. **Lección de método:** se conservó a propósito hasta
      después de verificar la corrección — purgar antes habría costado agotar otra cuota de
      ~6 cargos para recrearlo.
- [ ] **🟡 Reemplazar la comparación por TEXTO de `not_found` por el `code` de Flow.**
      `isTransactionNotFound` (`src/lib/flow/payments.ts`) reconoce hoy el `400` por el texto
      `"Transaction not found"` porque **todavía no sabemos qué `code` manda Flow**.
      **Decisión explícita de Carlos (2026-08-04): es transitorio, no definitivo.** El mismo
      cambio añadió `describeLookupError`, que ahora deja `[code=N]` en el mensaje y en los
      logs → **la primera ocurrencia registrada da el número** y con eso se cierra.
      Falla hacia el lado seguro mientras tanto: si el texto cambia, vuelve a `unavailable`
      (se aplaza, nunca se cobra de más).
- [x] ~~**🟠 Defecto #11 — la cadencia avanza desde la fecha programada, no desde hoy.**~~ →
      **DECIDIDO (D74), CORREGIDO y VERIFICADO el 2026-08-05.** `max(fecha_pactada, ahora) +
      frequency_weeks`. Medido: vencida desde el 15-jul, cobrada el 04-ago 23:29:01 → próxima
      entrega 01-sep 23:29:01 (28 días exactos; la lógica vieja daba el 12-ago). Diagnóstico
      original, que sigue explicando el porqué:
      `advanceOnSuccess` hace `next_delivery_date + frequency_weeks`
      (`src/lib/subscription-charge.ts`). Con un atraso **mayor a un ciclo**, la fecha nueva
      sigue en el pasado → el barrido vuelve a cobrar, y se repite hasta ponerse al día:
      varios cobros seguidos y **varios sacos despachados** que el cliente no pidió.
      **Derivado de leer el código el 2026-08-04, NO reproducido.**
      ⚠️ **Se potencia con #10:** un aplazamiento largo produce justo el atraso que lo activa.
      El dunning normal no basta para dispararlo (3 intentos × 3 días < 4 semanas).
      **Decisión pendiente antes de tocar código.** `advanceOnSuccess` corre en TODA
      renovación exitosa, así que cambiarlo obliga a re-validar el escenario de renovación —
      por eso conviene resolverlo en el mismo cambio y el mismo deploy que #10.
- [x] ~~**Purgar los datos de Sandbox de la BD de producción**~~ → **HECHO el 2026-08-05**, y
      más amplio de lo previsto por decisión de Carlos: purga total de datos transaccionales
      conservando catálogo, inventario y configuración. **411 filas** (9 órdenes, 15 clientes,
      30 carritos, mascotas, suscripciones, ledger, `flow_customer`, `saved_card`, reservas,
      notificaciones y tablas de enlace). Catálogo verificado intacto por una guarda que aborta
      sola. Script: `tools/flow-e2e/purga-total.sql`. Detalle y el hallazgo del `auth_identity`
      con `user_id`+`customer_id` en la misma fila: D73.
- [ ] **Preguntar a Flow por la cuota diaria de transacciones** (`400 has exceeded the daily
      transaction quota`, medido en Sandbox tras 6 cargos al mismo cliente): ¿rige en
      Producción, con qué número, y es por cliente o por comercio? Sustituye a la parte (a) del
      punto (5) —ahora la pregunta es concreta—. **Con volumen real esto puede frenar un
      barrido completo de renovaciones**, así que deja de ser "no bloqueante".
      **Medido el 2026-08-04: la cuota es POR CLIENTE, no por comercio** — un cliente nuevo
      cobró sin problema mientras `101920` seguía bloqueado. Queda por confirmar con soporte
      si rige en Producción y con qué número.
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
