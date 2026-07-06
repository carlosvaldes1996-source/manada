# ARCHITECTURE — Stack, estructura del repo, infraestructura, integraciones CL

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Stack técnico, estructura física del repositorio, reglas arquitectónicas, infraestructura e integraciones Chile (pagos, despacho, SII). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟡 Estructura física LOCKED (D20); stack backend a validar en Fase 4. |
> | **Last Updated** | 2026-07-06 |
> | **Depends On** | PROJECT_MASTER.md, DECISIONS.md (D2, D12, D13, D20) |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ del *stack/estructura/infra/integraciones*. Detalle de frontend → FRONTEND_ARCHITECTURE.md. Modelo de datos → DATABASE.md. Contratos → API.md. |

> *Estado: estructura física del repo ✅ (D20); stack de alto nivel decidido; detalle backend pendiente (Fase 4).*
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
│   ├── web/             ← frontend Next.js (@manada/web) — Fase 3, funcional
│   └── backend/         ← RESERVADO (solo src/ + docs/ + README.md, sin código);
│                          el scaffold se genera en Fase 5, tras validar el stack
└── packages/            ← aún NO existe: packages/shared nace únicamente cuando
                           exista el primer contrato compartido aprobado en API.md
```

- **Responsabilidades:** `apps/web` = experiencia de compra (solo consume API) · `apps/backend` = e-commerce headless + suscripciones custom + motor de anticipación + integraciones CL · `packages/shared` (futuro) = contratos API tipados y dominio compartido (Perfil de Mascota, anticipación, formato CLP).
- **Deploy por subdirectorio:** `apps/web` → Vercel (root directory `apps/web`) · `apps/backend` → Railway/Fly. No hay proyecto Vercel enlazado aún.
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
- **Backend e-commerce:** Medusa.js (headless, open-source) — **a validar** vs alternativas en Fase 4. Módulo de **suscripciones custom** (diferenciador). Vivirá en `apps/backend` (regla 2).
- **DB:** PostgreSQL. **Cache/sesiones:** Redis.
- **Buscador:** Meilisearch / Algolia (autocompletar tolerante a typos).
- **Infra:** Vercel (frontend) + Railway/Fly (backend) + Cloudflare CDN.
- **Analytics:** GA4 + eventos e-commerce + PostHog/Hotjar.

## 4. Integraciones Chile (pendiente elegir proveedor final)
- **Pagos:** Webpay Plus (Transbank), Mercado Pago, Khipu/transferencia.
- **Despacho:** Blue Express, Starken, Chilexpress (cotización por API).
- **Boleta/factura SII:** LibreDTE o Bsale.
- **Mensajería:** WhatsApp Business API (recordatorios de recompra — diferenciador).

## 5. Decisiones pendientes (Fase 4)
- Validar Medusa.js vs alternativas (Vendure, Saleor, o build propio).
- Elegir proveedor de pago primario y de boleta.
- Estrategia de cálculo de "frecuencia de recompra" (motor de anticipación).
- Arquitectura de datos del **Perfil de Mascota** (ver DATABASE.md).
