# PROJECT_HEALTH_REPORT — Auditoría y refactorización documental 2026-07-11

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Informe de sanidad documental + bitácora de consolidaciones. Registra qué se auditó, qué se encontró y qué se cambió. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | ✅ Refactorización 2026-07-11 completada y validada (ver §6 changelog) |
> | **Last Updated** | 2026-07-11 |
> | **Depends On** | toda la carpeta `/ai-context` |
> | **Supersedes** | `history/04-project-health-report-2026-06-29.md` (consolidación anterior) |
> | **Source of Truth** | ✅ del *estado de salud de la documentación y las reglas anti-deuda (§5)*. |

---

## 1. Resumen ejecutivo

Segunda consolidación documental del proyecto (la primera fue 2026-06-29, archivada en `history/04`). Se auditaron los **20 documentos activos** de `/ai-context`, los **5 históricos**, `CLAUDE.md` y el código real (`apps/web`, `apps/backend`) como contraste.

**Veredicto de la auditoría:** la **arquitectura documental es correcta y se conserva** — docs temáticos con owner único, `DECISIONS.md` append-only, `history/` aislado, metadata de gobernanza. No se reestructura por reestructurar. El problema no era de estructura sino de **drift y duplicación de estado**: el proyecto avanzó de D28 a D39 en 5 días (backend con módulo custom, funnel F1–F4, Pet Experience B1–B6, integración O5) y varias superficies quedaron congeladas en D28 o duplicando lo que ya vive en `DECISIONS.md`.

## 2. Problemas encontrados (auditoría 2026-07-11)

| # | Problema | Impacto | Archivo(s) | Prioridad | Estado |
|---|---|---|---|---|---|
| 1 | **El "estado actual" existe redactado 5 veces** (CLAUDE.md §📌, README, PROJECT_MASTER cabecera+§17, CURRENT_STATE, ROADMAP cabecera), con distintos grados de desactualización. Un chat nuevo lee versiones contradictorias del mismo hecho. | ALTO — consumo de contexto ×5 + contradicciones | CLAUDE.md, README, PROJECT_MASTER, ROADMAP, TODO | **CRÍTICO** | ✅ Corregido (un solo dueño: CURRENT_STATE; el resto = puntero) |
| 2 | **CURRENT_STATE degeneró en bitácora histórica**: "Último avance" duplica entradas de DECISIONS casi 1:1 (~40% del archivo); "Siguiente paso" arrastra "registro histórico". Dejó de ser una foto. | ALTO — duplica al owner (DECISIONS) y crece sin límite | CURRENT_STATE.md | **CRÍTICO** | ✅ Corregido (foto real; bitácora → `history/05`) |
| 3 | **Tabla de decisiones de PROJECT_MASTER §16 llega a D28**; existen D29–D39. Cabecera de estado congelada en "Fase activa: 4". §15 dice "Base de datos ⬜ pendiente" con DATABASE.md §5–8 implementados. | ALTO — el doc maestro contradice la realidad | PROJECT_MASTER.md | **ALTO** | ✅ Corregido |
| 4 | **Índice de vigencia de DECISIONS llega a D28** (existen D29–D39 como entradas pero no en el índice); metadata `Last Updated 2026-07-06` con entradas del 07-11. | MEDIO | DECISIONS.md | **ALTO** | ✅ Corregido |
| 5 | **"`apps/backend` RESERVADO sin código"** repetido en ARCHITECTURE §1, README, CLAUDE.md — falso desde D22 (scaffold) y doblemente falso desde D34 (módulo custom `pet` con migraciones). ARCHITECTURE §3/§5 con pendientes ya decididos (medio de pago, versión de Medusa). | ALTO — un agente puede "reservar" lo que ya existe | ARCHITECTURE.md, README.md, CLAUDE.md | **ALTO** | ✅ Corregido |
| 6 | **ROADMAP duplica TODO** (el detalle de Fase 5 está casi verbatim en ambos) y ambos quedaron en el punto "resta infra + terceros" sin reflejar los frentes reales abiertos (infra WIP, funnel F5, Pet Experience B4/B7) ni que el perfil de mascota ya se persiste (D34, matiza el "moat diferido"). | MEDIO | ROADMAP.md, TODO.md | **ALTO** | ✅ Corregido (detalle táctico = TODO; ROADMAP = fases) |
| 7 | **FRONTEND_ARCHITECTURE §§1–8 es el plan original de 2026-06-27** ya superado (dice `tailwind.config.ts`, rutas `plp/pdp`, ~52 componentes, "backend a validar"); §9 congelado en D16. La consolidación anterior ya recomendó limpiarlo al iniciar Fase 4. | MEDIO — 200 líneas de contexto muerto por lectura | FRONTEND_ARCHITECTURE.md | **MEDIO** | ✅ Corregido (plan → `history/06`; doc reescrito a la realidad) |
| 8 | **COMPONENT_LIBRARY §2/§7 citan módulos eliminados**: `lib/data/catalog.ts` (eliminado en D33-i2), `seedPets` (eliminado en D34-i4), "datos demo Carlos+Toby" como estado global (la sesión es real desde D26). Status: "espera aprobación antes de Etapa 3" (cerrada hace 8 días). | MEDIO — referencias rotas a código inexistente | COMPONENT_LIBRARY.md | **MEDIO** | ✅ Corregido |
| 9 | **API.md/DATABASE.md §§1–4 "borrador"** contradicen las secciones implementadas (§2 API dice "REST/GraphQL a definir"; DATABASE §1 describe como futuro lo que §8 ya materializó). Metadata desactualizada. | MEDIO | API.md, DATABASE.md | **MEDIO** | ✅ Corregido (borradores marcados como superseded, sin borrar) |
| 10 | **PROMPTS.md: 6 de 10 prompts son históricos** (marcados ✅ hechos) y CLAUDE.md instruía "usa el prompt #10", que está cerrado. | MEDIO — instrucción de arranque apunta a un flujo terminado | PROMPTS.md, CLAUDE.md | **MEDIO** | ✅ Corregido (históricos → `history/07`) |
| 11 | **PROJECT_HEALTH_REPORT de 2026-06-29** presentado como vigente ("listo para iniciar Fase 3.3"). | BAJO | PROJECT_HEALTH_REPORT.md | **BAJO** | ✅ Corregido (archivado en `history/04`; este lo reemplaza) |
| 12 | **DEPLOYMENT.md** correcto pero sin puntero al WIP de infra (Railway, en disco sin commitear) que lo va a modificar; checklist con ítems ya cumplidos sin marcar. | BAJO | DEPLOYMENT.md | **BAJO** | ✅ Corregido |

