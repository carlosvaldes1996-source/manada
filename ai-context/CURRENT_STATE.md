# CURRENT STATE — Dónde estamos AHORA

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Foto del estado actual: qué es real, qué frentes están abiertos y cuál es el siguiente paso. Se **reescribe** al cerrar cada hito (no se apila; la narración histórica vive en `DECISIONS.md`). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-12 |
> | **Depends On** | DECISIONS.md, ROADMAP.md |
> | **Supersedes** | `history/05-bitacora-avances-2026-07.md` (versión-bitácora archivada) |
> | **Source of Truth** | ✅ del *estado actual y el siguiente paso*. Único dueño del estado: ningún otro doc lo repite. |

## Fase activa

**Fase 5 — MVP (D22, MVP-first)**, en su tramo final, con dos realidades en paralelo:

1. **El flujo propio del MVP está CERRADO y endurecido** (D23–D29): catálogo, carrito, checkout→orden con pago manual, cuentas/sesión, buscador y regla de envío — todo real sobre Medusa v2, sin datos demo en ningún flujo real (D33). La suscripción se vende como **compra única** (`SUBSCRIPTIONS_ENABLED=false`, D29).
2. **El "moat diferido" de D22 quedó parcialmente superado:** el **perfil de mascota ya es real y persistido** — módulo custom `pet` en el backend (D34), anticipación anclada a la compra (D35), edición real (D37/D38) y separación comprar≠definir-qué-come (D39). Lo que sigue diferido post-tracción es la **suscripción recurrente** y el motor de anticipación completo.

**Etapa vigente declarada por Carlos (D38):** prioridad a **consistencia visual, UX y sensación de producto terminado** por sobre agregar capacidades. El backend está consolidado.

## 🚧 WIP — Infraestructura de producción (Etapa 1, código sin commitear · 2026-07-09)

> **Nota de continuidad (no es cierre de etapa; D30 queda RESERVADA para documentarla al validar).** Arrancó el **cierre de infra + terceros**. Rol: DevOps/CTO, etapa por etapa (plan → implementar → verificar → documentar → commit → push). **Orden acordado:** Railway → PostgreSQL → Redis → Secrets → CORS → Vercel env vars → Smoke test → Mercado Pago → Dominio → Lanzamiento.
>
> **Decisiones de esa sesión:** (1) topología Railway = **un solo servicio `shared`** (server/worker se separa con tracción); (2) operación = **CLI de Railway dirigida por Claude**, Carlos solo autentica; (3) **infra live primero con pago manual, Mercado Pago como fast-follow** antes del dominio público; (4) **build nativo, sin Docker** (validado).
>
> **Etapa 1 (Railway backend) — 1A + 1B HECHOS y verificados localmente, EN DISCO SIN COMMITEAR:**
> - **1A ·** `apps/backend/medusa-config.ts` endurecido: sin fallback `"supersecret"`; módulos Redis (cache/event-bus/workflow-engine) condicionados a `REDIS_URL` (dev sigue in-memory); `workerMode` (`MEDUSA_WORKER_MODE`, default `shared`); `admin.backendUrl` (`MEDUSA_BACKEND_URL`). `tsc` + `medusa build` verdes.
> - **1B ·** `railway.json` (raíz) para despliegue nativo pnpm sin Docker: build `pnpm install --frozen-lockfile && pnpm --filter @manada/backend build && cd apps/backend/.medusa/server && npm install`; start `medusa start` desde `.medusa/server`; migraciones en `preDeployCommand`; healthcheck `/health`. El artefacto de prod bootea en local → `/health` → 200.
> - Railway CLI 5.26.0 instalada. **Nada provisionado aún → US$0.**
>
> **▶️ Punto exacto de continuación:** falta que Carlos corra **`railway login`**. Luego: `railway whoami` → `railway init` (proyecto `manada`) → `railway add` PostgreSQL (Etapa 2, acoplada: Medusa no arranca sin DB) → `railway up` → gate `curl https://<backend>.up.railway.app/health` → 200. Después Redis (E3) → Secrets fuertes (E4) → CORS (E5). **DECISIONS.md D30 + DEPLOYMENT.md + commit/push van al cerrar la etapa validada.**

## Qué está construido y es real (fuentes de verdad)

- **Backend Medusa v2** (`apps/backend`, 2.16.0): catálogo administrable + `subscription_price` calculado (D23) · carrito/checkout→orden con pago manual (D24) · auth de cliente + direcciones + pedidos (D26) · buscador `q` + regla única de envío `/store/shipping-policy` (D28) · **módulo custom `pet`** `/store/pets` (D34) + subscriber `order.placed` (D35) + subscriber `password-reset`. Contratos: `API.md §5–§9` · modelo: `DATABASE.md §5–§8` · setup local: `apps/backend/DEV.md`.
- **Frontend Next.js** (`apps/web`): 100% sobre el backend real; datos demo solo en el hero de la landing (decisión de marca, D28) y el styleguide `/dev/*` (gateado en prod, D29). Arquitectura: `FRONTEND_ARCHITECTURE.md` · componentes: `COMPONENT_LIBRARY.md`.
- **Funnel de adquisición** F1–F4 ✅ sobre catálogo real (O5, D33) — doc: `FUNNEL_TARGET.md`.
- **Pet Experience** B1–B8 ✅ COMPLETA (B4 foto con andamio local honesto + B7 /cuenta manada-first cerrados en el Product Completion Pass, D41; B5/B6 persistidos vía `/store/pets`; **B8 Home logueada = centro de control**, D42: `PetStatusCard` con retrato + línea de tiempo del saco + "Plan de {nombre}" + recompra en dos taps + necesidades) — doc: `PET_EXPERIENCE_TARGET.md`. **Anticipación honesta** (D41): la cápsula invita a "Pedir de nuevo"; el reagendo/suscripción vuelven post-tracción.
- **Deploy:** frontend en Vercel como verificación de build, sin env vars ni dominio (D27) — doc: `DEPLOYMENT.md`. Backend aún local (ver WIP arriba).

