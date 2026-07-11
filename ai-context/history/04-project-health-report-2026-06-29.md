> **🗄️ ARCHIVADO (2026-07-11).** Informe de la consolidación documental del 2026-06-29 (D1–D15, pre-backend). Superseded por el `PROJECT_HEALTH_REPORT.md` vivo de la refactorización 2026-07-11. Se conserva como registro histórico.

# PROJECT_HEALTH_REPORT — Auditoría y consolidación documental de Manada

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Informe de sanidad documental + bitácora de la consolidación de gobernanza. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | ✅ Consolidación 2026-06-29 completada |
> | **Last Updated** | 2026-06-29 |
> | **Depends On** | toda la carpeta `/ai-context` |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ del *estado de salud de la documentación*. |

---

## 1. Resumen ejecutivo

La documentación de Manada estaba **bien estructurada y con buena disciplina de bitácora**, pero arrastraba **deuda de coherencia típica de un proyecto que avanzó rápido**: el documento maestro y varios estados quedaron "congelados" en el cierre de la Etapa 1 mientras el trabajo ya iba en la Etapa 2, había un artefacto de corrupción en el backlog, faltaba metadata de gobernanza y un brief ya cumplido seguía en la carpeta activa.

Se auditaron **17 documentos** de `/ai-context`, **4** de `history/`, los **3** docs de `web/` y **5** READMEs de componentes, contrastándolos contra el **código real** en `web/src`. Resultado: **12 problemas** detectados (1 crítico, 3 altos, 5 medios, 3 bajos), **todos corregidos**. Se añadió **metadata consistente** a los 14 documentos activos, se **archivó** 1 documento obsoleto y se **reescribió** el README del frontend.

**Veredicto:** la base documental queda **impecable, consistente y lista** para iniciar la **Fase 3.3 (Pantallas)** sin arrastrar contradicciones. No se detectó deuda estratégica (las decisiones D1–D15 son coherentes entre sí); la deuda era de *mantenimiento*, no de *criterio*.

---

## 2. Arquitectura documental (después de la consolidación)

**14 documentos activos** en `/ai-context`, cada uno con dominio único y metadata:

| Documento | Dominio | Source of Truth de |
|---|---|---|
| `README.md` | Índice y reglas | mapa documental |
| `PROJECT_MASTER.md` | Visión + estrategia | visión y estrategia |
| `CURRENT_STATE.md` | Estado actual | estado y siguiente paso |
| `DECISIONS.md` | Bitácora D1–D15 | decisiones y rationale |
| `ROADMAP.md` | Fases 0–8 | fases y orden |
| `TODO.md` | Tareas tácticas | (derivado) |
| `BRANDING.md` | Marca, voz, naming | marca |
| `DESIGN_SYSTEM.md` | Sistema visual, tokens | tokens y reglas visuales |
| `UX.md` | IA, journeys, wireframes | IA y flujos |
| `ARCHITECTURE.md` | Stack, infra, integraciones | stack/infra |
| `FRONTEND_ARCHITECTURE.md` | Estructura `web/` + ejecución | arquitectura frontend |
| `COMPONENT_LIBRARY.md` | Catálogo de componentes | uso de componentes |
| `AUDIT_UI_UX.md` | Backlog UI/UX (108 ítems) | mejoras de frontend |
| `DATABASE.md` / `API.md` | Borradores Fase 4 | datos / contratos (futuro) |
| `PROMPTS.md` | Prompts reutilizables | prompts operativos |
| `PROJECT_HEALTH_REPORT.md` | Sanidad documental | salud de la doc |

**`history/`** (nunca se borra): estrategia de negocio, benchmarking, estrategia de marca, `PROJECT_MASTER_v0`, y ahora **`03-fase-2-prototype-brief.md`** (archivado).

**Código:** `prototype/` (referencia visual/copy de Fase 2) · `web/` (app real, con `web/AGENTS.md` como guía operativa).

---

## 3. Mapa de dependencias

```
                         PRODUCT / ESTRATEGIA
              (PROJECT_MASTER ← history/estrategia-negocio)
                                  │
                              BRANDING
                                  │
                            DESIGN_SYSTEM
                                  │
                                 UX
                                  │
        ┌─────────────── FRONTEND ───────────────┐
        │  FRONTEND_ARCHITECTURE                   │
        │  COMPONENT_LIBRARY                        │
        │  AUDIT_UI_UX                              │
        └──────────────────┬──────────────────────┘
                            │
                         BACKEND  (Fase 4)
                  ARCHITECTURE → DATABASE → API

  Transversal (gobernanza): DECISIONS · ROADMAP · TODO · CURRENT_STATE
  Meta: README · PROMPTS · PROJECT_HEALTH_REPORT
```

