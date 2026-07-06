# CURRENT STATE — Dónde estamos AHORA

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Foto del estado actual del proyecto y desde dónde continuar. Lo primero que se actualiza cada sesión. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-06 |
> | **Depends On** | DECISIONS.md, ROADMAP.md, AUDIT_UI_UX.md |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ del *estado actual y el siguiente paso*. |

> *Actualizado: 2026-07-06 (**D20: estructura física ✅** — monorepo pnpm `apps/` + reglas arquitectónicas · **D21: stack backend ✅ Medusa.js v2** + principio "e-commerce primero"; Fase 4 en curso)*

## Fase activa
**Fase 4 — Arquitectura técnica (en curso).** Segundo hito ✅ **D21 (2026-07-06): stack backend = Medusa.js v2** en `apps/backend`, bajo el **principio de producto "e-commerce primero"** (perfil/suscripciones/recomendaciones/anticipación mejoran la compra; no somos plataforma de gestión de mascotas) y los criterios de Carlos: velocidad de MVP · simplicidad para fundador único · bajo mantenimiento · escalar sin sobreingeniería. El moat se construye como **módulos custom** (`pet-profile`, `subscription`, `anticipation`) sin fork del core; Webpay será payment provider custom. Primer hito ✅ **D20 (2026-07-06): estructura física del repositorio** — monorepo pnpm workspaces; el frontend se movió intacto de `web/` a **`apps/web`** (`@manada/web`), **`apps/backend` queda reservado** (`src/` + `docs/` + README, sin código hasta validar stack) y `packages/shared` **no se crea** hasta el primer contrato compartido aprobado en `API.md`. **Reglas arquitectónicas permanentes en `ARCHITECTURE.md §2`** (web sin lógica de negocio ni DB; backend solo en `apps/backend`; comunicación solo vía `API.md`; contrato primero, código después; nuevas apps/paquetes solo con aprobación). Fases 0–2 ✅ completas. **Fase 3 funcionalmente completa** (etapas 1–3 ✅ + Polish lote 1 ✅); el **Polish 3.4 restante queda ⏸ en pausa** (D19): su track fotográfico está bloqueado por assets (U090) y varios ítems necesitan datos reales que recién existirán con backend.

