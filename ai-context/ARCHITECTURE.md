# ARCHITECTURE — Stack, estructura del repo, infraestructura, integraciones CL

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Stack técnico, estructura física del repositorio, reglas arquitectónicas, infraestructura e integraciones Chile (pagos, despacho, SII). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Estructura física LOCKED (D20) · stack backend LOCKED y CONSTRUIDO: Medusa v2 (D21/D22) · MVP-first LOCKED (D22): alternativa manual por defecto. |
> | **Last Updated** | 2026-07-11 |
> | **Depends On** | PROJECT_MASTER.md, DECISIONS.md (D2, D12, D13, D20, D21) |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ del *stack/estructura/infra/integraciones*. Detalle de frontend → FRONTEND_ARCHITECTURE.md. Modelo de datos → DATABASE.md. Contratos → API.md. |

>
> **Principio rector de producto (D21):** Manada es **e-commerce primero**. Perfil de mascota, suscripciones, recomendaciones y anticipación existen para mejorar la experiencia de compra, no para convertir el producto en una plataforma de gestión de mascotas. Toda recomendación de arquitectura prioriza, en orden: velocidad de MVP · simplicidad operativa para fundador único · bajo costo de mantenimiento · escalar sin sobreingeniería.
>
> **Frontend / sistema de componentes:** plan e inventario en **`FRONTEND_ARCHITECTURE.md`** (árbol `src/`, ~70 componentes, tokens, lib/hooks) y catálogo de uso en **`COMPONENT_LIBRARY.md`** — ver D12/D13/D15.

## 1. Estructura física del repositorio (D20 — LOCKED)

**Monorepo pnpm workspaces** en un solo repositorio git. Frontend y backend son (y serán) **aplicaciones independientes** que solo se comunican por HTTP.

```
manada/
├── ai-context/          ← fuente única de verdad del proyecto (docs + history/)
├── prototype/           ← prototipo HTML de Fase 2 (congelado; referencia visual/copy)
├── package.json         ← raíz privada: solo scripts de orquestación (pnpm --filter)
├── pnpm-workspace.yaml  ← workspace: apps/* + packages/*
├── pnpm-lock.yaml       ← lockfile ÚNICO (en raíz)
├── apps/
│   ├── web/             ← frontend Next.js (@manada/web) — real, 100% sobre el backend
│   └── backend/         ← backend Medusa v2 (@manada/backend) — real desde D22;
│                          módulos custom en src/modules (primer módulo: pet, D34)
└── packages/            ← aún NO existe: packages/shared nace únicamente cuando
                           exista el primer contrato compartido aprobado en API.md
```

- **Responsabilidades:** `apps/web` = experiencia de compra (solo consume API) · `apps/backend` = e-commerce headless + suscripciones custom + motor de anticipación + integraciones CL · `packages/shared` (futuro) = contratos API tipados y dominio compartido (Perfil de Mascota, anticipación, formato CLP).
- **Deploy por subdirectorio:** `apps/web` → Vercel (proyecto `manada-web`, D27) · `apps/backend` → Railway (WIP). Detalle: `DEPLOYMENT.md`.
- **Regla de dependencias (unidireccional):** `apps/web → packages/shared ← apps/backend`. Las apps **jamás** se importan entre sí.
- **Rationale** (resumen; completo en D20): un equipo de una persona no amortiza polyrepo y fragmentaría `ai-context/`; la estructura es agnóstica al resultado de la validación de stack (Medusa u otro viven igual en `apps/backend`); `apps/*` deja espacio a futuros worker (recordatorios, Fase 7) y admin **con aprobación previa** (regla 5). Sin Turborepo por ahora (dos apps no lo ameritan; se puede añadir sin reestructurar).

## 2. Reglas arquitectónicas (permanentes — D20)

> Estas reglas rigen desde la Fase 4 en adelante. Cualquier excepción requiere una nueva decisión en `DECISIONS.md` aprobada por Carlos.

1. **`apps/web` nunca contendrá lógica de negocio ni acceso directo a la base de datos.** El frontend solo consume la API.
2. **`apps/backend` es la única ubicación válida para el backend.** Jamás `apps/web/src/app/api`, `apps/web/server` ni ninguna variante dentro del frontend.
3. **Toda comunicación entre ambas aplicaciones será mediante la API documentada en `API.md`.** Nada de imports cruzados, DB compartida a nivel de código, ni canales laterales.
4. **Todo nuevo contrato deberá definirse primero en `API.md` antes de implementarse.** Documento primero, código después.
5. **No se crean nuevas aplicaciones ni paquetes sin aprobación explícita de Carlos.** Incluye `packages/shared`: nace únicamente cuando exista el primer contrato compartido aprobado en `API.md`.

