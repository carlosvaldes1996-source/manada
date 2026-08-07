# 🐾 PROJECT MASTER — Manada

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Documento maestro: visión, estrategia y resumen de decisiones del proyecto. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-11 |
> | **Depends On** | DECISIONS.md (fuente), CURRENT_STATE.md, ROADMAP.md |
> | **Supersedes** | `history/PROJECT_MASTER_v0.md` |
> | **Source of Truth** | ✅ de la *visión y estrategia*. El detalle vive en los archivos temáticos. |

> **Documento maestro: visión y estrategia (lo permanente).** Para detalle de trabajo en curso, ver los archivos temáticos de `/ai-context`.
>
> *📍 El estado actual, la fase activa y el siguiente paso viven **únicamente** en `CURRENT_STATE.md` (no se duplican aquí — regla D40).*

---

## 1. Proyecto

**Manada** — E-commerce de alimentos y accesorios para mascotas en Chile, con suscripción inteligente como motor de negocio. Stack custom headless. Ambición: ser el referente nacional de la categoría.

*(Nombre definitivo: **Manada** · dominio oficial `tumanada.cl` — D8, ver §8 y BRANDING.md.)*

## 2. Objetivo

Construir el e-commerce de mascotas **más confiable, moderno y querido de Chile**, comparable en experiencia a Mercado Libre, Amazon y Shopify, pero adaptado al mercado chileno y diferenciado por conocimiento y anticipación.

## 3. Misión

> Cuidar mejor a cada mascota de Chile **conociéndola como nadie** y anticipándonos a lo que necesita.

## 4. Visión

> Ser el **referente nacional del bienestar de las mascotas**: la marca más confiable, moderna y querida de la categoría en Chile, y dueña del "expediente de vida" de millones de mascotas chilenas.

## 5. Público objetivo

**Pet parents**: dueños que ven a su mascota como un miembro de la familia.

- **Primario:** urbano (RM y grandes ciudades), 25-45 años, digital, ocupado, ingreso medio / medio-alto, valora tiempo y calidad. Compra online y odia la fricción.
- **Secundario:** dueños "involucrados" en salud (mascotas con condiciones, senior, dietas especiales); familias; adultos mayores con mascota de compañía.
- **Insight clave:** sienten culpa/ansiedad por "hacer lo correcto" y por quedarse sin comida. Manada elimina ambas.

## 6. Posicionamiento

> Para los dueños de mascotas en Chile que quieren lo mejor para su compañero sin complicarse, **Manada** es la marca que **conoce a tu mascota como nadie y se anticipa a lo que necesita**. A diferencia de las tiendas que solo venden productos (SuperZoo, PetVet) o de los marketplaces sin criterio (Mercado Libre), Manada opera la vida alimentaria y el bienestar de la mascota.

**Concepto rector (ADN):**
> **"Manada te conoce como nadie y se anticipa a lo que tu mascota necesita."**

## 7. Competidores

| Competidor | Fortaleza | Debilidad que explotamos |
|---|---|---|
| PetVet | Logística + REPET (suscripción) + cards ricas | Copy frío, sin personalización real |
| SuperZoo | Confianza omnicanal (70 tiendas), retiro <3h | Transaccional, promocional, genérico |
| PetHome | Multi-especie, packs, puntos | Sin personalización ni contenido |
| PetCity | Logística propia | Mala reputación (Reclamos.cl, no devoluciones) |
| DrPet | Autoridad veterinaria | (pendiente análisis fino) |
| Mercado Libre | Escala, confianza transaccional, precio | Caótico, sin criterio ni recurrencia inteligente, sin cariño |

Benchmark mundial (norte de calidad): Chewy (cariño + autoship), Zooplus (retención + magazine), Amazon (fricción cero), Petco (membresía Vital Care). Detalle en `history/01-fase-0.2-benchmarking.md`.

## 8. Branding

- **Arquitectura de marca:** 🧠 Conocimiento (moat) → ⚡ Anticipación (producto) → 💛 Amor (marca).
- **Personalidad:** Cuidador + Sabio — cálido, experto, cercano, premium-accesible, anticipatorio. Si fuera persona: una veterinaria cercana de ~35 años que se acuerda del nombre de tu perro y se adelanta a lo que necesitas.
- **Moat:** dato propietario que se compone (perfil vivo de cada mascota) + costo de cambio. Evoluciona hacia ecosistema (C2) y red nacional de datos (C3).
- **Nombre:** ✅ **Manada** (definitivo, D8). Dominio oficial `tumanada.cl`. Descartados Querencia/Olfato/Instinto. Ver BRANDING.md.
- **Logo:** ✅ imagotipo **"huella-manada"** (D10) — huella cuyos dedos son siluetas agrupadas (huella + manada). Logotipo en Fraunces + isotipo escalable. Ver BRANDING.md §7.
- **Voz:** cálida, experta, tuteo chileno, beneficio primero, frases cortas, emojis con moderación. Habla de la mascota por su nombre.
  - ✅ *"A Toby le quedan ~5 días de comida. ¿La reagendamos para que no le falte?"*
  - ❌ *"Recordatorio de recompra programada (24-48 hrs hábiles)."*
- **Mensajes clave:** "Conocemos a tu mascota como nadie" · "Nos anticipamos para que nunca le falte nada" · "Cuidamos mejor porque conocemos mejor". Tagline candidato: *"Cuidamos a quien más quieres."*