## Último avance
- ✅ **Fase 1 (Identidad de marca)** completa (D8·D9·D10·D11): nombre **Manada · `tumanada.cl`**, dirección visual, logo "huella-manada" y **Brand & Visual Design System** completo (DESIGN_SYSTEM.md).
- ✅ **Fase 2 (UX)** completa: arquitectura de información, journeys, wireframes (UX.md) + **prototipo HTML estático** (`prototype/`, 6 páginas con chrome en Web Components) + **plan del sistema de componentes** (D12 → FRONTEND_ARCHITECTURE.md).
- ✅ **Fase 3 · Etapa 1 — Fundaciones (D13):** scaffold Next.js en **`web/`**. Estructura, routing, providers, design tokens, tema y tipografías listos y verificados (build + type-check + lint + smoke-test en verde).
- ✅ **Auditoría crítica de UI/UX → backlog priorizado (D14):** `AUDIT_UI_UX.md` (108 ítems `U001`–`U122`). **Fuente de verdad de mejoras de frontend.**
- ✅ **Fase 3 · Etapa 2 — Component Library (D15):** **librería completa de ~70 componentes reutilizables** en `components/{ui,layout,commerce,pet}` + `hooks/` + `lib/`, documentada en **COMPONENT_LIBRARY.md** y con **styleguide navegable en `/dev/components`**. Resuelve los 3 P0 de Fase 3.2 de AUDIT_UI_UX.md (+ mayoría de P1). `tsc` + `eslint` + `next build` (10 rutas) + smoke-test HTTP 200 ✅.
- ✅ **Fase 3 · Etapa 3 — Pantallas** ensambladas con la librería: Home, Categoría, Producto, Carrito, Checkout, Mi Cuenta + páginas de contenido (nosotros, ayuda, despacho, devoluciones, términos, privacidad, anticipación).
- 🟢 **Fase 3.3B — New User Experience & Activation Flow (D16):** embudo de activación completo para el visitante nuevo — **Landing → alta de mascota conversacional → recomendación personalizada → registro → primer carrito → checkout → bienvenida**. Modelo de **sesión** (`SessionProvider`/`useAuthActions`); providers de mascota/carrito arrancan **vacíos**; `/` decide Landing vs panel según sesión (U041/U058). `tsc` + `eslint` + `next build` (22 rutas) + smoke-test HTTP 200 ✅. *(Revisado y cerrado por D17.)*
- 🟢 **Fase 3.4 — Polish · lote 1 (track no-fotográfico) ✅ (2026-07-05):** el fundador aprobó arrancar el polish por lo que no depende de imágenes (las fotos IA generadas con ChatGPT se probarán después, sin quemar tokens ahora). **10 ítems cerrados:** Fraunces como variable font con eje óptico por nivel (U009) · escala tipográfica sin solape 28–36/36–48/44–60 (U010) · `neutral-500` oscurecido a #6F665A para AA en los 3 fondos (U028) · contraste del botón miel verificado (U029) · **política de redondeo CLP** (piso a múltiplo de $10; `subscriptionPrice()`/`roundCLP()` en `lib/format.ts` reemplazan 5 cálculos duplicados) (U066) · barra de anticipación con llenado calmado `animateIn` (U085) · pulso-alerta de la cápsula eliminado (U087) · "¿Por qué te lo decimos?" con afordancia de botón (U088) · banda oscura de la landing como pieza editorial inset (U089) · U101 verificado (deuda solo del prototipo). `tsc` + `eslint` + `next build` (22 rutas) + smoke ✅.
- ✅ **Fase 4 · Stack backend decidido (D21, 2026-07-06): Medusa.js v2** — elegido por Carlos con criterios explícitos (velocidad MVP > simplicidad fundador único > bajo mantenimiento > escala sin sobreingeniería; regla 80–90%). Validado contra Vendure/Saleor/custom; extensión vía módulos custom (`pet-profile`/`subscription`/`anticipation`) + payment provider Webpay custom. Rationale completo y riesgos en D21; `ARCHITECTURE.md §3` actualizado.
- ✅ **Fase 4 · Estructura física del repositorio (D20, 2026-07-06):** monorepo pnpm — `git mv web apps/web` (app intacta, package → `@manada/web`), workspace raíz (`apps/*` + `packages/*`), lockfile único en raíz, `apps/backend` **reservado sin código** y **reglas arquitectónicas permanentes** en `ARCHITECTURE.md §2`. Verificado idéntico: `tsc` + `eslint` + `next build` (22 rutas) + smoke HTTP 200 (incl. PDP/PLP dinámicas) ✅.
- ✅ **Fase 3.3 — Product Experience CERRADA (D17, 2026-07-03):** revisión visual manual completa con mejoras aplicadas en dos rondas: **sistema** (token `--radius-pill` faltante, cursor pointer global por preflight de Tailwind v4, alturas uniformes de ProductCard, diálogo real de reagendo con fecha programada, "Agregar mascota" + lógica multi-mascota) y **modelo invitado** — *"e-commerce como piso, perfil como camino destacado"*: landing-vitrina con riel y tienda navegable anónima, header marketing con buscador/nav/carrito, **checkout de invitado punta a punta**, gate honesto de suscripción (cuenta solo si hay suscripción, anunciado en el botón) y registro valor-primero **post-compra** en `/bienvenida` (email prellenado). `SessionProvider` gana estado `guest`. **AUDIT Fase 3.3: 27/33 Hechos** (U066 → Polish; U070 → Futura). `tsc` + `eslint` + `next build` (22 rutas) + smoke ✅.

