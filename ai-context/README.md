# /ai-context — Fuente oficial del proyecto Manada

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Índice y reglas de la carpeta de documentación oficial. Puerta de entrada a la fuente de verdad. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-11 |
> | **Depends On** | — (es el índice) |
> | **Supersedes** | esquema previo `/docs` (D7) |
> | **Source of Truth** | ✅ del *mapa documental*. |

Esta carpeta es la **fuente única y oficial de verdad** del proyecto. No depende del historial de ningún chat. Cada documento abre con su propio bloque de **Metadata** y es **dueño único** de su dominio (tabla de owners en `PROJECT_HEALTH_REPORT.md §3`): un hecho vive en un solo documento; los demás apuntan.

## 🆕 Onboarding de un chat nuevo

> Lee `CURRENT_STATE.md` (estado + siguiente paso) y `PROJECT_MASTER.md` (visión). Luego abre **solo** los docs dueños del dominio de tu tarea. `DECISIONS.md` se consulta por entrada (D#); `history/` no se lee por defecto.

## 📁 Mapa de archivos

| Archivo | Qué contiene (y de qué es dueño) |
|---|---|
| `CURRENT_STATE.md` | **Estado actual, frentes abiertos, siguiente paso.** Único dueño del estado; se reescribe por hito. |
| `PROJECT_MASTER.md` | Visión, estrategia, negocio, resumen de decisiones (tabla D#). |
| `DECISIONS.md` | Bitácora de decisiones con rationale (D1–D40…). Append-only. |
| `ROADMAP.md` | Fases 0–8 y su estado (vista alta; el detalle táctico vive en TODO). |
| `TODO.md` | Detalle táctico de pendientes por frente. |
| `BRANDING.md` | Estrategia de marca, concepto rector, naming, voz, logo. |
| `UX.md` | Arquitectura de información, journeys, wireframes (visión UX). |
| `DESIGN_SYSTEM.md` | Tokens, paleta, tipografía, motion, reglas visuales. |
| `ARCHITECTURE.md` | Stack, estructura del monorepo, **reglas arquitectónicas (§2)**, integraciones CL. |
| `FRONTEND_ARCHITECTURE.md` | Arquitectura real de `apps/web` (estructura, providers, capa de datos). |
| `COMPONENT_LIBRARY.md` | Catálogo de componentes y cuándo usar cada uno. Styleguide vivo en `/dev/components`. |
| `AUDIT_UI_UX.md` | Backlog priorizado de mejoras de UI/UX (U001–U122), vivo. |
| `DATABASE.md` | Modelo de datos (catálogo, cuentas, envío, mascota — Medusa-native + módulo `pet`). |
| `API.md` | Contratos de API implementados (§5 catálogo · §6 carrito/checkout · §7 cuentas · §8 buscador/envío · §9 mascotas). |
| `DEPLOYMENT.md` | Hosting, env vars, ramas, checklist del primer deploy funcional. |
| `FUNNEL_TARGET.md` | Experiencia objetivo del funnel de adquisición + plan de bloques F1–F5. |
| `PET_EXPERIENCE_TARGET.md` | Experiencia objetivo del perfil logueado + plan de bloques B1–B7. |
| `PROMPTS.md` | Prompts operativos vivos. |
| `PROJECT_HEALTH_REPORT.md` | Salud documental, **mapa de owners (§3)** y **reglas anti-deuda (§5)**. |
| `history/` | Archivo histórico por fase (estrategia, benchmarking, briefs cumplidos, versiones archivadas). **Nunca se borra; no se lee por defecto.** |

> **Código del proyecto** (fuera de `/ai-context`):
> - `apps/web/` — frontend Next.js real (guía operativa: `apps/web/AGENTS.md`; tokens vivos en `src/app/globals.css`).
> - `apps/backend/` — backend **Medusa v2 real** (setup local: `apps/backend/DEV.md`; módulo custom `pet` desde D34).
> - `prototype/` — prototipo HTML de Fase 2, congelado (referencia visual y de copy/voz).

## 🔄 Reglas de mantenimiento

1. **Un hecho, un dueño; los demás apuntan.** Reglas completas anti-deuda en `PROJECT_HEALTH_REPORT.md §5`.
2. Al cerrar cada hito: barrido de punteros (reescribir `CURRENT_STATE.md`, entrada + índice en `DECISIONS.md`, fila en `PROJECT_MASTER.md §16`, `ROADMAP.md`/`TODO.md` si cambia el plan, y el doc temático dueño).
3. **Nunca eliminar información anterior**; se archiva en `history/` con cabecera de archivado.
4. Toda decisión se registra con rationale en `DECISIONS.md`.
