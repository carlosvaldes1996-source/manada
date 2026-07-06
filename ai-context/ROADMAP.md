# ROADMAP — Fases del proyecto

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Fases del proyecto (0–8) y su estado. Vista estratégica de alto nivel. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-06 |
> | **Depends On** | DECISIONS.md, CURRENT_STATE.md |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ de *las fases y su orden*. El detalle táctico está en TODO.md y AUDIT_UI_UX.md. |

> *Actualizado: 2026-07-06 (D22: **mandato MVP-first** — Fase 4 cerrada por lo esencial; **Fase 5 (MVP) activa**, alternativa manual por defecto)*

| Fase | Nombre | Entregable principal | Estado |
|---|---|---|---|
| 0.1 | Estrategia de negocio | Modelo, mercado, integraciones CL | ✅ |
| 0.2 | Benchmarking | Análisis competitivo + mejores ideas | ✅ |
| 0.3 | Estrategia de marca | Territorios + concepto rector C1 | ✅ |
| 1 | Identidad de marca | Naming, logo, paleta, tipografía, sistema visual, iconografía, fotografía, ilustración, componentes | ✅ |
| 2 | UX | Arquitectura de información, journeys, wireframes, **prototipo HTML** | ✅ |
| 3 | Frontend / Design System | App Next.js: tokens + librería de componentes + pantallas | 🟡 funcional completa; **Polish 3.4 ⏸ en pausa** (lote 1 ✅ D18; resto espera fotos U090) |
| 4 | Arquitectura técnica | Stack validado, modelo de datos, API, integraciones | ✅ **cerrada por lo esencial (D20/D21); el resto se define dentro del MVP (D22)** |
| **5** | **MVP** | E-commerce funcional (catálogo, carrito, checkout, pago, orden + dirección) — **envíos y boleta manuales (D22)** | 🔄 **activa (D22) — MVP-first** |
| 6 | Diferenciador | Perfil de mascota + suscripción inteligente | ⬜ |
| 7 | Inteligencia + automatización | Recomendación, recordatorios WhatsApp, courier/SII automáticos, farmacia | ⬜ |
| 8 | Escala | SEO, marketing, fidelización, membresía | ⬜ |

## Detalle Fase 1 (✅ completa — D8·D9·D10·D11)
1. ✅ Naming → Manada / `tumanada.cl`
2. ✅ Dirección visual desde el concepto rector
3. ✅ Logo "huella-manada"
4. ✅ Paleta (escalas + tokens)
5. ✅ Tipografía (escala + tokens)
6. ✅ Sistema visual (composición, grid, motion)
7. ✅ Iconografía
8. ✅ Estilo fotográfico
9. ✅ Estilo de ilustración
10. ✅ Componentes visuales base + ejemplos de UI
> Detalle en DESIGN_SYSTEM.md y BRANDING.md.

## Detalle Fase 2 (✅ completa)
1. ✅ Arquitectura de información definitiva (UX.md)
2. ✅ User journeys detallados
3. ✅ Wireframes de pantallas clave (home, listado, ficha, perfil de mascota, carrito, checkout)
4. ✅ Entregable: **prototipo HTML estático** con la marca aplicada (`prototype/`)
5. ✅ Plan del sistema de componentes Next.js (D12 → FRONTEND_ARCHITECTURE.md)