## En la mesa ahora mismo (`apps/web/`)
- **Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TS 5.9 · **Tailwind v4 (CSS-first, `@theme`)** · **Radix UI** (primitivas a11y, 16 paquetes) · framer-motion 12 · lucide-react.
- **Componentes (Etapa 2):** `ui/` primitivas (layout, botones, badges/chips, tarjetas, datos, formularios, feedback, navegación) · `layout/` chrome (AppShell/Header/Navbar/MegaMenu/Footer/BottomNav/MobileNav/Logo) · `commerce/` (ProductCard/Grid/Rail, badges, SubscriptionBox, FiltersPanel, CartItem/Drawer, OrderSummary, Coupon, Shipping/PaymentMethod, CheckoutStepper) · `pet/` (PetSwitcher, AnticipationCapsule, PetProfileHeader/Card/EditCard, FeedingSchedule, RecommendationCard). Importables por barrels (`@/components/ui` etc.).
- **Soporte:** `hooks/` (useDisclosure, useMediaQuery/useBreakpoint, usePrefersReducedMotion, useSubscription) · `lib/` (format, motion, anticipation, icons, data/catalog) · datos demo (Carlos + Toby + catálogo).
- **Tokens:** todo el design system en `globals.css` (`@theme`). Styleguides vivos en `/dev/tokens` y `/dev/components`.
- **A11y:** Radix para overlays/controles (foco-trap, teclado, ARIA); foco visible; color+ícono/texto; `prefers-reduced-motion`.
- **Pendiente operativo (no bloquea):** registrar `tumanada.cl` + handles; verificar "Manada" en INAPI; ejecutar logo en vector; **fotografía real (U090)** condiciona el polish.

## Siguiente paso
**▶️ Fase 4 — Arquitectura técnica (D19/D20/D21).** Estructura física ✅ (D20) · stack backend ✅ (D21: **Medusa.js v2**). Orden de trabajo restante (detalle en `ROADMAP.md`):
1. **Proveedores Chile:** pagos (Webpay/MercadoPago/Khipu — Webpay será payment provider custom de Medusa), courier (Blue Express/Starken/Chilexpress), boleta SII (LibreDTE/Bsale), WhatsApp Business API. Comparativas con recomendación → aprobación de Carlos.
2. **Modelo de datos** (`DATABASE.md`) — diseñado "Medusa-native": módulos custom `pet-profile`/`subscription`/`anticipation` + module links a entidades core.
3. **Contratos API** (`API.md`) — REST store de Medusa + rutas custom `/store/*`, pensados para hidratar los providers del frontend. Al aprobarse el primer contrato compartido, recién ahí nace `packages/shared` (D20).
Entregable: `ARCHITECTURE.md` completo + decisiones en `DECISIONS.md`. Es fase de arquitectura/validación; el MVP (scaffold de Medusa en `apps/backend`) se construye en Fase 5.

## En pausa (se retoma cuando existan las fotos)
**⏸ Polish 3.4 restante:**
- **Lote 2 no-fotográfico:** U086 (vuelo al carrito) · U100 (home con un solo clímax) · U096/U097 (confianza realzada) · U094 (deleite de cumpleaños) · U095 (tono salud) · U098/U099 (acento/texturas) · U104 (urgencia) · **U003** (color de suscripción — decisión de marca con Carlos pendiente).
- **Track fotográfico (bloqueado por assets):** U080/U081/U082/U084/U091/U092. Carlos generó **imágenes con ChatGPT para probar** (aún no integradas); existe además un **shot list detallado por pantalla** propuesto vía Claude-Chrome (hero, Nosotros, íconos de categoría, login/onboarding, banners PLP) — evaluar si se adopta como brief. La política definitiva IA-vs-fotografía-real (U090) **sigue sin decidirse**.

> **Para continuar en un chat nuevo:** prompt de `CLAUDE.md`. Claves del código: rutas del embudo en `apps/web/src/app/{comenzar,crear-cuenta,ingresar,bienvenida}`, vistas `landing-view`/`dashboard-view`, sesión en `components/providers/session-provider.tsx` (incluye **estado `guest`** del checkout invitado) + `hooks/use-auth-actions.ts`, motor en `lib/recommend.ts`, anticipación de demo en `lib/demo-data.ts` (`TOBY_ANTICIPATION`, fuente única). Chrome del embudo = `layout/FunnelShell`; landing/tienda anónima = `AppShell variant="marketing"` (con buscador/nav/carrito).

## Modo de trabajo vigente
Incremental con calidad de producción: completar etapa → actualizar docs → **esperar aprobación** antes de la siguiente (mandato del brief de Fase 3). En decisiones no estratégicas, tomar la opción claramente superior y documentar rationale.
