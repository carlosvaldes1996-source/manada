# TODO — Pendientes y decisiones abiertas

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Lista táctica de pendientes y decisiones abiertas, por fase. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-06 |
> | **Depends On** | ROADMAP.md, AUDIT_UI_UX.md (backlog fino de FE) |
> | **Supersedes** | — |
> | **Source of Truth** | Derivado de ROADMAP/AUDIT. El backlog UI/UX fino vive en AUDIT_UI_UX.md. |

> *Actualizado: 2026-07-06*

## ✅ Fase 1 (Identidad de marca) — COMPLETA
- [x] Nombre definitivo → **Manada · `tumanada.cl`** (D8).
- [x] Dirección visual (D9), Logo "huella-manada" (D10), Sistema visual completo (D11).
- [x] Paleta, tipografía, iconografía, fotografía, ilustración, composición, grid/tokens, motion, ejemplos de UI → DESIGN_SYSTEM.md.

### Operativo derivado de Fase 1 (no bloquea UX)
- [ ] Registrar `tumanada.cl` + handles de redes (@manada / @somosmanada / @tumanada).
- [ ] Verificar marca "Manada" en INAPI.
- [ ] Ejecutar logo en vector según BRANDING.md §7.
- [ ] Auto-hospedar fuentes Fraunces + Hanken Grotesk.

## ✅ Fase 2 (UX) — COMPLETA
- [x] Arquitectura de información definitiva (UX.md).
- [x] User journeys detallados (primera compra+suscripción, recompra, cross-sell farmacia, perfil de mascota).
- [x] Wireframes low-fi de pantallas clave (UX.md §6).
- [x] **Brief autocontenido del prototipo** → archivado en `history/03-fase-2-prototype-brief.md`.
- [x] Tokens del design system en código → `prototype/assets/styles.css`.
- [x] **Construir prototipo HTML estático** (6 páginas) → `prototype/` completo. Chrome en Web Components (`assets/components.js`) + interacciones (`assets/app.js`). Reutiliza `styles.css`.
- [x] **Plan del sistema de componentes Next.js** (D12) → `FRONTEND_ARCHITECTURE.md` (árbol `src/`, ~50 componentes con props, tokens→Tailwind, lib/hooks, orden de build).
## 🔴 Inmediato (Fase 3 — Frontend / Design System) ← activa (Etapa 4 = siguiente)
- [x] **Etapa 1 — Fundaciones** (D13): scaffold Next.js en `web/` (Next 16 + React 19 + TS + Tailwind v4 + shadcn + framer-motion + lucide). Tokens del design system en `globals.css` (`@theme`), tipografías `next/font`, routing de las 6 pantallas (placeholders), providers (`usePet`/`useCart`), arquitectura de carpetas, styleguide en `/dev/tokens`. **Build + type-check + lint + smoke-test ✅.**
- [x] **Auditoría crítica de UI/UX del prototipo → backlog priorizado** (D14) → `AUDIT_UI_UX.md` (108 ítems `U001`–`U122`, clasificados en Fase 3.2 / 3.3 / 3.4 / Futura, con impacto·esfuerzo·prioridad·estado·archivos). **Fuente de verdad de mejoras de frontend.**
- [x] **Etapa 2 — Componentes reutilizables** (D15): ~70 componentes en `ui → layout → commerce → pet` + `hooks/` + `lib/`, con TS estricto, a11y AA (Radix), responsive, estados (loading/empty/error/hover/focus/disabled) y motion. **Documentado en `COMPONENT_LIBRARY.md` + styleguide navegable en `/dev/components`.** Resueltos los 3 P0 de Fase 3.2 de `AUDIT_UI_UX.md` (+ mayoría de P1; estados por ítem actualizados allí). **Build + type-check + lint + smoke-test ✅.** ⏸ Espera aprobación.
- [x] **Etapa 3 — Pantallas** (D16/D17, **cerrada 2026-07-03**): Home → Categoría → Producto → Carrito → Checkout → Mi Cuenta ensambladas solo con la Component Library, + **embudo de activación 3.3B** (Landing → alta → recomendación → registro → checkout → bienvenida) + **revisión visual final** con dos rondas de mejoras y el **modelo de compra de invitado** (tienda anónima navegable, guest checkout punta a punta, gate honesto de suscripción, registro valor-primero post-compra). **27/33 ítems de Fase 3.3 de `AUDIT_UI_UX.md` Hechos** (U066 → Polish; U070 → Futura). **Build + type-check + lint + smoke ✅.**
- [ ] **Etapa 4 — Polish (Fase 3.4)** ← **⏸ EN PAUSA (D19, 2026-07-05):** se adelanta la Fase 4 (Backend); el Polish se retoma cuando existan los assets fotográficos.
  - [x] **Lote 1 — track no-fotográfico** (2026-07-05, D18): U009 opsz · U010 escala sin solape · U028 contraste text-muted · U029 verificado · U066 redondeo CLP (`subscriptionPrice()` fuente única) · U085 barra animada · U087 pulso eliminado · U088 afordancia · U089 banda editorial · U101 verificado. **Build + type-check + lint + smoke ✅.**
  - [ ] **Lote 2 — no-fotográfico restante (pausado):** U086 vuelo al carrito · U100 home con clímax · U096/U097 confianza realzada · U094 deleite cumpleaños · U095 tono salud · U098/U099 acento/texturas · U104 urgencia · U003 color suscripción (**decisión de marca pendiente**).
  - [ ] **Track fotográfico (pausado, bloqueado por assets)** (U080/U081/U082/U084/U091/U092): Carlos tiene **imágenes IA de ChatGPT para probar** + shot list por pantalla (propuesta Claude-Chrome). Política IA vs. fotografía real (U090) **sin decidir**.