Regla: un documento **nunca** debe contradecir a su upstream. Si una decisión cambia un upstream, se anexa entrada en `DECISIONS.md` y se propaga hacia abajo.

---

## 4. Problemas encontrados (informe de sanidad)

| Estado | Problema | Impacto | Recomendación | Archivo | Prioridad |
|---|---|---|---|---|---|
| ✅ Corregido | Tags basura `</content></invoke>` al final | Rompe markdown; señal de descuido | Eliminar artefacto | `AUDIT_UI_UX.md` | **CRÍTICO** |
| ✅ Corregido | Cabecera "siguiente: Etapa 2" (ya hecha en D15) | Desorienta al próximo chat | Sincronizar con D15 | `PROJECT_MASTER.md` | **ALTO** |
| ✅ Corregido | Tabla de decisiones solo hasta D11 | D12–D15 invisibles en el maestro | Añadir D12–D15 | `PROJECT_MASTER.md §16` | **ALTO** |
| ✅ Corregido | "Inmediato: construir prototipo" (ya hecho) | Tarea cerrada como pendiente | Reapuntar a Etapa 3 | `PROJECT_MASTER.md §17` | **ALTO** |
| ✅ Corregido | "🔄 Fase 2 (activa)" — Fase 2 completa | Estado contradictorio | Marcar Fase 2 ✅ | `PROJECT_MASTER §12`, `UX.md`, `TODO.md` | **MEDIO** |
| ✅ Corregido | Cuerpo con plan viejo (`tailwind.config.ts`, rutas `plp/pdp`, ~52 comp.) | Contradice D13 | Marcar §§1–8 como plan; §9 manda | `FRONTEND_ARCHITECTURE.md` | **MEDIO** |
| ✅ Corregido | D12 "ACTIVO" pese a estar ejecutado | Decisión sin marcar superada | Marcar ✅ EJECUTADA | `DECISIONS.md` | **MEDIO** |
| ✅ Corregido | Referencia a "Supabase" nunca decidida | Tecnología fantasma | "Medusa u otro, a validar" | `FRONTEND_ARCHITECTURE.md` | **MEDIO** |
| ✅ Corregido | README boilerplate (Geist, npm) | Falso (Fraunces/Hanken, pnpm) | Reescribir real | `web/README.md` | **MEDIO** |
| ✅ Corregido | Ausencia de metadata de gobernanza | Sin trazabilidad de estado/owner | Añadir bloque a todos | todos | **MEDIO** |
| ✅ Corregido | "pendiente incorporar a TODO/ROADMAP" (ya hecho) | Nota obsoleta | Actualizar changelog | `AUDIT_UI_UX.md` | **BAJO** |
| ✅ Corregido | "~50 componentes" vs ~70 reales | Cifra desactualizada | Actualizar a ~70 | `ARCHITECTURE.md` | **BAJO** |

**Verificación contra código:** el catálogo de `COMPONENT_LIBRARY.md` coincide con `web/src/components/{ui,layout,commerce,pet}`; las rutas declaradas (`/categoria/[slug]`, `/producto/[slug]`, `/carrito`, `/checkout`, `/cuenta`, `/cuenta/mascotas`, `/dev/*`) existen; el stack documentado (Next 16.2.9, React 19.2, pnpm, sin `tailwind.config.ts`) coincide con `package.json` y el árbol real. **Sin referencias a archivos inexistentes.**

---

## 5. Cambios aplicados (PASO 9)

**Problemas corregidos:** los 12 de la tabla §4.

**Contradicciones resueltas:**
1. Estado de fase (Etapa 2 hecha) sincronizado en PROJECT_MASTER, CURRENT_STATE, TODO, ROADMAP.
2. "Fase 2 activa" → "Fase 2 completa" en PROJECT_MASTER, UX, TODO.
3. D12 "ACTIVO" → "✅ EJECUTADA por D13/D15".
4. Plan viejo vs realidad en FRONTEND_ARCHITECTURE: se priorizó §9 explícitamente.
5. Stack: "shadcn/Supabase" → realidad (Radix; backend a validar).

**Documentos creados:** `PROJECT_HEALTH_REPORT.md` (este).

**Documentos archivados (a `history/`):** `PROTOTYPE_BRIEF.md` → `history/03-fase-2-prototype-brief.md` (con cabecera de archivado). El prototipo ya se construyó; sus fuentes de verdad vivas son BRANDING/DESIGN_SYSTEM/UX/COMPONENT_LIBRARY.

