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

## ▶️ Fase 4 — Arquitectura técnica (ACTIVA desde 2026-07-05, D19)
- [x] **Estructura física del repositorio** (D20, 2026-07-06): monorepo pnpm — `web/` → `apps/web` (`@manada/web`, verificada idéntica) · `apps/backend` **reservado sin código** · `packages/shared` solo con el primer contrato aprobado en `API.md` · **reglas arquitectónicas permanentes** → `ARCHITECTURE.md §2`. **Build + type-check + lint + smoke ✅.**
- [ ] **Validar stack backend:** Medusa.js vs alternativas (Vendure, Saleor, custom Next.js + Postgres/Supabase). Criterio: módulo de **suscripciones custom** (diferenciador) y perfil de mascota como entidad central.
- [ ] **Proveedores Chile:** pagos (Webpay Plus/MercadoPago/Khipu), courier (Blue Express/Starken/Chilexpress), boleta SII (LibreDTE/Bsale), WhatsApp Business API.
- [ ] **Modelo de datos** → completar `DATABASE.md` (entidad crítica: Perfil de Mascota, el moat).
- [ ] **Contratos API** → completar `API.md`.
- [ ] Registrar decisiones en `DECISIONS.md`; actualizar `ARCHITECTURE.md` como fuente de verdad.
> Para arrancar en un chat nuevo: **prompt #8 de `PROMPTS.md`**.

> **Backlog vivo:** el progreso fino de UI/UX se registra ítem a ítem en `AUDIT_UI_UX.md` (columna *estado*). Los ítems de "Fase futura (Backend/CRO)" alimentan Fases 4–7.

### Histórico Fase 3 (referencia)
- [x] **Plan del sistema de componentes Next.js** (D12) → `FRONTEND_ARCHITECTURE.md`.

### Fases siguientes
- [ ] **Fase 5 (MVP):** desarrollo del e-commerce funcional sobre la arquitectura de Fase 4.

## 🟢 Investigación pendiente
- [ ] Benchmarking visual fino de DrPet y Chewy (quedaron bloqueados en scraping).
- [ ] Verificar disponibilidad legal/marca registrada del nombre elegido (INAPI).
