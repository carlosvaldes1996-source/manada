# PROMPTS — Prompts operativos vivos

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Prompts reutilizables VIVOS (onboarding, continuación de frente, cierre de hito, voz de marca, comandos). Los de fases ya ejecutadas están en `history/07-prompts-historicos.md`. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-11 |
> | **Depends On** | CURRENT_STATE.md |
> | **Supersedes** | `history/07-prompts-historicos.md` (prompts #5–#10, cerrados) |
> | **Source of Truth** | ✅ de *prompts operativos*. |

## 1. Onboarding de un chat nuevo

```
Lee ai-context/CURRENT_STATE.md y ai-context/PROJECT_MASTER.md de este proyecto
(la carpeta /ai-context es la fuente oficial de verdad; CLAUDE.md explica el mapa
de documentos). Dame un resumen del estado antes de proponer nada. Luego
continuamos desde el frente que indica CURRENT_STATE.md.
```

## 2. Continuar un frente de trabajo (bloques)

```
Continuamos el frente "<nombre del frente>" de Manada. Lee primero
ai-context/CURRENT_STATE.md (estado + frentes abiertos) y el doc dueño del frente
(FUNNEL_TARGET.md / PET_EXPERIENCE_TARGET.md / DEPLOYMENT.md según corresponda).
No re-litigues decisiones: DECISIONS.md es append-only (consulta las D# citadas).

Modo de trabajo: un bloque pequeño → validado por Carlos → un commit. Frontend
primero; la integración backend es una pasada separada. Antes de tocar apps/web
lee apps/web/AGENTS.md (Next 16 tiene cambios de ruptura); respeta la Component
Library (COMPONENT_LIBRARY.md) y los tipos existentes: mapear, no reescribir.
Verifica con tsc + lint + build + smoke de las rutas tocadas.
```

## 3. Cerrar un hito (mantenimiento de documentación)

```
Cerramos este hito. Haz el barrido de punteros (PROJECT_HEALTH_REPORT.md §5):
(1) entrada nueva con rationale en DECISIONS.md + índice de vigencia,
(2) REESCRIBE ai-context/CURRENT_STATE.md como foto del nuevo presente (no apiles),
(3) fila en PROJECT_MASTER.md §16, (4) ROADMAP.md/TODO.md si cambió el plan,
(5) el doc temático dueño del dominio, con su Last Updated.
No elimines información anterior; lo superado se archiva en history/ con cabecera.
```

## 4. Tono de marca (para generar copy)

```
Escribe en la voz de Manada: cálida + experta, tuteo chileno, beneficio antes
que característica, frases cortas, habla de la mascota por su nombre. Concepto
rector: "te conocemos como nadie y nos anticipamos a lo que tu mascota necesita".
Honestidad: jamás prometer lo que el producto aún no hace (D28/D29).
```

## 5. Rol de trabajo (consultora)

```
Actúa como una agencia de diseño y desarrollo de e-commerce de clase mundial.
Estrategia antes que estética. No avances a diseño visual sin posicionamiento cerrado.
```

## 6. Cómo correr / verificar

```bash
# Frontend (apps/web) — desde la raíz:
pnpm dev            # http://localhost:3000 · /dev/components · /dev/tokens (solo dev)
pnpm build && pnpm lint
pnpm --filter @manada/web exec tsc --noEmit

# Backend (apps/backend) — setup completo en apps/backend/DEV.md:
createdb medusa_manada   # si falta
pnpm install && pnpm migrate:backend && pnpm seed:backend
pnpm dev:backend    # http://localhost:9000 · Admin en /app
# Publishable key:
psql -d medusa_manada -tAc "select token from api_key where type='publishable';"
```
