# CLAUDE.md — Puerta de entrada del proyecto Manada

> **Para Claude (y cualquier colaborador) que abra este proyecto. Léeme primero.**

## ⚠️ Antes de responder cualquier cosa

1. La carpeta **`/ai-context` es la fuente oficial y única de verdad** del proyecto. No dependas del historial del chat.
2. Orden de lectura para orientarte (no leas más de lo que tu tarea necesita):
   1. `ai-context/CURRENT_STATE.md` — **único dueño del estado: dónde estamos, frentes abiertos y desde dónde seguir.**
   2. `ai-context/PROJECT_MASTER.md` — visión, estrategia y resumen de decisiones.
   3. `ai-context/DECISIONS.md` — qué se decidió y por qué (append-only; **no re-litigar**). Consúltalo por entrada (D#), no completo.
   4. `ai-context/ROADMAP.md` (fases) y `ai-context/TODO.md` (detalle táctico).
   5. El/los archivos temáticos **dueños del dominio de tu tarea** — mapa de owners en `ai-context/PROJECT_HEALTH_REPORT.md §3` (marca → `BRANDING.md` · visual → `DESIGN_SYSTEM.md` · UX → `UX.md` · stack/repo → `ARCHITECTURE.md` · frontend → `FRONTEND_ARCHITECTURE.md` + `COMPONENT_LIBRARY.md` · datos → `DATABASE.md` · contratos → `API.md` · deploy → `DEPLOYMENT.md` · funnel → `FUNNEL_TARGET.md` · perfil logueado → `PET_EXPERIENCE_TARGET.md` · motor de recomendación/nutrición → `RECOMMENDATION_ENGINE.md`).
3. `ai-context/history/` es archivo histórico: **no se lee por defecto** y nunca se borra.

## 🧭 Cómo continuar el proyecto en un chat nuevo

> Copia esto al abrir un chat nuevo:
>
> "Lee `ai-context/CURRENT_STATE.md` y `ai-context/PROJECT_MASTER.md` de este proyecto (la carpeta `/ai-context` es la fuente oficial de verdad; `CLAUDE.md` explica el mapa). Dime un resumen del estado antes de proponer nada. Luego continuamos desde el frente que indica `CURRENT_STATE.md`."

## 📌 Qué es Manada (lo que no cambia)

- **Proyecto:** e-commerce de mascotas en Chile (alimento + accesorios + farmacia) con suscripción inteligente como motor. Nombre **Manada** · dominio `tumanada.cl` (D8).
- **Concepto rector:** *"Te conoce como nadie y se anticipa a lo que tu mascota necesita."*
- **Stack:** monorepo pnpm — `apps/web` (Next.js 16) + `apps/backend` (**Medusa.js v2**, principio "e-commerce primero", D21). Reglas arquitectónicas permanentes en `ARCHITECTURE.md §2` (backend SOLO en `apps/backend`; comunicación solo vía los contratos de `API.md`; contrato primero, código después).
- **Estado, fase activa y siguiente paso:** ver **`ai-context/CURRENT_STATE.md`** (no se duplica aquí).

## 🔧 Reglas de trabajo del proyecto

- Tratar el proyecto como **startup profesional**: cada hito actualiza la documentación permanente en `/ai-context`.
- **Un hecho, un dueño** (reglas anti-deuda: `ai-context/PROJECT_HEALTH_REPORT.md §5`). El estado vive solo en `CURRENT_STATE.md`; las decisiones solo en `DECISIONS.md`; los demás docs apuntan.
- **Nunca eliminar información previa**; anexar o archivar en `ai-context/history/`.
- Toda decisión se registra en `DECISIONS.md` con rationale.
- Al cerrar un hito: barrido de punteros — reescribir `CURRENT_STATE.md`, entrada + índice en `DECISIONS.md`, fila en `PROJECT_MASTER.md §16`, `ROADMAP.md`/`TODO.md` si cambia el plan, y el doc temático dueño.
- Estrategia antes que estética. Modo de trabajo por bloques: un bloque → validado por Carlos → un commit; frontend primero, integración backend como pasada separada.
- Antes de tocar `apps/web`: leer `apps/web/AGENTS.md` (Next 16 tiene cambios de ruptura).
