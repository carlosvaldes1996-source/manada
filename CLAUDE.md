# CLAUDE.md — Puerta de entrada del proyecto Manada

> **Para Claude (y cualquier colaborador) que abra este proyecto. Léeme primero.**

## ⚠️ Antes de responder cualquier cosa

1. **Lee TODA la carpeta `/ai-context`.** Es la **fuente oficial y única de verdad** del proyecto. No dependas del historial del chat.
2. Orden de lectura recomendado:
   1. `ai-context/PROJECT_MASTER.md` — visión completa y decisiones.
   2. `ai-context/CURRENT_STATE.md` — **dónde estamos AHORA y desde dónde seguir.**
   3. `ai-context/DECISIONS.md` — qué se decidió y por qué (no re-litigar).
   4. `ai-context/TODO.md` y `ai-context/ROADMAP.md` — qué falta y en qué orden.
   5. Archivos temáticos según la fase (`BRANDING.md`, `UX.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `DATABASE.md`, `API.md`).
3. Comprende completamente el contexto y úsalo como base para todas tus decisiones.

## 🧭 Cómo continuar el proyecto en un chat nuevo

> Copia esto al abrir un chat nuevo:
>
> "Lee toda la carpeta `/ai-context` de este proyecto. Es la fuente oficial de verdad. Empieza por `PROJECT_MASTER.md` y `CURRENT_STATE.md`, entiende el contexto completo y dime un resumen del estado antes de proponer nada. Luego continuamos desde donde indica `CURRENT_STATE.md`."

## 📌 Estado actual (resumen rápido)

- **Proyecto:** Manada — e-commerce de mascotas en Chile (alimento + accesorios + farmacia + suscripción inteligente).
- **Concepto rector:** *"Te conoce como nadie y se anticipa a lo que tu mascota necesita."*
- **Nombre/dominio:** Manada · `tumanada.cl` (definitivo, D8).
- **Fase activa:** ver `ai-context/CURRENT_STATE.md`. **Fases 0–2 ✅ completas** (marca + sistema visual + UX + prototipo HTML). **Fase 3 (Frontend) funcionalmente completa:** app Next.js en **`apps/web/`** — Etapa 1 (fundaciones) ✅ D13 · Etapa 2 (Component Library) ✅ D15 (~70 componentes, doc en `ai-context/COMPONENT_LIBRARY.md` + styleguide en `/dev/components`) · Etapa 3 (Pantallas + Activation Flow + modelo de compra de invitado) ✅ D16/D17 · Polish 3.4 **lote 1 ✅ D18** (tipografía opsz, escala, contrastes AA, redondeo CLP, motion calmado); **Polish restante ⏸ en pausa** hasta tener fotos (U090; fotos IA de ChatGPT por probar). **Fase activa: 4 — Arquitectura técnica (D19)** — **estructura física ✅ D20:** monorepo pnpm (`apps/web` frontend · `apps/backend` **reservado, sin código** · `packages/shared` solo con el primer contrato aprobado en `API.md`), con **reglas arquitectónicas permanentes en `ARCHITECTURE.md §2`** (el backend vive SOLO en `apps/backend`, jamás dentro del frontend; comunicación solo vía la API de `API.md`; contrato primero, código después) · **stack backend ✅ D21: Medusa.js v2** bajo el principio **"e-commerce primero"** (el moat — perfil/suscripción/anticipación — se construye como módulos custom de Medusa, sin fork del core). **Fase activa: 5 — MVP (D22, MVP-first):** la arquitectura base queda **cerrada**; cada decisión se evalúa por *¿acerca o retrasa el lanzamiento?* con **alternativa manual por defecto** — envíos y boleta **manuales**, **sin courier/SII/WhatsApp hasta tracción**. Foco inmediato: **scaffold de Medusa en `apps/backend`** + modelo de datos mínimo del checkout + medio de pago (Webpay Plus objetivo; transferencia/pago manual como piso) + checkout punta a punta. El moat se construye tras el MVP transaccional. Para continuar en un chat nuevo usa el **prompt #9** de `ai-context/PROMPTS.md`.

## 🔧 Reglas de trabajo del proyecto

- Tratar el proyecto como **startup profesional**: cada fase genera documentación permanente en `/ai-context`.
- **Nunca eliminar información previa**; anexar o archivar en `ai-context/history/`.
- Toda decisión se registra en `DECISIONS.md` con rationale.
- Al cerrar una fase: actualizar `PROJECT_MASTER.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `ROADMAP.md`, `TODO.md` y el archivo temático correspondiente.
- Estrategia antes que estética. No avanzar a diseño sin posicionamiento cerrado.
