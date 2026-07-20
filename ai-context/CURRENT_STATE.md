# CURRENT STATE — Dónde estamos AHORA

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Foto del estado actual: qué es real, qué frentes están abiertos y cuál es el siguiente paso. Se **reescribe** al cerrar cada hito (no se apila; la narración histórica vive en `DECISIONS.md`). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-20 |
> | **Depends On** | DECISIONS.md, ROADMAP.md |
> | **Supersedes** | `history/05-bitacora-avances-2026-07.md` (versión-bitácora archivada) |
> | **Source of Truth** | ✅ del *estado actual y el siguiente paso*. Único dueño del estado: ningún otro doc lo repite. |

## Fase activa

**Fase 5 — MVP (D22, MVP-first)**, en su tramo final, con dos realidades en paralelo:

1. **El flujo propio del MVP está CERRADO y endurecido** (D23–D29): catálogo, carrito, checkout→orden con pago manual, cuentas/sesión, buscador y regla de envío — todo real sobre Medusa v2, sin datos demo en ningún flujo real (D33). La suscripción se vende como **compra única** (`SUBSCRIPTIONS_ENABLED=false`, D29).
2. **El "moat diferido" de D22 quedó parcialmente superado:** el **perfil de mascota ya es real y persistido** — módulo custom `pet` en el backend (D34), anticipación anclada a la compra (D35), edición real (D37/D38) y separación comprar≠definir-qué-come (D39). Lo que sigue diferido post-tracción es la **suscripción recurrente** y el motor de anticipación completo.

**Etapa vigente declarada por Carlos (D38):** prioridad a **consistencia visual, UX y sensación de producto terminado** por sobre agregar capacidades. El backend está consolidado.

## ✅ Infraestructura de producción — EN VIVO (2026-07-16, D30)

> **La tienda está pública y operativa.** Backend Medusa en **Railway** + frontend Next.js en **Vercel** con dominio propio. Cierra la deuda de infra de D25/D27/D29 (topología acordada: un solo servicio `shared`, build nativo pnpm sin Docker).

- **Backend:** `https://manadabackend-production.up.railway.app` — Railway (proyecto `creative-creation`, servicio `@manada/backend`). `/health` 200 · **Postgres + Redis** gestionados · **volumen** `@manada/backend-volume` en `/app/apps/backend/.medusa/server/static` (packshots persisten, sin S3). Build por `railway.json` (nativo, migraciones en `preDeployCommand`). Vars reales: `NODE_ENV=production`, `PORT=9000` (fix de un 502: Medusa quedaba en 8080), secrets aleatorios, CORS con `tumanada.cl`+`www`+vercel, `MEDUSA_BACKEND_URL`, `MEDUSA_WORKER_MODE=shared`.
- **Datos de prod (seed corrido una vez):** región Chile/CLP, sales channel, **publishable key** `pk_0fe6…`, 6 productos con precio, 2 opciones de envío, promo `ENVIO_GRATIS_30K` (gratis ≥ $30.000). **Admin:** `.../app` (carlosvaldes1996@gmail.com).
- **Frontend:** en vivo en **`https://www.tumanada.cl`** (apex → 308 a `www`, canónico), SSL OK, catálogo real hidratando, CORS OK. Vercel `manada-web` con las 2 env vars de prod.
- **Tracking (D46) en vivo:** GTM `GTM-P5RLWHJW` + GA4 `G-1JQM28SLWW` conectada dentro de GTM (6 eventos mapeados, publicado, verificado en Tiempo real). Se corrigió un `\n` colado en `NEXT_PUBLIC_GTM_ID` (limpiado en Vercel + guard `.trim()` en `lib/analytics/config.ts`).
- **Emails transaccionales (D45/D49) EN VIVO:** Resend con dominio `tumanada.cl` verificado + `RESEND_FROM=Manada <contacto@tumanada.cl>` + `STOREFRONT_URL=https://tumanada.cl` en Railway → envío real (bienvenida verificada punta a punta). El CTA de bienvenida lleva a `/cuenta/mascotas` (adapta en tiempo de clic). Vercel solo aporta DNS; el envío corre en el backend.
- **Pendiente (no bloquea, fast-follow):** **packshots** por Admin (hoy emoji) · **Search Console** (verificar con GTM + enviar sitemap) · **Mercado Pago** (post-lanzamiento). Detalle y runbook con resultados: `DEPLOYMENT.md`.

## Qué está construido y es real (fuentes de verdad)

