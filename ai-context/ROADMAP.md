# ROADMAP — Fases del proyecto

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Fases del proyecto (0–8) y su estado. Vista estratégica de alto nivel. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-03 |
> | **Depends On** | DECISIONS.md, CURRENT_STATE.md |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ de *las fases y su orden*. El detalle táctico está en TODO.md y AUDIT_UI_UX.md. |

> *Actualizado: 2026-07-03*

| Fase | Nombre | Entregable principal | Estado |
|---|---|---|---|
| 0.1 | Estrategia de negocio | Modelo, mercado, integraciones CL | ✅ |
| 0.2 | Benchmarking | Análisis competitivo + mejores ideas | ✅ |
| 0.3 | Estrategia de marca | Territorios + concepto rector C1 | ✅ |
| 1 | Identidad de marca | Naming, logo, paleta, tipografía, sistema visual, iconografía, fotografía, ilustración, componentes | ✅ |
| 2 | UX | Arquitectura de información, journeys, wireframes, **prototipo HTML** | ✅ |
| **3** | **Frontend / Design System** | App Next.js: tokens + librería de componentes + pantallas | 🔄 en curso |
| 4 | Arquitectura técnica | Stack validado, modelo de datos, API, integraciones | ⬜ |
| 5 | MVP | E-commerce funcional (catálogo, carrito, checkout, Webpay, despacho) | ⬜ |
| 6 | Diferenciador | Perfil de mascota + suscripción inteligente | ⬜ |
| 7 | Inteligencia | Recomendación, recordatorios WhatsApp, farmacia | ⬜ |
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

## Detalle Fase 3 (orden de trabajo) ← **aquí**
1. ✅ **Etapa 1 — Fundaciones** (D13): scaffold `web/`, estructura, routing, providers, design tokens, tema, tipografías. *Verificado.*
2. ✅ **Auditoría UI/UX → backlog priorizado** (D14): `AUDIT_UI_UX.md` (108 ítems, fuente de verdad de mejoras de frontend).
3. ✅ **Etapa 2 — Componentes reutilizables / "Component Library"** (D15): ~70 componentes en `ui → layout → commerce → pet` + `hooks/` + `lib/`; doc en `COMPONENT_LIBRARY.md`; styleguide en `/dev/components`. Resuelve los P0 (+ mayoría de P1) de **Fase 3.2** de `AUDIT_UI_UX.md`. *Verificado.* ⏸ **Espera aprobación** antes de Etapa 3.
4. ✅ **Etapa 3 — Pantallas / "Product Experience"** (Home → Categoría → Producto → Carrito → Checkout → Mi Cuenta) ensambladas. Incluye **Fase 3.3B — New User Experience & Activation Flow** (D16) y la **revisión visual final con modelo de compra de invitado** (D17: tienda anónima navegable, guest checkout, gate honesto de suscripción, registro valor-primero post-compra). **Cerrada 2026-07-03 (D17)** — 27/33 ítems de Fase 3.3 de `AUDIT_UI_UX.md` en Hecho.
5. ⬜ **Etapa 4 — Polish / "Frontend Polish"** ← **siguiente** (dirección de arte, microinteracciones, premium). Resuelve **Fase 3.4** de `AUDIT_UI_UX.md` + diferidos (U003/U009/U010/U028/U029/U066); los ítems fotográficos dependen de fotografía real `U090`.
> Stack y deviations en D13; inventario de componentes en FRONTEND_ARCHITECTURE.md §4; backlog de mejoras en **AUDIT_UI_UX.md** (ítems "Fase futura" → Fases 4–7).
