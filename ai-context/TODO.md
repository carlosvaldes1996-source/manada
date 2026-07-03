# TODO — Pendientes y decisiones abiertas

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Lista táctica de pendientes y decisiones abiertas, por fase. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-03 |
> | **Depends On** | ROADMAP.md, AUDIT_UI_UX.md (backlog fino de FE) |
> | **Supersedes** | — |
> | **Source of Truth** | Derivado de ROADMAP/AUDIT. El backlog UI/UX fino vive en AUDIT_UI_UX.md. |

> *Actualizado: 2026-07-03*

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
- [ ] **Etapa 4 — Polish (Fase 3.4)** ← **siguiente:** dirección de arte aplicada, microinteracciones y refinamiento premium según ítems de Fase 3.4 de `AUDIT_UI_UX.md` + diferidos (U003, U009, U010, U028, U029, U066). Los ítems fotográficos (U080/U081/U082/U084/U091/U092) dependen de fotografía real `U090`; puede arrancarse por lo no-fotográfico (opsz, sombras cálidas, contrastes AA, motion).

> **Backlog vivo:** el progreso fino de UI/UX se registra ítem a ítem en `AUDIT_UI_UX.md` (columna *estado*). Los ítems de "Fase futura (Backend/CRO)" alimentan Fases 4–7.

### Histórico Fase 3 (referencia)
- [x] **Plan del sistema de componentes Next.js** (D12) → `FRONTEND_ARCHITECTURE.md`.
- [ ] **Fase 4 (Arquitectura):** validar Medusa.js vs alternativas; definir proveedores de pago (Webpay/MercadoPago/Khipu), courier (Blue Express/Starken/Chilexpress) y boleta SII (LibreDTE/Bsale); modelo de datos (DATABASE.md) y API (API.md).
- [ ] **Fase 5 (MVP):** desarrollo.

## 🟢 Investigación pendiente
- [ ] Benchmarking visual fino de DrPet y Chewy (quedaron bloqueados en scraping).
- [ ] Verificar disponibilidad legal/marca registrada del nombre elegido (INAPI).