- **Backend Medusa v2** (`apps/backend`, 2.16.0): catálogo administrable + `subscription_price` calculado (D23) · carrito/checkout→orden con pago manual (D24) · auth de cliente + direcciones + pedidos (D26) · buscador `q` + regla única de envío `/store/shipping-policy` (D28) · **módulo custom `pet`** `/store/pets` (D34) + subscriber `order.placed` (D35) + **emails transaccionales** (D45): Notification Module nativo + provider Resend (`src/modules/resend`) con 4 emails críticos (bienvenida, reset, compra, envío) sobre un layout/componentes reutilizables; **EN VIVO en producción (D49)** con dominio verificado y remitente propio (modo DEV local sigue logueando sin API key). Contratos: `API.md §5–§9` + email en `API.md` · modelo: `DATABASE.md §5–§8` · setup local: `apps/backend/DEV.md`.
- **Frontend Next.js** (`apps/web`): 100% sobre el backend real; datos demo solo en el hero de la landing (decisión de marca, D28) y el styleguide `/dev/*` (gateado en prod, D29). Arquitectura: `FRONTEND_ARCHITECTURE.md` · componentes: `COMPONENT_LIBRARY.md`.
- **PDP multi-formato (D48):** la ficha de producto conecta el **selector de formato/talla a las variantes reales** del catálogo (`VariantSelector`; ej. `royal-canin-mini-puppy` con 1/3/7.5 kg) — precio, $/kg, duración y `variantId` de carrito derivan de la variante elegida (default = primaria = formato recomendado). Los productos de una sola variante no muestran selector. Ficha rediseñada al boceto (nombre → descripción real → selector → cápsulas → Compra única). Suscripción sigue apagada (D29). Doc: `COMPONENT_LIBRARY §5`. **Aparte:** existe una **preview de diseño OCULTA** de la card "Plan Manada" (`plan-manada-preview.tsx`, gate `SHOW_PLAN_MANADA_PREVIEW=false`, CTA inerte) — material aprobado por Carlos para el bloque de suscripción futuro; no cambia comportamiento.
- **Catálogo multi-formato — carga (D50) + storefront (D51):** el Admin tiene un **widget "Formatos"** en la ficha de producto (`POST /admin/products/:id/formats`) que crea variantes en un paso —encapsula el flujo opción→valor→variante de Medusa v2 y reemplaza la "Default variant"— con lo que se cargó el **primer producto real** (Amity, 4/14 kg). En el storefront (D51), las cards con varios formatos muestran **"Varios formatos · desde"** el más barato, el **stock** aparece en la card solo como urgencia (≤5/agotado), el **"precio por kilo"** pasó a precio unitario bajo el precio + empujón "rinde más" al formato grande, y las **devoluciones** son honestas (fuera la "garantía de sabor"; los alimentos abiertos no se devuelven). Docs: `API.md §12`, `COMPONENT_LIBRARY`. **D50 probado en local, pendiente deploy a Railway.**
- **Funnel de adquisición** F1–F4 ✅ sobre catálogo real (O5, D33) — doc: `FUNNEL_TARGET.md`. **F4 rediseñado (D44, commit `d274925`): "carta de plan" en 2 columnas (altura→ancho), razones on-demand, anticipación comprimida con lugar reservado a suscripción, y "ya come otra marca" como buscador inteligente que rearma/GUARDA el plan. Solo presentación (sin tocar backend); smoke visual en vivo pendiente.** La recomendación (F4) corre sobre el **motor defendible** (D43): cálculo nutricional RER/MER + densidad calórica, puertas duras (nunca recomienda incompatible) vs. score de preferencia, explicación verificada. Determinístico, sin IA — doc: `RECOMMENDATION_ENGINE.md`.
- **Pet Experience** B1–B8 ✅ COMPLETA (B4 foto con andamio local honesto + B7 /cuenta manada-first cerrados en el Product Completion Pass, D41; B5/B6 persistidos vía `/store/pets`; **B8 Home logueada = centro de control**, D42: `PetStatusCard` con retrato + línea de tiempo del saco + "Plan de {nombre}" + recompra en dos taps + necesidades) — doc: `PET_EXPERIENCE_TARGET.md`. **Anticipación honesta** (D41): la cápsula invita a "Pedir de nuevo"; el reagendo/suscripción vuelven post-tracción.
- **Deploy (D30):** EN VIVO — backend en Railway (`manadabackend-production.up.railway.app`) + frontend en Vercel con dominio **`www.tumanada.cl`** (SSL). Doc: `DEPLOYMENT.md` (§0 estado + §4.1 runbook).

## Frentes abiertos (en paralelo, cada uno en su chat/bloque)