## Detalle Fase 3 (orden de trabajo)
1. ✅ **Etapa 1 — Fundaciones** (D13): scaffold `web/`, estructura, routing, providers, design tokens, tema, tipografías. *Verificado.*
2. ✅ **Auditoría UI/UX → backlog priorizado** (D14): `AUDIT_UI_UX.md` (108 ítems, fuente de verdad de mejoras de frontend).
3. ✅ **Etapa 2 — Componentes reutilizables / "Component Library"** (D15): ~70 componentes en `ui → layout → commerce → pet` + `hooks/` + `lib/`; doc en `COMPONENT_LIBRARY.md`; styleguide en `/dev/components`. Resuelve los P0 (+ mayoría de P1) de **Fase 3.2** de `AUDIT_UI_UX.md`. *Verificado.* ⏸ **Espera aprobación** antes de Etapa 3.
4. ✅ **Etapa 3 — Pantallas / "Product Experience"** (Home → Categoría → Producto → Carrito → Checkout → Mi Cuenta) ensambladas. Incluye **Fase 3.3B — New User Experience & Activation Flow** (D16) y la **revisión visual final con modelo de compra de invitado** (D17: tienda anónima navegable, guest checkout, gate honesto de suscripción, registro valor-primero post-compra). **Cerrada 2026-07-03 (D17)** — 27/33 ítems de Fase 3.3 de `AUDIT_UI_UX.md` en Hecho.
5. ⏸ **Etapa 4 — Polish / "Frontend Polish"** — **en pausa (D19)**. Lote 1 no-fotográfico ✅ (D18, 2026-07-05: opsz, escala, contrastes AA, redondeo CLP, motion calmado). Restan lote 2 no-fotográfico y el track fotográfico (bloqueado por assets `U090`; fotos IA de ChatGPT por probar). Se retoma cuando existan las fotos, en paralelo o después de la Fase 4.
> Stack y deviations en D13; inventario de componentes en FRONTEND_ARCHITECTURE.md §4; backlog de mejoras en **AUDIT_UI_UX.md** (ítems "Fase futura" → Fases 4–7).

## Detalle Fase 4 (cerrada por lo esencial — D22)
0. ✅ **Estructura física del repositorio (D20, 2026-07-06):** monorepo pnpm workspaces — `web/` → **`apps/web`** (intacta, verificada idéntica: `tsc`+`eslint`+`build` 22 rutas+smoke ✅) · **`apps/backend` reservado** · `packages/shared` **solo** con el primer contrato compartido aprobado en `API.md` · **reglas arquitectónicas permanentes** en `ARCHITECTURE.md §2`.
1. ✅ **Stack backend (D21, 2026-07-06): Medusa.js v2.** Principio **"e-commerce primero"**; moat en **módulos custom** (`pet-profile`/`subscription`/`anticipation`), Webpay como payment provider custom. Rationale y riesgos en D21.
2. ✅ **Cierre por MVP-first (D22, 2026-07-06):** con D20/D21 la arquitectura base es suficiente para lanzar. Lo que resta de la Fase 4 (modelo de datos + contratos API) **se recorta a lo mínimo del MVP y se define durante la construcción**, no antes. De "proveedores Chile" solo se decide el **medio de pago**; courier, boleta SII y WhatsApp quedan **manuales**.
> Detalle del mandato en **D22**. Ya no hay una fase de "arquitectura/validación" separada del MVP.

## Detalle Fase 5 — MVP (orden de trabajo) ← **aquí** (D22, MVP-first)
> **Regla de la fase:** cada decisión se evalúa por *¿acerca o retrasa el lanzamiento?* Alternativa manual por defecto. Sin nuevas capas de arquitectura salvo que sean indispensables.

**Backend — ✅ hecho y verificado (2026-07-06):**
1. ✅ **Scaffold de Medusa v2** en `apps/backend` (starter bare, integrado al workspace pnpm; NO el template DTC). Setup en `apps/backend/DEV.md`.
2. ✅ **Medio de pago:** decisión de Carlos → Webpay **no** se integra aún; MVP usa **pago manual `pp_system_default`** (transferencia) como método real. Webpay = fast-follow.
3. ✅ **Modelo mínimo + seed Chile:** tienda CLP, región Chile, despacho manual, catálogo (6 productos alineados con el front), sales channel + publishable key.
4. ✅ **Checkout punta a punta verificado** por Store API → orden real registrada (dirección + pago manual). Fulfillment y boleta manuales desde el Admin.

**Frontend — ⬜ conectar `apps/web` al backend (por etapas; prompt #10):**
5. ⬜ **Fundación** (SDK Medusa + `.env.local` + capa `lib/medusa/` → tipo `Product`) → **Catálogo** (PLP/PDP reales) → **Carrito** → **Checkout** → **Cuenta/sesión**. Next 16 con cambios de ruptura: leer `apps/web/AGENTS.md` + docs antes de tocar el front; mapear a los tipos/componentes existentes.
> Diferido a **Fases 6–7 (con tracción):** integración Webpay; automatización de courier, boleta SII, WhatsApp; motor de anticipación completo; suscripción inteligente. Prompt de continuación: **#10 en `PROMPTS.md`**.