## ✅ Fase 4 — Arquitectura técnica (cerrada por lo esencial — D22)
- [x] **Estructura física del repositorio** (D20, 2026-07-06): monorepo pnpm — `web/` → `apps/web` (`@manada/web`, verificada idéntica) · `apps/backend` **reservado sin código** · `packages/shared` solo con el primer contrato aprobado en `API.md` · **reglas arquitectónicas permanentes** → `ARCHITECTURE.md §2`.
- [x] **Stack backend** (D21, 2026-07-06): ✅ **Medusa.js v2** — principio "e-commerce primero" + criterios (velocidad MVP · fundador único · bajo mantenimiento · escala sin sobreingeniería; regla 80–90%). Moat como módulos custom; Webpay = payment provider custom.
- [x] **Cierre MVP-first** (D22, 2026-07-06): la arquitectura base es suficiente para lanzar; **el modelo de datos y los contratos API se recortan al mínimo del MVP y se definen durante la construcción** (Fase 5). De proveedores Chile solo bloquea el **medio de pago**; courier/SII/WhatsApp = manual.

## ▶️ Fase 5 — MVP (ACTIVA desde 2026-07-06, D22 · MVP-first)
> **Regla:** cada decisión se evalúa por *¿acerca o retrasa el lanzamiento?* Alternativa manual por defecto. Sin nuevas capas de arquitectura salvo que sean indispensables.

### Backend — ✅ hecho y verificado (2026-07-06)
- [x] **Scaffold de Medusa v2** en `apps/backend` (starter bare `@medusajs/medusa` 2.16.0, integrado al workspace pnpm; NO el template DTC). Config: root `.npmrc` (hoist) + `onlyBuiltDependencies`. Setup en `apps/backend/DEV.md`.
- [x] **BD + migraciones + admin** (`medusa_manada`, `admin@tumanada.cl`).
- [x] **Seed Chile** (`src/scripts/seed.ts`): tienda **CLP**, región Chile, despacho manual (Estándar $3.990/Express $5.990), **pago manual `pp_system_default`**, sales channel "Manada Web" + publishable key (1↔1), **6 productos** alineados con `apps/web/.../catalog.ts`.
- [x] **Checkout punta a punta verificado** por Store API → **orden #1 registrada** ($28.980 CLP, dirección almacenada).
- [x] **Medio de pago (decisión Carlos):** Webpay **NO** se integra aún; MVP usa el **pago manual** como método real. Webpay = fast-follow.