**Sanos, sin cambios de fondo:** BRANDING.md, DESIGN_SYSTEM.md, UX.md (fuentes de verdad estables de marca/visual/IA-UX), AUDIT_UI_UX.md (backlog vivo con owner claro), FUNNEL_TARGET.md y PET_EXPERIENCE_TARGET.md (docs de bloque al día, actualizados hasta D39), DEPLOYMENT.md (fiel a D27).

**Deuda que NO es documental (fuera de alcance, no se toca):** el WIP de infraestructura (Etapa 1 Railway) vive en el working tree sin commitear (`medusa-config.ts`, `railway.json`) con **D30 reservada** para su cierre; su nota de continuidad se preserva en `CURRENT_STATE.md`.

## 3. Arquitectura documental (confirmada, con owners)

**Regla de lectura para agentes:** para una tarea concreta NO se lee toda la carpeta; se lee `CURRENT_STATE.md` + el/los docs dueños del dominio de la tarea (tabla siguiente). `DECISIONS.md` se consulta por entrada puntual (D#), no completo.

| Documento | Único dueño de | Tipo |
|---|---|---|
| `README.md` | mapa documental + reglas de mantenimiento | meta |
| `CURRENT_STATE.md` | **estado actual + frentes abiertos + siguiente paso** | temporal |
| `DECISIONS.md` | decisiones y su rationale (D1…, append-only) | permanente |
| `ROADMAP.md` | fases 0–8 y su estado (vista alta) | temporal |
| `TODO.md` | detalle táctico de pendientes | temporal |
| `PROJECT_MASTER.md` | visión, estrategia, negocio, resumen de decisiones | permanente |
| `BRANDING.md` | marca, naming, voz, logo (concepto) | permanente |
| `DESIGN_SYSTEM.md` | tokens y reglas visuales | permanente |
| `UX.md` | IA de navegación, journeys, wireframes (visión UX) | permanente |
| `ARCHITECTURE.md` | stack, estructura del repo, reglas arquitectónicas, integraciones CL | permanente |
| `FRONTEND_ARCHITECTURE.md` | arquitectura real de `apps/web` | permanente |
| `COMPONENT_LIBRARY.md` | catálogo y uso de componentes | permanente |
| `AUDIT_UI_UX.md` | backlog de mejoras de frontend (U001–U122) | temporal (backlog vivo) |
| `DATABASE.md` | modelo de datos | permanente |
| `API.md` | contratos de API | permanente |
| `DEPLOYMENT.md` | configuración de despliegue e infra | permanente |
| `FUNNEL_TARGET.md` | experiencia objetivo del funnel + su plan de bloques | mixto (diseño + estado de bloques) |
| `PET_EXPERIENCE_TARGET.md` | experiencia objetivo del perfil logueado + su plan de bloques | mixto |
| `PROMPTS.md` | prompts operativos vivos | meta |
| `PROJECT_HEALTH_REPORT.md` | salud documental + reglas anti-deuda | meta |
| `history/` | contexto histórico aislado (nunca se borra, nunca se lee por defecto) | archivo |

## 4. Qué se archivó en esta consolidación (sin pérdida de información)

| Archivo nuevo en `history/` | Contenido | Origen |
|---|---|---|
| `04-project-health-report-2026-06-29.md` | informe de la consolidación anterior | `PROJECT_HEALTH_REPORT.md` |
| `05-bitacora-avances-2026-07.md` | bitácora "Último avance" completa (D16→D32) + secciones históricas de CURRENT_STATE | `CURRENT_STATE.md` |
| `06-frontend-architecture-plan-2026-06-27.md` | plan original del sistema de componentes (§§1–8) | `FRONTEND_ARCHITECTURE.md` |
| `07-prompts-historicos.md` | prompts #5–#10 (fases ya ejecutadas) | `PROMPTS.md` |

## 5. Reglas anti-deuda documental (vinculantes desde 2026-07-11)

1. **Un hecho, un dueño.** Antes de escribir un hecho en un doc, pregunta: ¿este doc es su dueño (tabla §3)? Si no, escribe un puntero (`ver X.md §n` / `ver D#`), nunca una segunda redacción.
2. **El estado del proyecto vive SOLO en `CURRENT_STATE.md`.** CLAUDE.md, README, PROJECT_MASTER y ROADMAP no repiten el estado; apuntan.
3. **`CURRENT_STATE.md` es una foto, no una bitácora.** Al cerrar un hito: la narración completa va a `DECISIONS.md` (una entrada), y CURRENT_STATE se **reescribe** (no se apila) reflejando el nuevo presente. Máximo orientativo: ~100 líneas.
4. **Cierre de hito = barrido de punteros:** actualizar CURRENT_STATE (reescribir), DECISIONS (entrada + índice de vigencia), tabla §16 de PROJECT_MASTER (una fila), ROADMAP/TODO si cambia el plan, y el doc temático dueño. Nada más.
5. **Lo superado se archiva en `history/` con cabecera de archivado**, jamás se borra ni se deja "marcado como viejo" dentro del doc activo.
6. **Metadata al día:** todo doc tocado actualiza `Last Updated` y `Status` en el mismo cambio.
7. **`history/` no se lee por defecto.** Ningún prompt de arranque debe requerir leer benchmarking, debates de marca o briefs cumplidos para trabajar en código.

## 6. Changelog de consolidaciones

- **2026-06-29** — Primera consolidación (12 problemas, metadata de gobernanza, archivo de PROTOTYPE_BRIEF). Detalle en `history/04-project-health-report-2026-06-29.md`.
- **2026-07-11** — Auditoría completa (este informe, §2) + refactorización por ownership: estado con dueño único, CURRENT_STATE como foto, 4 archivos movidos a `history/`, docs técnicos realineados a la realidad D29–D39, reglas anti-deuda (§5). Registrada como **D40** en `DECISIONS.md`. Ejecutada en 6 commits con prefijo "Docs · Refactor 2026-07-11".
  - **Validación final (2026-07-11):** ✅ toda referencia a `.md` en docs activos resuelve a un archivo existente · ✅ cero punteros a prompts cerrados (`prompt #10`) o módulos eliminados (`lib/data/catalog`, `seedPets`) fuera de citas históricas · ✅ cero "apps/backend reservado" en docs activos · ✅ metadata (`Status`/`Last Updated`) al día en todos los docs tocados · ✅ `DECISIONS.md` intacta como append-only (solo se extendió el índice de vigencia y se anexó D40) · ✅ el WIP de infra (código sin commitear, D30 reservada) quedó preservado en `CURRENT_STATE.md §WIP`.
  - **Números:** docs activos 3.773 → **3.184 líneas** (−16%), con la baja concentrada en lo que se lee siempre: CLAUDE.md 53→37 · CURRENT_STATE 84→70 (antes crecía sin límite) · ROADMAP 81→34 · TODO 85→61 · PROMPTS 255→79 · FRONTEND_ARCHITECTURE 294→66. La ruta de onboarding pasó de "lee TODA la carpeta" (~4.300 líneas con history) a CLAUDE + CURRENT_STATE + PROJECT_MASTER (~280 líneas) + docs del dominio de la tarea.
