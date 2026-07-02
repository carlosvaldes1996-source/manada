# /ai-context — Fuente oficial del proyecto Manada

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Índice y reglas de la carpeta de documentación oficial. Puerta de entrada a la fuente de verdad. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-06-29 |
> | **Depends On** | — (es el índice) |
> | **Supersedes** | esquema previo `/docs` (D7) |
> | **Source of Truth** | ✅ del *mapa documental*. |

Esta carpeta es la **fuente única y oficial de verdad** del proyecto. No depende del historial de ningún chat. Cada documento abre con su propio bloque de **Metadata** (Purpose / Owner / Status / Last Updated / Depends On / Supersedes / Source of Truth).

## 🆕 Prompt de onboarding (para un chat nuevo)

> Lee toda la carpeta `/ai-context`. Esta carpeta contiene la fuente oficial del proyecto. Antes de responder cualquier cosa, comprende completamente el contexto y úsala como base para todas tus decisiones. Empieza por `PROJECT_MASTER.md`, luego `CURRENT_STATE.md` y `DECISIONS.md`.

## 📁 Mapa de archivos

| Archivo | Qué contiene |
|---|---|
| `PROJECT_MASTER.md` | Documento maestro: solo decisiones. Visión completa del proyecto. |
| `CURRENT_STATE.md` | Dónde estamos AHORA. Lo primero que cambia cada sesión. |
| `DECISIONS.md` | Bitácora de decisiones (qué, por qué, cuándo). Append-only. |
| `TODO.md` | Pendientes y decisiones abiertas. |
| `ROADMAP.md` | Fases del proyecto y su estado. |
| `BRANDING.md` | Estrategia de marca, concepto rector, naming, voz. |
| `UX.md` | Arquitectura de información, journeys, wireframes. |
| `ARCHITECTURE.md` | Stack, infraestructura, integraciones CL. |
| `DESIGN_SYSTEM.md` | Tokens, paleta, tipografía, componentes. |
| `FRONTEND_ARCHITECTURE.md` | Plan e inventario del sistema de componentes Next.js (`web/`); estado de ejecución por etapa. |
| `COMPONENT_LIBRARY.md` | **Catálogo de la librería de componentes (Etapa 2) y cuándo usar cada uno.** Styleguide vivo en `/dev/components`. |
| `AUDIT_UI_UX.md` | Backlog priorizado de mejoras de UI/UX (108 ítems). Fuente de verdad de frontend; se actualiza por etapa. |
| `DATABASE.md` | Modelo de datos, entidades, relaciones (borrador Fase 4). |
| `API.md` | Endpoints, contratos, integraciones externas (borrador Fase 4). |
| `PROMPTS.md` | Prompts reutilizables e importantes del proyecto. |
| `PROJECT_HEALTH_REPORT.md` | Informe de sanidad documental + bitácora de consolidaciones. |
| `history/` | Archivo histórico por fase (incl. `03-fase-2-prototype-brief.md`). **Nunca se borra.** |

> **Código del proyecto** (fuera de `/ai-context`):
> - `prototype/` — prototipo HTML estático de Fase 2 (referencia visual y de copy/voz; `assets/styles.css` con los tokens).
> - `web/` — **app Next.js real** (Fase 3 en curso). Tiene su propia guía operativa en `web/AGENTS.md`. Los tokens vivos están en `web/src/app/globals.css` (`@theme`), ya no en `styles.css`.

## 🔄 Reglas de mantenimiento

1. Al cerrar cada fase: actualizar `PROJECT_MASTER.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `ROADMAP.md`, `TODO.md` y el archivo temático correspondiente.
2. **Nunca eliminar información anterior**; se anexa o se versiona en `history/`.
3. Toda decisión se registra con rationale en `DECISIONS.md`.