## 9. Arquitectura (marca + técnica)

- **De marca:** ver §8.
- **Técnica:** frontend Next.js (App Router) + TypeScript; backend e-commerce headless **Medusa.js v2 (decidido, D21)** con módulos custom para el moat; PostgreSQL + Redis; buscador Meilisearch/Algolia; pagos Webpay/MercadoPago/Khipu; despacho Blue Express/Starken/Chilexpress; boleta SII (LibreDTE/Bsale). **Principio rector (D21): e-commerce primero.** Detalle en ARCHITECTURE.md.

## 10. Paleta

✅ **Confirmada (D11)** con escalas 50–900 y tokens. Terracota `#C2603F` (primario/acción) · Pino `#2F5D50` (secundario/confianza) · Miel `#E5A23C` (acento/anticipación) · Arena `#FAF6F0` (fondo) · Carbón `#2A2722` (texto) + neutros y estados semánticos. Detalle en DESIGN_SYSTEM.md §3.

## 11. Tipografía

✅ **Confirmada (D11).** Fraunces (display/emoción) + Hanken Grotesk (UI/cuerpo/precios con tabular-nums). Escala completa con tokens. Detalle en DESIGN_SYSTEM.md §4.

## 12. UX

✅ Fase 2 completa. Detalle en UX.md.
- **Principios:** mobile-first; navegación por necesidad (especie → necesidad → etapa, no por marca); **perfil de mascota como núcleo**; home y catálogo personalizados; anticipación visible; despacho honesto en la ficha; checkout de 1 pantalla; fricción cero.
- **Lógica del moat (UX):** el Perfil de Mascota (peso, edad, condición, alimento actual) alimenta nudges de recompra ("le quedan ~5 días"), transición de fórmula por etapa, cross-sell de farmacia y "lo de siempre" en 1 clic.
- **Journeys clave:** (A) primera compra con suscripción, (B) recompra anticipada en 1 clic, (C) cross-sell farmacia, (D) alta/gestión de perfil de mascota.
- **Páginas núcleo:** Home, PLP (listado), PDP (ficha), Perfil de Mascota, Carrito, Checkout.

## 13. Diseño

✅ Sistema visual completo (D9·D10·D11). Detalle en DESIGN_SYSTEM.md.
- **Dirección (D9):** cálido pero preciso · personal, no genérico · anticipatorio · premium-accesible · distintivo en CL (huir del rojo retail). Lo visual debe *probar* que la marca conoce y se anticipa.
- **Incluye:** logo "huella-manada", paleta con escalas 50–900 + tokens semánticos, sistema tipográfico, iconografía (línea, trazo 1.75px, base Lucide), dirección fotográfica (mascotas reales, luz cálida, foco selectivo), ilustración (flat orgánica), composición (aire, una jerarquía por vista), grid (12 col, máx 1280) + espaciado (base 4/ritmo 8pt) + radios + sombras cálidas, motion anticipatorio (150/250/400ms, ease-out), componentes base y ejemplos de UI.
- **Implementación:** Tailwind v4 CSS-first (`@theme`) + Radix UI re-estilizado a la marca. Tokens vivos en `apps/web/src/app/globals.css` (D13; ruta actualizada por D20); copia original en `prototype/assets/styles.css`.

## 14. Stack

- **Estructura del repo (D20):** monorepo pnpm workspaces — `apps/web` (frontend) · `apps/backend` (backend) · `packages/shared` solo cuando exista el primer contrato compartido aprobado en `API.md`. **Reglas arquitectónicas permanentes en `ARCHITECTURE.md §2`** (frontend sin lógica de negocio ni DB; backend solo en `apps/backend`; comunicación solo vía `API.md`).
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (re-estilizado).
- **Backend:** ✅ **Medusa.js v2 (D21)** en `apps/backend`, **construido y verificado** (D22–D28) — core commerce + Admin incluido; el moat se construye como módulos custom (primer módulo real: `pet`, D34); pago automático (Mercado Pago) y Webpay como providers, post-infra.
- **Infra:** Vercel (front) + Railway/Fly (backend) + Cloudflare CDN.
- **Analytics:** GA4 + eventos e-commerce + PostHog/Hotjar.

## 15. Base de datos

✅ MVP implementado y verificado, Medusa-native: catálogo (D23), cuentas (D26), envío (D28) y **Perfil de Mascota** — la entidad crítica del moat — como módulo custom `pet` (D34/D35). Detalle en DATABASE.md §5–§8. Post-tracción: suscripción como entidad y motor de anticipación completo.

## 16. Decisiones tomadas

Ver `DECISIONS.md` para la bitácora completa con rationale. Resumen LOCKED:

| # | Decisión |
|---|---|
| D1 | Modelo: tienda completa (alimento + accesorios + farmacia) + suscripción |
| D2 | Stack: custom headless Next.js |
| D3 | Nombre de trabajo: Manada (cerrado por D8) |
| D4 | Territorio de marca: Amor como alma sobre moat defendible |
| D5 | Concepto rector: C1 "Te conoce como nadie y se anticipa" |
| D6 | Arquitectura de marca: Conocimiento → Anticipación → Amor |
| D7 | Documentación: sistema /ai-context (multi-archivo temático) |
| D8 | Nombre definitivo: **Manada** · dominio oficial `tumanada.cl` |
| D9 | Dirección visual: cálido pero preciso, personal y anticipatorio |
| D10 | Logo: imagotipo "huella-manada" (logotipo + isotipo) |
| D11 | Sistema visual de marca completo confirmado (paleta, tipografía, iconos, foto, motion, tokens) |
| D12 | Fase 2: de prototipo HTML a sistema de componentes Next.js (plan) — *ejecutado por D13/D15* |
| D13 | Fase 3 · Etapa 1 — Fundaciones del frontend Next.js en `web/` (Next 16 + React 19 + Tailwind v4 CSS-first + Radix) |
| D14 | Fase 3 — Auditoría UI/UX → backlog priorizado `AUDIT_UI_UX.md` (fuente de verdad de mejoras FE) |
| D15 | Fase 3 · Etapa 2 — Component Library construida (~70 componentes) + styleguide `/dev/components` |
| D16 | Fase 3 · Etapa 3.3B — New User Experience & Activation Flow + modelo de sesión (Landing→onboarding→recomendación→registro→checkout→bienvenida) — *revisado y cerrado por D17* |
| D17 | Fase 3 · Cierre Etapa 3.3 — revisión visual aplicada + modelo **"e-commerce como piso, perfil como camino destacado"** (tienda anónima navegable, checkout de invitado, gate honesto de suscripción, registro valor-primero post-compra) |
| D18 | Fase 3.4 · Polish lote 1 (track no-fotográfico) + política de redondeo CLP (piso a múltiplo de $10) |
| D19 | Se adelanta la Fase 4 (Arquitectura técnica); Polish 3.4 restante ⏸ en pausa hasta tener fotos |
| D20 | Fase 4 · Estructura física: monorepo pnpm (`apps/web` + `apps/backend` reservado) + reglas arquitectónicas permanentes (`ARCHITECTURE.md §2`) |
| D21 | Fase 4 · Stack backend: **Medusa.js v2** + principio de producto "e-commerce primero" (moat como módulos custom, sin fork del core) |
| D22 | Fase 4→5 · Mandato **MVP-first**: alternativa manual por defecto; backend Medusa arrancado + checkout→orden real con pago manual |
| D23 | Fase 5 · Etapa 2 — Catálogo Medusa-native (backend = fuente de verdad; `subscription_price` calculado; catálogo administrable sin código) |
| D24 | Fase 5 · Etapa 3 — Carrito real + checkout → **orden real** con pago manual (todo nativo) |
| D25 | Fase 5 · Auditoría de MVP + plan de cierre del flujo propio en 2 etapas (cuentas SÍ, moat diferido) |
| D26 | Fase 5 · Etapa A — **Cuentas y sesión reales** (auth nativo Medusa: registro/login/logout/recuperación + JWT persistente, `transferCart`, pedidos, direcciones) |
| D27 | Fase 5 · Infra — Frontend desplegado en **Vercel** (staging sin backend; monorepo verificado; `main`=prod provisional) → `DEPLOYMENT.md` |
| D28 | Fase 5 · Etapa B — **Tienda coherente y honesta** (buscador real, cross-sell real, regla única de envío del backend + promoción automática de envío gratis, auditoría de copy) → **flujo propio del MVP cerrado** |
| D29 | Fase 5 · Endurecimiento pre-lanzamiento (7 correcciones de bajo riesgo; suscripción atenuada `SUBSCRIPTIONS_ENABLED=false` → compra única) |
| D30 | **Infraestructura de producción EN VIVO** (2026-07-16) — backend Medusa en **Railway** (Postgres+Redis+volumen de archivos, build nativo, `PORT=9000`, secrets/CORS reales) + frontend en **Vercel** con dominio **`tumanada.cl`** (SSL) + seed de prod (6 productos, publishable key, promo envío gratis) + admin + **tracking GTM/GA4 en vivo**. Cierra la deuda de infra de D25/D27/D29 → `DEPLOYMENT.md` |
| D31 | Paridad logueado/no-logueado — `CategoryTiles` compartido + principio 9 de la Component Library |
| D32 | Funnel F4 — recomendación consultiva "El plan de {mascota}" (sobre estado local) |
| D33 | Integración O5 — funnel sobre catálogo real; muere `lib/data/catalog`; demo solo hero/styleguide |
| D34 | Backend — módulo custom `pet`: perfil de mascota persistido (`/store/pets`) + hidratación del provider |
| D35 | Backend — subscriber `order.placed`: anticipación anclada a la compra confirmada |
| D36 | Frontend — `ProductImage`: URL real del Admin vs emoji placeholder |
| D37 | Pet Experience B5 — edición real del perfil (`PetEditDialog` → PATCH persistido) |
| D38 | Consistencia perfil↔onboarding — salud con chips curados; regla "todo dato estructurado se edita con el patrón del funnel" |
| D39 | Comprar ≠ definir qué come — PDP e-commerce pura + toast-puente 1-tap + `FoodSelectorDialog` |
| D40 | Meta — refactorización documental por ownership (estado con dueño único; reglas anti-deuda) |
| D41 | Product Completion Pass — B4 foto (andamio local honesto) + B7 /cuenta manada-first + anticipación honesta ("Pedir de nuevo") + simplificación MVP (sin "Otro"/Marcas/Ofertas ni promesas de suscripción) |
| D42 | Home logueada = centro de control de la mascota — PetStatusCard (retrato + estado + línea de tiempo del saco + "Plan de {nombre}" con espacio reservado a suscripción) + recompra en dos taps + necesidades (PetActionGrid) + catálogo al final |
| D43 | Motor de recomendación defendible — cálculo nutricional RER/MER + densidad calórica (`kcal_per_kg`), puertas duras (nunca recomienda incompatible) vs. score de preferencia configurable, explicación verificada (sin afirmaciones no comprobadas). Determinístico, sin IA. Owner: `RECOMMENDATION_ENGINE.md` |
| D44 | Funnel F4 rediseñado — "carta de plan": el cierre del onboarding **decide, no persuade**. Desktop en 2 columnas que convierte altura en ancho; razones on-demand (disclosure "¿Por qué esta?"); anticipación comprimida con su lugar reservado a suscripción; **"ya come otra marca" = buscador inteligente** que rearma y GUARDA el plan (misma anticipación, sin empujar el cambio de marca). Solo presentación: sin tocar backend ni la tesis de `FUNNEL_TARGET §1.5` |
| D45 | Emails transaccionales — **Notification Module nativo de Medusa + provider Resend** (`apps/backend/src/modules/resend`) con un **sistema de plantillas React Email reutilizable** (layout + componentes comunes + registro central; branding Manada, responsive, `formatCLP`). 4 emails críticos cableados a eventos nativos: bienvenida (`customer.created`/`has_account`), reset (`auth.password_reset`), compra (`order.placed`), envío (`shipment.created`). Sin `RESEND_API_KEY` → modo DEV (loguea, no envía). Suscripción diferida (sin eventos aún). Cero cambios en frontend |
| D46 | SEO técnico + tracking del embudo — **GTM como único punto de integración**. SEO nativo Next: `robots.ts`, `sitemap.ts` (catálogo real, degrada con gracia), `opengraph-image` dinámico (OG/Twitter en todo el sitio), metadata + canonical en PDP/PLP, `noindex` en confirmación. Tracking: capa única `apps/web/src/lib/analytics` que empuja al `dataLayer` los **6 hitos del embudo** (`onboarding_start`, `recommendation_shown`, `add_to_cart`, `begin_checkout`, `purchase`, `subscription`) con esquema `ecommerce` de GA4; el código nunca habla con GA4/Meta/Ads (se conectan dentro de GTM). Env `NEXT_PUBLIC_GTM_ID`; sin ID no carga (dev limpio). Solo `apps/web` |
| D47 | Backoffice — Sección **Pets** en el Admin (explorador read-only: DataTable + admin API) + graduación de la relación Customer↔Pet a **Module Link nativo** (`defineLink` 1→N; se elimina la columna plana `customer_id`; drop prod-safe con 0 mascotas). Solo backend/admin; contrato `/store/pets` intacto |
| D48 | Storefront PDP multi-formato — **selector de variantes real** conectado al catálogo: `ProductVariant` + `variants` en el dominio (mapea todas las variantes, orden por precio), componente `VariantSelector` (solo con >1 variante; agotada = deshabilitada) y **ficha rediseñada al boceto** (nombre → descripción real → selector → cápsulas ración/duración → Compra única; la variante elegida deriva precio/$-kg/duración/`variantId`). Default en la variante primaria (formato recomendado). Suscripción sigue apagada (D29). Solo `apps/web`, sin tocar carrito/checkout/backend |
| D49 | Resend **EN VIVO** en producción — dominio `tumanada.cl` verificado + `RESEND_FROM=Manada <contacto@tumanada.cl>` (nombre visible del remitente) + `STOREFRONT_URL` al apex; cierra el pendiente de D45 (Vercel solo aporta DNS; el envío corre en Railway). Además, **CTA del email de bienvenida → `/cuenta/mascotas`**: la personalización "según la cuenta" vive en **tiempo de clic** (la web adapta: perfil vs. crear), no en el envío —en el funnel valor-primero la mascota aún no existe cuando se dispara `customer.created`. Solo config + `apps/backend` |
| D50 | Backoffice — Widget **"Formatos"** en la ficha de producto del Admin (`product.details.after`) + endpoint `POST /admin/products/:id/formats`: crear variantes/formatos **en un paso** (encapsula el flujo opción→valor→variante de Medusa v2 y **reemplaza la "Default variant"**); helper reutilizable `add-format.ts`, validación zod, ruta autenticada por Medusa. No reemplaza el editor nativo (casos multi-opción los rechaza con mensaje claro). Probado en local (7/7), pendiente deploy. Solo `apps/backend` |
| D51 | Storefront — cards **multi-formato** ("Varios formatos · desde" el más barato), **stock en cards solo como urgencia** (≤5 "¡Quedan X!" / 0 "Agotado", nada con stock normal), **"precio por kilo" reubicado** de tile suelta a **precio unitario** bajo el precio + **empujón "rinde más"** clickeable al formato de mejor $/kg, y **devoluciones honestas** (fuera "garantía de sabor"; nota "los alimentos abiertos no pueden devolverse"). Nota: las cards se diseñaron para packshots **PNG transparentes** (sobre Arena) → **revisado por D52**. Solo `apps/web` |
| D52 | Storefront — **packshots normalizados server-side**: route `/api/packshot` con `jimp` (JS puro; `sharp` no cargaba en la función serverless de Vercel) (aplana sobre blanco + recorta borde + re-encuadra a un cuadrado con margen uniforme, producto ~88 %) + `ProductImage` graduado a `next/image` con **loader custom**; pozos de media **en blanco**, sin padding por card. Encuadre y escala **consistentes** para asset **blanco o transparente** sin editar cada asset (reusable para todo producto futuro de Medusa); JPEG cacheado, `srcset` responsive, cero CLS. **Reemplaza** el "fix por asset" de D51 y cierra el render de la política de imágenes de D18. Solo `apps/web` (+dep `jimp`) |
| D53 | SEO & Tracking — **Meta Pixel** `1437594504862107` conectado **dentro de GTM** (honra D46: **sin código**, sin env var —`NEXT_PUBLIC_META_PIXEL_ID` no se usa) vía **import de contenedor** (Combinar, GA4 intacto): pixel base + `PageView` en All Pages + 4 tags de conversión (Custom HTML) que traducen el `dataLayer` ecommerce a eventos estándar de Meta —`add_to_cart→AddToCart`, `begin_checkout→InitiateCheckout`, `purchase→Purchase`, `recommendation_shown→ViewContent`. Completa el pendiente Meta de D46/D30. Artefacto: `ai-context/assets/gtm-meta-pixel-container.json`. Sin `apps/*` |
| D54 | UX — Rescate selectivo de `cristobal-cambios`: **onboarding de alta a 2 pasos** (`755803c`) + **`/cuenta` con tabs** (`b4684d9`) que separa el **perfil del humano** (Mi perfil: nombre/email/RUT) del perfil de mascota. Reimplementado sobre `main` (no merge/cherry-pick), honesto. **Descarta:** matar el Dashboard (D42), "Suscripciones Activas"/Servicios falsos, flip `SUBSCRIPTIONS_ENABLED`, andamiaje Replit, hacks de tipos. **No reabre D42/D29/D39.** Bloque 3 (suscripción-PDP) + lanzamiento de suscripciones → chat dedicado |
| D55 | 🟢 Pivote estratégico — **se construye el moat de SUSCRIPCIÓN RECURRENTE ahora**, reabriendo el diferimiento de D22 y la atenuación de D29 (solo para suscripción). **Por capas de riesgo creciente:** Punto 1 = modelo `subscription` + creación al checkout con **pago simulado/manual** (cero dinero) → scheduler → gestión en `/cuenta` → **pago recurrente real (go aparte)** → fallos+emails. UX: **card "Plan Manada" como patrón único** (se retira `SubscriptionBox`). Mantiene el pago manual de D24 hasta el Bloque 4; módulo custom `subscription` espejo de `pet`, contrato primero; se apoya en `payment-method`/`saved_card` y Resend. No reabre D42/D39 |
| D56 | 🟢 UX — **reencuadre a servicio de suscripción**: suscripción = estado por defecto en suscribibles / compra única = salida secundaria; **una sola lógica de datos** compra-única↔suscripción; Home + "Mi mascota" evolucionan por estado; gestión vía una Sheet reusada Home+/cuenta; post-suscribir = hoja de confirmación (no salto al carrito). Alcance: reuso máx, mín pantallas/rutas, evitar backend si el front basta, cada bloque funcional, responsive-first, evolucionar no rediseñar. Plan A→B→C→D **COMPLETO** (refinamiento UX en chat aparte): A = `PlanManadaCard` controlada 100% reactiva + catálogo invierte CTAs; B = hoja de confirmación post-suscribir (`SubscribeFlowProvider` reusando el `Dialog`); C = Home/`PetStatusCard` evoluciona por estado (`SubscriptionProvider`); D = gestión (`PlanManageSheet` reusada Home+/cuenta + `PATCH /store/subscriptions/:id`). No reabre D42/D39 |
| D57 | 🟢 UX — **refinamiento del servicio de suscripción (R1–R4, frontend puro y validado)**: R1 la Home trata el plan **pausado** como plan (selector `subscriptionForProduct`; CTA "Reanudar plan" abre la Sheet, ya no invita a la PDP); R2 **confirmaciones** antes de Pausar/Saltar (`ConfirmInline`); R3 **reanudar** con momento de éxito in-sheet (reusa `Dialog`+motion, copy honesto); R4 Home con plan activo = **"Tarjeta miembro" Pino+Oro** vía scope `[data-premium]` (remapea solo tokens de texto/acento) + CTA dorado + nombre en Oro + ahorro explícito. R5 (backend) = **eventos de dominio** `subscription.created/paused/resumed/cancelled/skipped` (primer patrón de eventos propios) + **5 correos de ciclo** sobre Resend, honestos (sin prometer cobro/despacho automático). **Frente D57 COMPLETO** (R5 verificado con `medusa build`, pendiente deploy). No reabre D42/D39/D55 |
| D58 | 🟢 Pago — **integración completa con Flow** (`developers.flow.cl/api`), reemplaza el pago manual de D24. Módulo custom `flow-payment` + `lib/flow.ts` (firma **HMAC-SHA256**, `payment/create` con `paymentMethod:9` = todos los medios, `getStatus`) + `lib/flow-settle.ts` idempotente. **Difiere la creación de la orden hasta que Flow confirma el pago** (webhook `urlConfirmation` + `payment/getStatus`) → correos/suscripción/anticipación solo con pago verificado, **sin tocar subscribers**; idempotencia por el registro `flow_payment` + el lock de `completeCartWorkflow`. Endpoints `POST /store/carts/:id/flow-payment` + `POST /flow/confirmation` + `POST\|GET /flow/return`. Frontend mínimo (Flow como medio, confirmación consciente de estado, snapshot de analítica). Config por env (`FLOW_API_KEY`/`FLOW_SECRET_KEY`/`FLOW_API_URL`). Verificado con `medusa build`+`tsc`+migración+firma; E2E sandbox + deploy pendientes. No reabre D35/D45/D55 |
| D59 | 🔒 Performance — **cacheo ISR del catálogo** (Home/PLP/PDP `revalidate=300`) + dedup con `React.cache`. `force-dynamic` dejaba el catálogo sin caché (round-trip a Railway por visita). Hallazgo clave: `revalidate` solo **no basta** —el `fetch` sin cachear del SDK de Medusa fuerza render dinámico en Next 16—; se cachea el **resultado** con `unstable_cache` en un módulo `server-only` (`lib/medusa/catalog-cache.ts`; los originales quedan intactos para carrito/checkout **en vivo**) + `generateStaticParams []` para activar ISR en los `[slug]`. Verificado en `next start` (MISS→HIT, `s-maxage=300, stale-while-revalidate`); carrito/checkout validan precio/stock en tiempo real → el desfase (≤5 min) solo afecta datos cosméticos. `tags:['catalog']` deja lista la invalidación on-demand futura. Solo `apps/web`, sin tocar backend ni comportamiento funcional |
| D60 | 🔒 Merchandising — **vitrinas destacadas por metadata** (`featured_landing` / `featured_recommendation`), curables desde el Admin, con **fallback exacto** al orden de catálogo anterior; `featured_recommendation` prioriza **dentro de lo ya elegible** por especie/categoría (no salta las puertas duras de D43). Solo `apps/web` + doc, sin backend nuevo |
| D61 | 🔒 Navegación — **menú único de identidad** en el header (`components/pet/account-menu.tsx`, Radix) que separa "Tu mascota" (perfil canónico `/cuenta/mascotas`) de "Tu cuenta" (`/cuenta`). Nace de feedback de Carlos: el `PetSwitcher` con **nombre navegable** + un ícono de usuario suelto hacían leer el nombre de la mascota como "mi perfil". Trigger = **cara de la mascota sin nombre en la barra** + chevron; cubre autenticado/invitado × 0/1/≥2 mascotas. El **logo se mantiene = Inicio**; el perfil de mascota se confirma **canónico único**. Elimina `pet-switcher.tsx`; NO reabre D42/D54 ni toca backend. Verificado `tsc`+`eslint`+`next build` 27/27 + smoke HTTP; aprobado por Carlos |
| D62 | 🟢 Funnel F4 — pantalla de recomendación **reconciliada**: adopta el **diseño validado de `cristobal-cambios`** (columna angosta mobile-first, cierre con check de éxito + ración como prueba, **tarjeta destacada** con banda de color + badges de formato/duración, **alternativas en línea**) **sobre la suscripción real de `main`**. La tarjeta de Cristóbal se construyó sobre el **recordatorio proxy de D29** (su HEAD es anterior a D55–D58); copiarla tal cual habría **revertido el moat** y el manejo de estado → se reconcilió (validado con Carlos): diseño de Cristóbal + `PlanManadaCard` (patrón único, D56) + compra única + **aviso de sobrepeso** + **funnel unificado** (→`/carrito`) + **guard de hidratación**; **responsive corregido** a una sola columna sin overflow móvil. Solo `apps/web` (un archivo); NO toca recomendador/cálculos RER-MER/contratos/APIs/estado; supersede la **presentación** de D44 (no su tesis §1.5). Verificado `tsc`+`eslint` + smoke Playwright 16/16 (3 escenarios); pendiente validación visual de Carlos |
| D63 | 🟢 Recomendador/onboarding — **catálogo OFICIAL de razas** (81 perros + 32 gatos), fuente única `lib/breeds.ts` con "Mestizo / Sin raza definida" + texto libre. Riesgo levantado y despejado: **la raza NO entra al motor** (auditado + verificado: 4 razas → misma ración) → reemplazo inocuo. `pesoRangoAdulto` (rangos AKC/FCI de Carlos) alimenta solo la estimación de peso F3 con fallback a buckets. **Aviso de sobrepeso** advisory (`overweightSignal`, >+15% del máx típico, exime robustas/esbeltas) — no toca el cálculo. NO reabre D43; no toca contratos ni compat. Verificado `tsc`+`eslint`+smoke |
| D64 | 🟢 Suscripción — **frecuencia por defecto 4 semanas** en PDP + recomendación (reemplaza el default "natural" de D55; la elección del usuario se conserva). Solo `apps/web` |
| D65 | 🟢 Funnel F5 — **cuenta post-checkout auto-provisionada + email de contraseña DIFERIDO ~2 h**: resuelve el "momento de registro" (§1.6, alternativa valor-primero). Job programado (no `order.placed`) porque el token de reset vence a 15 min → se genera al enviarse, sin competir con la confirmación. Mecánica nativa "claimable" de Medusa; aislado, idempotente, no bloqueante, **GATEADO `AUTO_ACCOUNT_ENABLED=false`** hasta E2E. `medusa build` OK; pendiente E2E en staging + copy de registro para correo ya creado |
| D66 | 🟢 Performance del catálogo — **optimizer nativo de Next** para packshots (reemplaza el loader custom de D52): `ProductImage` usa `packshotSrc` (una URL base por producto, `/api/packshot?…&w=1440`, **JPEG q90 base**) y `next/image` hace `srcset` responsive + **AVIF/WebP** → imagen de card @640 **−81 %** (56.6 KB JPEG → 10.9 KB AVIF, medido en `next start`). **`priority` LCP** en la 1ª fila (4 cards eager+preload, solo 1ª página; búsqueda 4). Config `formats`/`localPatterns`/`remotePatterns`. **`sharp` reintroducido** en `apps/web` — pero por el optimizer nativo (Vercel lo provee), **no** el import en ruta que falló en D52 (el normalizador sigue con `jimp`). Descarta el prefetch "estilo Spotify" (no es patrón real; datos ya en cliente + packshot `immutable`). Evoluciona D52, extiende D59. Solo `apps/web` (+dep `sharp`) |
| D67 | 🟢 Catálogo — **carga masiva v3** (89 productos de alimento / 172 variantes, **publicados en prod**, 7 marcas nuevas) + dos endurecimientos: (a) el importador acepta **multi-etapa/multi-especie** (`metadata.stage`/`species` como array coma-separado) y **N `category_ids`**, compat con valor único (el front ya modelaba `stage[]` + filtra con `.includes()`; categoría multi-valor queda preparada, el storefront usa la 1ª como primaria); (b) **fix de raíz del `ERR_PNPM_FETCH_429` del build de Railway** — `medusa build` deja `.medusa/server` con un `package.json` **sin lockfile** → el 2º `pnpm install` re-resolvía rangos y golpeaba el registry; se elimina y se reemplaza por un **symlink** al `node_modules` del workspace (Node resuelve hacia arriba; `@medusajs` hoisted) → **cero registry en el build, 429 imposible**. Verificado local + **deploy verde en prod**. Docs: `DATABASE.md §5`, `DEPLOYMENT.md §4.3` |
| D69 | 🟢 Buscador — **relevancia propia** sobre el catálogo cacheado, reemplaza el `q` nativo de D28. `q` no veía la marca (vive en `metadata`; 21 % del catálogo no la lleva en el título), exigía **todos** los términos ("acana cachorro" → cero resultados: el producto se llama "Acana Puppy") y no ignoraba tildes. Motor en `lib/search` (dueño único): léxico ES↔EN **jerárquico** (`salmón ⊂ pescado`, expandido solo en el producto), ranking por **cobertura**, **degradación** exacto→marca→concepto→parecidos→destacados —nunca una pantalla vacía—, corrector Damerau-Levenshtein que solo se adopta si mejora el resultado, y **autocompletado** `/api/buscar` (< 2 KB, debounce 140 ms, ARIA combobox) que muestra productos desde 2 caracteres sin pulsar Enter. Sin motor externo y **sin llamadas nuevas al backend**; 0,05–0,13 ms por búsqueda. Elimina `searchProducts()` |
| D75 | 🟢 Analytics — **el Cart ES el "purchase intent"**: se descarta crear una entidad espejo (Draft Order / Purchase Intent) y se le suma el sidecar `cart-funnel`. Hallazgo que da vuelta el problema: el dato ya estaba — el carrito nace **perezosamente en el primer add-to-cart**, **nunca se borra**, quitar una línea es **soft delete** (el histórico de productos abandonados ya existía) y `order_cart` ya unía carrito↔orden: **5 de 6 preguntas de negocio se podían responder con SQL**. Solo faltaba identidad anónima del invitado, etapa explícita, último movimiento real e índices. Punto arquitectónico: un **proyector idempotente** que los subscribers solo disparan — no hooks (verificado: agregar/cambiar/quitar línea **no exponen hook posterior**, y un hook corre **dentro de la transacción**), no middleware (la conversión no pasa por una ruta de store). Deriva en vez de acumular → inmune a *at-least-once*, auto-reparable y reutilizable por el backfill. **100 % aditivo y retroactivo**; sin Admin ni remarketing en el MVP. Verificado: backfill 34/34, cruce contra las 13 órdenes reales, idempotencia, y arnés de regresión 20/20 (promociones, stock reservado y liberado, orden, subscribers previos intactos) |
| D78 | 🟢 Backoffice — **sección "Carritos"** en el Admin, la Etapa 4 que D75 había dejado fuera. Se levanta al verificar un hecho que explica todo el frente: **el Admin de Medusa v2 no tiene sección de carritos** (solo `/orders`, `/customers`, `/promotions`), así que lo previo a la Order nunca fue visible — esa ausencia ES el problema de negocio. `GET /admin/cart-funnel` + página con el patrón de Suscripciones (D59). **Cero escrituras.** La lista sale del snapshot (ordenar/paginar sin tocar el carrito) y el contenido se lee EN VIVO del Cart, que sigue siendo su único dueño; "abandonado" se deriva en la consulta con ventana configurable. Verificado en vivo: 34 carritos con producto, 44,1 % de conversión, filtros por etapa y abandono exactos. El remarketing sigue fuera |
| D79 | 🟢 Checkout — **el correo se persiste al escribirlo, no al pagar**. `setCheckoutInfo` solo corría dentro de `submitPayment`, así que quien dejaba su mail y abandonaba quedaba anónimo y `identified` significaba "llenó todo el formulario", no "llegó al checkout": el segmento más accionable para recuperar era el peor medido. Se levanta la regla de no tocar el checkout porque el costo no era una métrica pobre sino un segmento invisible. Guarda clave: `updateCartWorkflow` toma un lock de 2 s sobre el carrito, así que `submitPayment` **espera** la escritura del blur antes de tocarlo — sin eso, escribir el mail y pagar de inmediato podía agotar el timeout y tumbar el pago. Best-effort de punta a punta: perder una medición nunca puede costar una venta. Verificado 15/15 reproduciendo el caso peor (correo + pago inmediato), con stock reservado/liberado y RUT y dirección intactos. Solo `apps/web` |
| D80 | 🟢 Legal — **política de privacidad al estándar de la Ley 21.719** (vigente el 1-dic-2026) y buzón único **`contacto@tumanada.cl`**. La política databa del 29-06 y no declaraba nada de lo que entró a producción después: Flow, Resend, GTM/GA4, Meta Pixel, perfil de mascota persistido, suscripción y el `visitor_id` del funnel — cierra el pendiente que D75 se había auto-impuesto. Estructura del art. 14 ter: finalidades **con base de licitud**, destinatarios, transferencia internacional (Vercel/Railway fuera de Chile), plazos de conservación y derechos **ARCOP + bloqueo** con plazo de 30 días. Dos hallazgos incómodos: el alias `privacidad@` al que la página mandaba **nunca existió** (derecho de acceso inejercitable) y se prometía eliminar la cuenta desde la cuenta, función inexistente. Deudas declaradas, no maquilladas: **falta banner de consentimiento de cookies** (exigido por la 21.719 para medición y publicidad), no hay autoservicio de borrado y falta razón social/RUT/domicilio. Solo `apps/web` |
| D81 | 🟢 Despacho — **se retira "despacho honesto" del front y la regla de envío pasa a tener DOS ramas**, verdadera desde la primera compra. El rótulo nombraba la virtud en vez de explicar la regla; al revisarlo apareció que la frase que se quería comunicar **era falsa justo donde más importa**: las renovaciones ya salían sin despacho (por omisión — el cargo recurrente es `agreed_unit_price × quantity`), pero la **1ª compra suscrita SÍ cobraba** $3.990 bajo el umbral, o sea el beneficio existía en todas las entregas menos en la única que el comprador ve antes de decidir. Carlos elige hacerlo verdad desde el primer pedido: **con suscripción, gratis siempre sin mínimo**; **compra única, gratis sobre $30.000**. Se aplica **nativo** con una 2ª promoción automática `ENVIO_GRATIS_SUSCRIPCION`, cuya regla usa el operador **`in` y no `eq`** — `eq` exige que TODAS las líneas cumplan y el carrito mixto habría perdido el beneficio en silencio. El contrato gana `subscription_free_shipping`, que **degrada a `false`** si el backend desplegado no lo envía: nunca se anuncia un beneficio que no se aplicaría al cobrar. Nace `lib/shipping-copy.ts` como dueño único del texto (se contaba distinto en 6 pantallas). **NO está en vivo**: requiere desplegar backend + correr `setup-free-shipping.ts` |
| D77 | 🟢 Perfil de mascota — **el espejo de invitado caduca a las 24 h**. `localStorage["manada.guest_pets"]` (D34) no tenía TTL: una mascota creada sin cuenta quedaba en el dispositivo **para siempre**, porque las dos únicas rutas de limpieza (autenticarse o cerrar sesión) exigen una transición de sesión que un invitado **nunca cruza**. Auditadas las 15 capas de persistencia (cookies, IndexedDB, Cache API, Service Worker, React Query/SWR/Zustand/Redux **no existen** en el proyecto; el backend rechaza mascotas sin auth), es la ÚNICA que explica el síntoma. TTL **absoluto desde la creación, no deslizante**: el sello se arrastra entre escrituras porque la hidratación misma reescribe el espejo — refrescarlo en cada guardado lo habría vuelto eterno para cualquier visitante recurrente, o sea el síntoma reportado. Snapshots previos (sin `savedAt`) = vencidos → auto-limpieza en la primera carga, sin migración. Al caducar borra también las fotos `local_…` huérfanas. Solo `apps/web` (un archivo); NO cambia la migración/adopción de D34 |

## 17. Pendientes

Ver `CURRENT_STATE.md` (frentes abiertos) y `TODO.md` (detalle táctico). **Operativos de marca (no bloquean):** registrar `tumanada.cl` + handles, verificar marca en INAPI, vectorizar logo.

## 18. Roadmap

Ver `ROADMAP.md` (fases 0–8 y su estado).

## 19. Prompts importantes

Ver `PROMPTS.md` (prompts operativos vivos; los de fases cerradas están en `history/07`).