### Frontend — conectar `apps/web` al backend (por etapas; prompt #10)
- [x] **1. Fundación** (Etapa 1): SDK Medusa (`@medusajs/js-sdk`) + `apps/web/.env.local` + capa `lib/medusa/` (mapea producto Medusa → tipo `Product`).
- [x] **2. Catálogo** (Etapa 2, D23): home/PLP + PDP con productos reales; catálogo Medusa-native + metadata administrable + `subscription_price` calculado por el backend.
- [x] **3. Carrito** (Etapa 3, D24): `cart-provider` sobre carritos reales de Medusa (CLP, `cart_id` persistido).
- [x] **4. Checkout** (Etapa 3, D24): `/checkout` real (dirección → despacho → **pago manual** → **orden real**).
- [x] **5. Auditoría de MVP + plan de cierre** (D25): flujo propio en 2 etapas (A cuentas · B tienda coherente); cuentas SÍ, moat diferido.
- [x] **6. Etapa A — Cuentas y sesión reales** (D26): auth nativo de Medusa (registro/login/logout/recuperación + sesión persistente JWT), `transferCart` carrito→cliente, `/cuenta/pedidos` (historial real) + `/cuenta/direcciones` (CRUD nativo), subscriber de recuperación en el backend. Compra de invitado intacta. **`tsc`+`eslint`+`build` (28 rutas) + smoke punta a punta ✅.**
- [x] **7. Etapa B — Tienda coherente y honesta** (D28): buscador real (`q` Store API + `/buscar`); cross-sell real (`listProducts`); **regla única de envío** (backend: opción $3.990 + promoción automática de envío gratis ≥ $30.000 vía script idempotente + ruta `/store/shipping-policy`); **auditoría de copy** (sin Webpay/SII/"pago protegido"/fechas de envío falsas); reseñas y ratings ocultos. **`tsc`+`eslint`+`build` (25 rutas) + smoke (orden bajo umbral $3.990 / sobre umbral $0) ✅. Flujo propio del MVP cerrado.**
- [x] **8. Endurecimiento pre-lanzamiento** (D29, 2026-07-08): auditoría de CTO + **7 correcciones de código de bajo riesgo** (solo `apps/web`, backend intacto, reversibles) → suscripción **atenuada** (`SUBSCRIPTIONS_ENABLED=false` = compra única; **resuelve el flag** de la UI de suscripción), **total del checkout** que refleja la regla real de envío del backend, copy sin promesas de suscripción (carrito/términos), **menú móvil sin 404**, **`/dev/*` gateado** en prod, cabeceras HTTP de seguridad, `error.tsx`/`not-found.tsx` de marca. **`tsc`+`eslint`+`build` (25 rutas) + smoke en `next start` (prod) ✅.**
- [ ] **9. Solo terceros + infra (después):** **secretos de prod fuertes + eliminar el fallback `"supersecret"`** (backend `medusa-config.ts`, bloqueante de seguridad) → **Mercado Pago** (Checkout Pro) → **email transaccional** (enlace de recuperación + confirmaciones/datos de transferencia) → SII/courier/WhatsApp (post-tracción); **infra**: deploy backend (Railway/Postgres+backups/Redis) + CORS al dominio + env vars en Vercel (D27) + dominio.
> Restricción: Next 16 con cambios de ruptura — leer `apps/web/AGENTS.md` + `apps/web/node_modules/next/dist/docs` antes de tocar el front. Mapear a los tipos/componentes existentes, no reescribir.
> Para continuar en un chat nuevo: **prompt #10 de `PROMPTS.md`**.

### Diferido a Fases 6–7 (con tracción)
- [ ] Automatización de courier (Blue Express/Starken/Chilexpress), boleta SII (LibreDTE/Bsale), WhatsApp Business API.
- [ ] Motor de anticipación completo + suscripción inteligente (módulos `pet-profile`/`subscription`/`anticipation`).

> **Backlog vivo:** el progreso fino de UI/UX se registra ítem a ítem en `AUDIT_UI_UX.md` (columna *estado*). Los ítems de "Fase futura (Backend/CRO)" alimentan Fases 5–7.

### Histórico Fase 3 (referencia)
- [x] **Plan del sistema de componentes Next.js** (D12) → `FRONTEND_ARCHITECTURE.md`.

## 🟢 Investigación pendiente
- [ ] Benchmarking visual fino de DrPet y Chewy (quedaron bloqueados en scraping).
- [ ] Verificar disponibilidad legal/marca registrada del nombre elegido (INAPI).