| Frente | Estado | Siguiente acción | Referencia |
|---|---|---|---|
| **Infra de producción** | 🟢 **EN VIVO** (D30) | Backend Railway + frontend Vercel + `tumanada.cl` operativos. Fast-follow: Resend, packshots, Search Console | D30 · `DEPLOYMENT.md` |
| **Terceros** | 🟢 email + Resend **EN VIVO** (D49) · Mercado Pago ⬜ | Emails reales: dominio verificado + `RESEND_FROM` con nombre + `STOREFRONT_URL` apex en Railway (bienvenida verificada E2E). Siguiente: Mercado Pago Checkout Pro (post-lanzamiento) | D45 · D49 · D30 |
| **SEO & Tracking** | 🟢 **EN VIVO** (D46/D30): GTM+GA4 midiendo en Tiempo real | Falta **Search Console** (verificar `tumanada.cl` con GTM + enviar sitemap) y, si hay campañas, Meta Pixel/Ads dentro de GTM. Menor: base canónica del sitemap (`tumanada.cl` vs `www`) | D46 · D30 |
| **Funnel F5 — momento de registro** | ⬜ empieza por **decisión de producto**, no por código | Decidir con Carlos dónde vive la captura de cuenta | `FUNNEL_TARGET.md §1.6` |
| **Validación UI del Completion Pass (D41)** | ⬜ implementado, sin smoke manual | Carlos recorre: foto de mascota, /cuenta, /comenzar móvil, landing (el dashboard ya fue rediseñado y validado en D42) | D41 |
| **Smoke en vivo del rediseño F4 (D44)** | ⬜ commiteado/pusheado, aprobado en revisión; sin smoke en vivo | Recorrer con backend levantado: Sumar → carrito Medusa · "ya come otra marca" → buscador → Guardar (PATCH `current_food_id`) · layout 2 columnas desktop/mobile | D44 · `FUNNEL_TARGET.md` |
| **Backoffice — carga de catálogo (D50)** | 🟢 widget "Formatos" implementado y **probado en local** | **Deploy a Railway** (el widget va en el build del Admin) + smoke en el Admin de prod; ya se cargó el **primer producto real** (Amity, 2 formatos) | D50 · `API.md §12` |
| **Packshots de producto** | ⬜ **el hueco visual crítico**: los productos muestran emoji | Conseguir packshots **PNG transparentes recortados** (marcas) + cama Manada → subir vía Admin. La card se diseñó **sobre Arena**: una foto de fondo blanco se ve como caja (D51) | `public/fotos/README.md` §Pendientes |
| **Foto de mascota → blob definitivo** | ⬜ hoy andamio local (localStorage) | Con la estrategia de storage app-wide: swap interno de `setPetPhoto` + PATCH `avatar_url` | D41 · `API.md §9` |
| **Post-tracción** | ⬜ diferido | Suscripción recurrente (moat), SII, courier, WhatsApp, Webpay | D21/D22 |

## Claves del código (para no re-derivar)

- **Capa Medusa del front:** `apps/web/src/lib/medusa/` — `client.ts` (SDK, JWT en localStorage/SSR nostore) · `products.ts`/`map-product.ts` (catálogo; `SUBSCRIPTIONS_ENABLED`) · `cart.ts` · `checkout.ts` · `auth.ts`/`account.ts` · `shipping.ts` · `pets.ts` (mapper `StorePet→Pet`).
- **Providers:** `components/providers/` — `session-provider` (sesión JWT persistente) · `pet-provider` (hidrata `/store/pets` al login, empuja mascotas de invitado, `updatePet`/`assignFood` optimistas) · `cart-provider` (cart_id en localStorage). Coordinador: `hooks/use-auth-actions.ts` (login/registro/logout + `transferCart`).
- **Backend custom:** `apps/backend/src/modules/pet` · `src/api/store/pets` (+ validators zod) · `src/subscribers/{password-reset,food-purchased}.ts` · `src/api/middlewares.ts` (`subscription_price`) · `src/lib/shipping.ts` + `src/scripts/{seed,setup-free-shipping}.ts`.
- **Funnel/perfil:** `app/comenzar/*` (wizard + recomendación server-hydrated) · `lib/recommend.ts` (puro, recibe `products`) · `lib/anticipation.ts` · `app/(tienda)/cuenta/mascotas/*` + `components/pet/{pet-edit-dialog,food-selector-dialog,pet-tag}.tsx`.
- **Home logueada (D42):** `app/dashboard-view.tsx` (centro de control) · `components/pet/{pet-status-card,pet-action-grid}.tsx` · `components/commerce/quick-buy-card.tsx`.
- ⚠️ Antes de tocar `apps/web`: leer `apps/web/AGENTS.md` + docs de Next 16 en `node_modules/next/dist/docs` (cambios de ruptura). Component-system-first: mapear a tipos/componentes existentes, no reescribir.

## Modo de trabajo vigente

- **Bloques pequeños:** un bloque → validado por Carlos → un commit. **Frontend primero; la integración backend es una pasada separada** (regla de oro de FUNNEL/PET_EXPERIENCE).
- **Todo dato estructurado se edita con el mismo patrón del funnel** (chips/selector/buscador, nunca texto libre) — regla vinculante D38.
- **Comprar ≠ definir qué come** (D39): la tienda vende; el perfil define; el puente es explícito (toast de un tap).
- En decisiones no estratégicas: tomar la opción claramente superior y documentar rationale; las estratégicas esperan a Carlos.
- Al cerrar un hito: seguir el barrido de punteros de `PROJECT_HEALTH_REPORT.md §5` (CURRENT_STATE se reescribe, no se apila).