## 3. Stack (alto nivel — decidido)
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (re-estilizado a la marca). **Ejecutado en `apps/web/`** (Fase 3 · Etapa 1, D13; movido de `web/` a `apps/web/` por D20): Next 16 + React 19 + **Tailwind v4 (CSS-first vía `@theme`, sin `tailwind.config.ts`)** + shadcn (*new-york*) + framer-motion + lucide-react. Tokens en `src/app/globals.css`.
- **Backend e-commerce:** ✅ **Medusa.js v2 (D21), construido y verificado** en `apps/backend` (starter bare `@medusajs/medusa` **2.16.0**, D22; setup local en `apps/backend/DEV.md`). El core cubre catálogo/carrito/checkout/órdenes/clientes/promos/inventario **+ Admin operativo incluido**; el frontend consume su **API REST store** (contratos en `API.md §5–§9`). **Todo lo propio de Manada se construye como extensiones, sin fork del core:**
  - **Módulos custom** (tablas propias en la misma Postgres): ✅ **`pet`** (el perfil de mascota, D34 — primer módulo real, con rutas `/store/pets`, validación zod y subscribers `password-reset`/`food-purchased`). Futuros (post-tracción): `subscription` (recipe oficial de Medusa) y `anticipation` (motor de frecuencia de recompra).
  - **Extensiones ya en producción de código:** middleware `subscription_price` (`src/api/middlewares.ts`, D23) · regla única de envío + ruta `/store/shipping-policy` (`src/lib/shipping.ts` + promoción automática, D28) · scripts idempotentes (`seed.ts`, `setup-free-shipping.ts`).
  - **Integraciones CL como providers/hooks (pendientes):** Mercado Pago Checkout Pro (primero, fast-follow post-infra) · payment provider custom **Webpay** (no hay oficial; SDK Node de Transbank; sujeto a afiliación) · fulfillment providers para courier · subscriber post-orden → boleta SII · scheduled jobs → recordatorios WhatsApp.
- **DB:** PostgreSQL. **Cache/sesiones:** Redis.
- **Buscador:** Meilisearch / Algolia (autocompletar tolerante a typos).
- **Infra:** Vercel (frontend) + Railway/Fly (backend) + Cloudflare CDN.
- **Analytics:** GA4 + eventos e-commerce + PostHog/Hotjar.

## 4. Integraciones Chile (MVP-first — D22)

> **Regla D22:** para el MVP se asume la **alternativa manual** por defecto. Solo el **medio de pago** es integración obligatoria para lanzar; despacho, boleta y mensajería se operan **manualmente desde el Admin de Medusa** hasta que exista tracción.

- **Pagos**: ✅ decidido (D22/D24) — el MVP lanza con **pago manual** (`pp_system_default`, transferencia confirmada a mano en el Admin) como método real; **Mercado Pago Checkout Pro = fast-follow** post-infra; Webpay diferido (afiliación Transbank).
- **Despacho** *(manual en el MVP)*: los envíos se gestionan a mano (etiqueta/coordinación con el courier fuera del sistema). Integración por API con Blue Express / Starken / Chilexpress → **diferida a Fase 7** (con tracción).
- **Boleta/factura SII** *(manual en el MVP)*: emisión manual. Integración LibreDTE / Bsale → **diferida a Fase 7**.
- **Mensajería** *(diferida)*: WhatsApp Business API (recordatorios de recompra — diferenciador) → **Fase 7**.

## 5. Decisiones pendientes (recortadas por D22 al mínimo del MVP)
- ~~Validar Medusa.js vs alternativas~~ → ✅ **Medusa.js v2 (D21)**.
- ~~Medio de pago primario para lanzar~~ → ✅ **pago manual (transferencia, `pp_system_default`) como método real del MVP** (decisión de Carlos, D22); **Mercado Pago Checkout Pro como fast-follow** post-infra (D24 · WIP infra en `CURRENT_STATE.md`); Webpay diferido (afiliación Transbank).
- ~~Modelo de datos mínimo del checkout~~ → ✅ implementado y documentado en `DATABASE.md §5–§8` (incluye el perfil de mascota como módulo `pet`, D34).
- **Buscador dedicado** (Meilisearch/Algolia) → diferido a escala; hoy `q` nativo de la Store API (D28).
- *(Diferidas — no bloquean el MVP, D22):* courier/boleta/WhatsApp; motor de "frecuencia de recompra" (módulo `anticipation`); **suscripción recurrente** (módulo `subscription`). Se retoman con tracción (Fases 6–7).
