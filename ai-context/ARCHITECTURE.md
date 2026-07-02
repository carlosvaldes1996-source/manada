# ARCHITECTURE — Stack, infraestructura, integraciones CL

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Stack técnico, infraestructura e integraciones Chile (pagos, despacho, SII). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟡 Frontend en ejecución (D13/D15); backend/infra a validar en Fase 4. |
> | **Last Updated** | 2026-06-29 |
> | **Depends On** | PROJECT_MASTER.md, DECISIONS.md (D2, D12, D13) |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ del *stack/infra/integraciones*. Detalle de frontend → FRONTEND_ARCHITECTURE.md. Modelo de datos → DATABASE.md. Contratos → API.md. |

> *Estado: alto nivel decidido; detalle backend pendiente (Fase 4).*
>
> **Frontend / sistema de componentes:** plan e inventario en **`FRONTEND_ARCHITECTURE.md`** (árbol `src/`, ~70 componentes, tokens, lib/hooks) y catálogo de uso en **`COMPONENT_LIBRARY.md`** — ver D12/D13/D15.

## 1. Stack (alto nivel — decidido)
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (re-estilizado a la marca). **Ejecutado en `web/`** (Fase 3 · Etapa 1, D13): Next 16 + React 19 + **Tailwind v4 (CSS-first vía `@theme`, sin `tailwind.config.ts`)** + shadcn (*new-york*) + framer-motion + lucide-react. Tokens en `src/app/globals.css`.
- **Backend e-commerce:** Medusa.js (headless, open-source) — **a validar** vs alternativas en Fase 4. Módulo de **suscripciones custom** (diferenciador).
- **DB:** PostgreSQL. **Cache/sesiones:** Redis.
- **Buscador:** Meilisearch / Algolia (autocompletar tolerante a typos).
- **Infra:** Vercel (frontend) + Railway/Fly (backend) + Cloudflare CDN.
- **Analytics:** GA4 + eventos e-commerce + PostHog/Hotjar.

## 2. Integraciones Chile (pendiente elegir proveedor final)
- **Pagos:** Webpay Plus (Transbank), Mercado Pago, Khipu/transferencia.
- **Despacho:** Blue Express, Starken, Chilexpress (cotización por API).
- **Boleta/factura SII:** LibreDTE o Bsale.
- **Mensajería:** WhatsApp Business API (recordatorios de recompra — diferenciador).

## 3. Decisiones pendientes (Fase 4)
- Validar Medusa.js vs alternativas (Vendure, Saleor, o build propio).
- Elegir proveedor de pago primario y de boleta.
- Estrategia de cálculo de "frecuencia de recompra" (motor de anticipación).
- Arquitectura de datos del **Perfil de Mascota** (ver DATABASE.md).
