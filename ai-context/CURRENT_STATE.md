# CURRENT STATE — Dónde estamos AHORA

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Foto del estado actual del proyecto y desde dónde continuar. Lo primero que se actualiza cada sesión. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-03 |
> | **Depends On** | DECISIONS.md, ROADMAP.md, AUDIT_UI_UX.md |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ del *estado actual y el siguiente paso*. |

> *Actualizado: 2026-07-03 (Fase 3 · **Etapa 3.3 CERRADA — D17**; siguiente: **Etapa 4 — Polish (Fase 3.4)**)*

## Fase activa
**Fase 3 — Frontend / Design System (en curso).** Fases 0–2 ✅ completas.

## Último avance
- ✅ **Fase 1 (Identidad de marca)** completa (D8·D9·D10·D11): nombre **Manada · `tumanada.cl`**, dirección visual, logo "huella-manada" y **Brand & Visual Design System** completo (DESIGN_SYSTEM.md).
- ✅ **Fase 2 (UX)** completa: arquitectura de información, journeys, wireframes (UX.md) + **prototipo HTML estático** (`prototype/`, 6 páginas con chrome en Web Components) + **plan del sistema de componentes** (D12 → FRONTEND_ARCHITECTURE.md).
- ✅ **Fase 3 · Etapa 1 — Fundaciones (D13):** scaffold Next.js en **`web/`**. Estructura, routing, providers, design tokens, tema y tipografías listos y verificados (build + type-check + lint + smoke-test en verde).
- ✅ **Auditoría crítica de UI/UX → backlog priorizado (D14):** `AUDIT_UI_UX.md` (108 ítems `U001`–`U122`). **Fuente de verdad de mejoras de frontend.**
- ✅ **Fase 3 · Etapa 2 — Component Library (D15):** **librería completa de ~70 componentes reutilizables** en `components/{ui,layout,commerce,pet}` + `hooks/` + `lib/`, documentada en **COMPONENT_LIBRARY.md** y con **styleguide navegable en `/dev/components`**. Resuelve los 3 P0 de Fase 3.2 de AUDIT_UI_UX.md (+ mayoría de P1). `tsc` + `eslint` + `next build` (10 rutas) + smoke-test HTTP 200 ✅.
- ✅ **Fase 3 · Etapa 3 — Pantallas** ensambladas con la librería: Home, Categoría, Producto, Carrito, Checkout, Mi Cuenta + páginas de contenido (nosotros, ayuda, despacho, devoluciones, términos, privacidad, anticipación).
- 🟢 **Fase 3.3B — New User Experience & Activation Flow (D16):** embudo de activación completo para el visitante nuevo — **Landing → alta de mascota conversacional → recomendación personalizada → registro → primer carrito → checkout → bienvenida**. Modelo de **sesión** (`SessionProvider`/`useAuthActions`); providers de mascota/carrito arrancan **vacíos**; `/` decide Landing vs panel según sesión (U041/U058). `tsc` + `eslint` + `next build` (22 rutas) + smoke-test HTTP 200 ✅. *(Revisado y cerrado por D17.)*
- ✅ **Fase 3.3 — Product Experience CERRADA (D17, 2026-07-03):** revisión visual manual completa con mejoras aplicadas en dos rondas: **sistema** (token `--radius-pill` faltante, cursor pointer global por preflight de Tailwind v4, alturas uniformes de ProductCard, diálogo real de reagendo con fecha programada, "Agregar mascota" + lógica multi-mascota) y **modelo invitado** — *"e-commerce como piso, perfil como camino destacado"*: landing-vitrina con riel y tienda navegable anónima, header marketing con buscador/nav/carrito, **checkout de invitado punta a punta**, gate honesto de suscripción (cuenta solo si hay suscripción, anunciado en el botón) y registro valor-primero **post-compra** en `/bienvenida` (email prellenado). `SessionProvider` gana estado `guest`. **AUDIT Fase 3.3: 27/33 Hechos** (U066 → Polish; U070 → Futura). `tsc` + `eslint` + `next build` (22 rutas) + smoke ✅.

## En la mesa ahora mismo (`web/`)
- **Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TS 5.9 · **Tailwind v4 (CSS-first, `@theme`)** · **Radix UI** (primitivas a11y, 16 paquetes) · framer-motion 12 · lucide-react.
- **Componentes (Etapa 2):** `ui/` primitivas (layout, botones, badges/chips, tarjetas, datos, formularios, feedback, navegación) · `layout/` chrome (AppShell/Header/Navbar/MegaMenu/Footer/BottomNav/MobileNav/Logo) · `commerce/` (ProductCard/Grid/Rail, badges, SubscriptionBox, FiltersPanel, CartItem/Drawer, OrderSummary, Coupon, Shipping/PaymentMethod, CheckoutStepper) · `pet/` (PetSwitcher, AnticipationCapsule, PetProfileHeader/Card/EditCard, FeedingSchedule, RecommendationCard). Importables por barrels (`@/components/ui` etc.).
- **Soporte:** `hooks/` (useDisclosure, useMediaQuery/useBreakpoint, usePrefersReducedMotion, useSubscription) · `lib/` (format, motion, anticipation, icons, data/catalog) · datos demo (Carlos + Toby + catálogo).
- **Tokens:** todo el design system en `globals.css` (`@theme`). Styleguides vivos en `/dev/tokens` y `/dev/components`.
- **A11y:** Radix para overlays/controles (foco-trap, teclado, ARIA); foco visible; color+ícono/texto; `prefers-reduced-motion`.
- **Pendiente operativo (no bloquea):** registrar `tumanada.cl` + handles; verificar "Manada" en INAPI; ejecutar logo en vector; **fotografía real (U090)** condiciona el polish.

## Siguiente paso
**▶️ Etapa 4 — Polish (Fase 3.4):** dirección de arte aplicada, microinteracciones, movimiento y refinamiento premium. Consume los ítems **Fase 3.4** de `AUDIT_UI_UX.md` + los diferidos de etapas previas (U003, U009, U010, U028, U029 de la 3.2; **U066** redondeo CLP de la 3.3). **Condicionada por la fotografía real (U090):** U080/U081/U082/U084/U091/U092 la necesitan; puede arrancarse por lo no-fotográfico (opsz de Fraunces, sombras cálidas, contrastes AA, animación de la barra, pulse de la cápsula, transiciones entre secciones).

> **Para continuar en un chat nuevo:** prompt de `CLAUDE.md`. Claves del código: rutas del embudo en `web/src/app/{comenzar,crear-cuenta,ingresar,bienvenida}`, vistas `landing-view`/`dashboard-view`, sesión en `components/providers/session-provider.tsx` (incluye **estado `guest`** del checkout invitado) + `hooks/use-auth-actions.ts`, motor en `lib/recommend.ts`, anticipación de demo en `lib/demo-data.ts` (`TOBY_ANTICIPATION`, fuente única). Chrome del embudo = `layout/FunnelShell`; landing/tienda anónima = `AppShell variant="marketing"` (con buscador/nav/carrito).

## Modo de trabajo vigente
Incremental con calidad de producción: completar etapa → actualizar docs → **esperar aprobación** antes de la siguiente (mandato del brief de Fase 3). En decisiones no estratégicas, tomar la opción claramente superior y documentar rationale.