## Frentes abiertos (en paralelo, cada uno en su chat/bloque)

| Frente | Estado | Siguiente acción | Referencia |
|---|---|---|---|
| **Infra de producción** | 🚧 Etapa 1 hecha en disco, sin commitear | Carlos: `railway login` → provisionar (ver WIP arriba) | D30 reservada · `DEPLOYMENT.md` |
| **Terceros** | ⬜ | Mercado Pago Checkout Pro (fast-follow post-infra) → email transaccional (reset + confirmaciones) | D25 G4 · D28 |
| **Funnel F5 — momento de registro** | ⬜ empieza por **decisión de producto**, no por código | Decidir con Carlos dónde vive la captura de cuenta | `FUNNEL_TARGET.md §1.6` |
| **Validación UI del Completion Pass (D41)** | ⬜ implementado, sin smoke manual | Carlos recorre: foto de mascota, /cuenta, /comenzar móvil, landing (el dashboard ya fue rediseñado y validado en D42) | D41 |
| **Packshots de producto** | ⬜ **el hueco visual crítico**: los 6 productos muestran emoji | Conseguir packshots oficiales (marcas) + generar cama Manada → subir vía Admin | `public/fotos/README.md` §Pendientes |
| **Foto de mascota → blob definitivo** | ⬜ hoy andamio local (localStorage) | Con la estrategia de storage app-wide: swap interno de `setPetPhoto` + PATCH `avatar_url` | D41 · `API.md §9` |
| **Post-tracción** | ⬜ diferido | Suscripción recurrente (moat), SII, courier, WhatsApp, Webpay | D21/D22 |

## Claves del código (para no re-derivar)

- **Capa Medusa del front:** `apps/web/src/lib/medusa/` — `client.ts` (SDK, JWT en localStorage/SSR nostore) · `products.ts`/`map-product.ts` (catálogo; `SUBSCRIPTIONS_ENABLED`) · `cart.ts` · `checkout.ts` · `auth.ts`/`account.ts` · `shipping.ts` · `pets.ts` (mapper `StorePet→Pet`).
- **Providers:** `components/providers/` — `session-provider` (sesión JWT persistente) · `pet-provider` (hidrata `/store/pets` al login, empuja mascotas de invitado, `updatePet`/`assignFood` optimistas) · `cart-provider` (cart_id en localStorage). Coordinador: `hooks/use-auth-actions.ts` (login/registro/logout + `transferCart`).
- **Backend custom:** `apps/backend/src/modules/pet` · `src/api/store/pets` (+ validators zod) · `src/subscribers/{password-reset,food-purchased}.ts` · `src/api/middlewares.ts` (`subscription_price`) · `src/lib/shipping.ts` + `src/scripts/{seed,setup-free-shipping}.ts`.
- **Funnel/perfil:** `app/comenzar/*` (wizard + recomendación server-hydrated) · `lib/recommend.ts` (puro, recibe `products`) · `lib/anticipation.ts` · `app/(tienda)/cuenta/mascotas/*` + `components/pet/{pet-edit-dialog,food-selector-dialog,pet-tag}.tsx`.
- **Home logueada (D42):** `app/dashboard-view.tsx` (centro de control) · `components/pet/{pet-status-card,pet-action-grid}.tsx` · `components/commerce/quick-buy-card.tsx`.
- ⚠️ Antes de tocar `apps/web`: leer `apps/web/AGENTS.md` + docs de Next 16 en `node_modules/next/dist/docs` (cambios de ruptura). Component-system-first: mapear a tipos/componentes existentes, no reescribir.

## Modo de trabajo vigente

- **Bloques pequeños:** un bloque → validado por Carlos → un commit. **Frontend primero; la integración backend es una pasada separada** (regla de oro de FUNNEL/PET_EXPERIENCE).
- **Todo dato estructurado se edita con el mismo patrón del funnel** (chips/selector/buscador, nunca texto libre) — regla vinculante D38.
- **Comprar ≠ definir qué come** (D39): la tienda vende; el perfil define; el puente es explícito (toast de un tap).
- En decisiones no estratégicas: tomar la opción claramente superior y documentar rationale; las estratégicas esperan a Carlos.
- Al cerrar un hito: seguir el barrido de punteros de `PROJECT_HEALTH_REPORT.md §5` (CURRENT_STATE se reescribe, no se apila).