**Documentos fusionados:** ninguno. *Rationale:* DATABASE/API son stubs de dominios distintos que crecerán en Fase 4; fusionarlos ahora para re-dividirlos luego sería churn. FRONTEND_ARCHITECTURE y COMPONENT_LIBRARY se solapan parcialmente pero cumplen roles distintos (arquitectura vs catálogo de uso) — se mantienen separados.

**Documentos eliminados:** ninguno (regla del proyecto: nunca borrar, solo archivar).

**Documentos reescritos:** `web/README.md` (de boilerplate de create-next-app a guía real del frontend).

**Metadata añadida** (Purpose/Owner/Status/Last Updated/Depends On/Supersedes/Source of Truth) a los 14 documentos activos + este informe.

**Referencias actualizadas:** README (índice), PROMPTS (#5 marcado histórico), enlaces a PROTOTYPE_BRIEF reapuntados a su nueva ruta.

---

## 6. Revisión de decisiones (D1–D15)

| Decisión | Vigencia |
|---|---|
| D1 Modelo de negocio | ✅ vigente |
| D2 Stack custom headless | ✅ vigente |
| D3 Nombre de trabajo "Manada" | ✅ cerrada por D8 |
| D4 Amor como alma sobre moat | ✅ vigente |
| D5 Concepto rector C1 | ✅ vigente |
| D6 Arquitectura de marca | ✅ vigente |
| D7 Sistema /ai-context | ✅ vigente |
| D8 Nombre definitivo · `tumanada.cl` | 🔒 LOCKED |
| D9 Dirección visual | 🔒 LOCKED |
| D10 Logo huella-manada | 🔒 LOCKED (vector pendiente) |
| D11 Sistema visual completo | 🔒 LOCKED |
| D12 Prototipo → componentes Next.js | ✅ **ejecutada** por D13/D15 (ya no "activa") |
| D13 Etapa 1 Fundaciones | 🔒 LOCKED |
| D14 Auditoría → backlog | 🟢 ACTIVO (backlog vivo) |
| D15 Etapa 2 Component Library | 🔒 LOCKED (espera aprobación Etapa 3) |

No hay decisiones contradictorias ni reemplazadas sin marcar. El único ajuste fue **D12** (de "ACTIVO/solo planificar" a "EJECUTADA"). Resumen de vigencia añadido al encabezado de `DECISIONS.md`.

---

## 7. Estado general del proyecto

- **Fases 0–2:** ✅ completas (estrategia, marca, sistema visual, UX, prototipo).
- **Fase 3 (Frontend):** 🔄 en curso — Etapa 1 (D13) y Etapa 2 (D15) ✅; **Etapa 3 (Pantallas) = siguiente, espera aprobación**.
- **Fases 4–8:** ⬜ pendientes (backend, MVP, diferenciador, inteligencia, escala).
- **Documentación:** 🟢 **saludable** — consistente, con metadata, sin contradicciones ni artefactos.
- **Deuda documental restante:** ninguna crítica. Pendientes menores: el cuerpo histórico de FRONTEND_ARCHITECTURE §§1–8 se conserva como plan (marcado); puede limpiarse cuando se cierre la Fase 3.

---

## 8. Recomendaciones antes de continuar con Fase 3.3

1. **Aprobar formalmente la Component Library (D15)** — la Etapa 3 está bloqueada esperando tu OK explícito (mandato del brief de Fase 3).
2. **Usar el prompt #7 de `PROMPTS.md`** para abrir el chat de Etapa 3; ensamblar pantallas **solo** con componentes existentes (token → componente → página).
3. **Priorizar los P0 de Fase 3.3** de `AUDIT_UI_UX.md`: U040 (coherencia de fechas), U041 (doble identidad de la home), U042 (free-shipping real), U043 (PLP no oculta catálogo).
4. **Mantener la disciplina de metadata:** al cerrar cada etapa, actualizar `Last Updated` y `Status` del doc tocado (usar prompt #2).
5. **Fotografía real (U090)** sigue siendo el bloqueador #1 del *polish* (Etapa 4): conviene iniciar su gestión en paralelo, no bloquea la Etapa 3.
6. **Higiene futura:** cuando se inicie la Fase 4, considerar limpiar las §§1–8 de FRONTEND_ARCHITECTURE (dejar solo la realidad ejecutada) y desarrollar DATABASE/API desde sus stubs.

---

## 9. Changelog de consolidación

- **2026-06-29** — Auditoría documental completa (PASOS 1–8) + consolidación (PASO 9). 12 problemas corregidos, metadata añadida a 14 docs, `PROTOTYPE_BRIEF.md` archivado, `web/README.md` reescrito, este informe creado. Sin pérdida de información (todo lo retirado vive en `history/`).