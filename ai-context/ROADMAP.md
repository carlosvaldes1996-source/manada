# ROADMAP — Fases del proyecto

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Fases del proyecto (0–8) y su estado. Vista estratégica de alto nivel. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-11 |
> | **Depends On** | DECISIONS.md, CURRENT_STATE.md |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ de *las fases y su orden*. El detalle táctico vive en TODO.md; el estado fino en CURRENT_STATE.md. |

| Fase | Nombre | Entregable principal | Estado |
|---|---|---|---|
| 0.1 | Estrategia de negocio | Modelo, mercado, integraciones CL | ✅ |
| 0.2 | Benchmarking | Análisis competitivo + mejores ideas | ✅ |
| 0.3 | Estrategia de marca | Territorios + concepto rector C1 | ✅ |
| 1 | Identidad de marca | Naming, logo, paleta, tipografía, sistema visual | ✅ (D8–D11; logo vector pendiente, operativo) |
| 2 | UX | Arquitectura de información, journeys, wireframes, prototipo HTML | ✅ |
| 3 | Frontend / Design System | App Next.js: tokens + librería + pantallas | 🟡 funcional completa (D13–D18); **Polish 3.4 ⏸ en pausa** hasta fotos (U090, D19) |
| 4 | Arquitectura técnica | Estructura del repo + stack backend | ✅ cerrada por lo esencial (D20/D21; el resto se definió construyendo, D22) |
| **5** | **MVP** | E-commerce funcional real (catálogo→orden, cuentas, envío) — envíos y boleta manuales (D22) | 🔄 **activa** — flujo propio cerrado (D28) y endurecido (D29); perfil de mascota real (D34–D39); **resta: infra (WIP) + terceros** — ver `CURRENT_STATE.md` |
| 6 | Diferenciador | Suscripción inteligente + anticipación completa sobre el perfil real | ⬜ *(el perfil de mascota se adelantó a Fase 5, D34)* |
| 7 | Inteligencia + automatización | Recordatorios WhatsApp, courier/SII automáticos, farmacia | ⬜ |
| 8 | Escala | SEO, marketing, fidelización, membresía | ⬜ |

## Notas por fase (solo punteros — no duplicar)

- **Fases 0–2:** entregables y rationale en `history/00–03` + BRANDING/DESIGN_SYSTEM/UX. Decisiones D1–D11.
- **Fase 3:** orden de trabajo y estado por ítem en `AUDIT_UI_UX.md`; arquitectura resultante en `FRONTEND_ARCHITECTURE.md`. Decisiones D12–D19. Lo que queda (Polish lote 2 + track fotográfico) está en pausa por assets (U090).
- **Fase 4:** D20 (monorepo + reglas `ARCHITECTURE.md §2`) y D21 (Medusa v2, "e-commerce primero"). D22 colapsó lo restante dentro de la construcción del MVP.
- **Fase 5 (activa):** cronología completa en `DECISIONS.md` D22–D39; frentes abiertos y siguiente paso en `CURRENT_STATE.md`; tareas en `TODO.md`. Regla de la fase (D22): cada decisión se evalúa por *¿acerca o retrasa el lanzamiento?*; alternativa manual por defecto.
- **Fases 6–7 (post-tracción):** suscripción recurrente (el moat transaccional), motor de anticipación completo, Webpay, courier/SII/WhatsApp automáticos.
