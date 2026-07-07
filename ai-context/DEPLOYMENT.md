# DEPLOYMENT — Infraestructura y despliegue

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Fuente de verdad de **cómo y dónde se despliega Manada**: hosting, settings, variables de entorno, estrategia de ramas y el checklist del "primer deploy de producción funcional". |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-06 |
> | **Depends On** | ARCHITECTURE.md (§2 reglas), DECISIONS.md (D20 monorepo · D22 MVP-first · D25 infra de lanzamiento · **D27 Vercel**) |
> | **Source of Truth** | ✅ de *la configuración de despliegue*. |

---

## 0 · Estado actual (foto rápida)

| Servicio | Estado | Dónde |
|---|---|---|
| **Frontend** (`apps/web`, Next.js) | 🟢 **Desplegado en Vercel** — build verde, **modo staging (sin backend)** | proyecto `manada-web` |
| **Backend** (`apps/backend`, Medusa v2) | 🔴 **No desplegado** — corre solo en localhost del fundador | pendiente (Railway/Render, diferido) |
| **Base de datos / Redis** | 🔴 No provisionados en la nube | pendiente (Postgres/Redis gestionados) |
| **Dominio `tumanada.cl`** | 🔴 **No conectado** — nada "vivo" de cara al público | pendiente (lanzamiento) |

> **Regla de oro (D22 · D27):** durante el desarrollo **no** se sostiene un entorno de producción a medias. El objetivo es que el **primer deploy de *producción* salga 100 % funcional**, no ir parchando. Hoy el deploy de Vercel es solo **verificación de build**; el sitio en vivo muestra el catálogo "apagado" porque no hay backend público, y **no se conecta ningún dominio** hasta el lanzamiento.

---

## 1 · Frontend — Vercel (`manada-web`)

**Configuración verificada (2026-07-06, primer build `READY`):**

| Campo | Valor |
|---|---|
| **Proyecto** | `manada-web` · `prj_iefCzThS55P5GIO8vrHnnOLddc4q` |
| **Team** | `carlosvaldes1996-2430's projects` · slug `carlosvaldes1996-2430s-projects` · `team_ewu4gaTNeWxcznbg5ggKzuYJ` |
| **Repo** | `carlosvaldes1996-source/manada` (privado) · Git integration (auto-deploy) |
| **Framework Preset** | Next.js |
| **Root Directory** | **`apps/web`** ← ajuste crítico del monorepo |
| **Build / Install commands** | Automáticos (Vercel-managed) |
| **Package manager** | pnpm `10.33.2` (vía `package.json#packageManager`, lockfile v9) |
| **Bundler** | Turbopack (`next build`, Next 16) |
| **Node** | 24.x · **Región** iad1 |
| **Variables de entorno** | **Ninguna** (deliberado; ver §2) |

**Cómo resuelve el monorepo** (confirmado en los logs del build):
- Root Directory = `apps/web` → Vercel encuentra la app Next ahí.
- El install corre en la **raíz del workspace** (`Scope: all 3 workspace projects`), no dentro de `apps/web` → el protocolo de workspace de pnpm resuelve bien.
- Los `postinstall` nativos que arrastra el backend (protobufjs, `@swc/core`, esbuild, msgpackr-extract, `@medusajs/telemetry`) **corren y terminan OK** → el backend no rompe el install del frontend. *(Ningún package del workspace define `postinstall`/`prepare` propio.)*
- El `.npmrc` raíz (hoist de Medusa) y `pnpm-workspace.yaml` (`onlyBuiltDependencies`) aplican a todo el workspace; inofensivos para la web.

**El build es verde sin variables de entorno** porque `apps/web/src/lib/medusa/client.ts` hace *fallback* (`NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"`) y solo emite `console.warn` si falta la publishable key (no lanza).

**Verificación (deployment `dpl_H2s5GaELej5MZ89k1LU7Ko4CXPAH`):** commit `630b499` (main), estado `READY`, build "Completed in 1m", **0 errores**, target `production`, sin dominio conectado (`live: false`).

**URLs automáticas de Vercel** (staging, no funcional aún): `manada-web.vercel.app`, `manada-web-git-main-...vercel.app` (alias de la rama `main`).

**Optimización pendiente (opcional, no urgente):** el install trae las ~1420 deps de los 3 proyectos (incluye el backend). Se puede acotar a la web con Install Command `pnpm install --filter @manada/web...` para recortar tiempo de build. Se hará **después**, no bloquea; el build actual ya es rápido (~1 min).

---

## 2 · Variables de entorno

**Hoy: ninguna configurada** (a propósito — sin backend público no aportan y el build queda verde igual).

**A setear en Vercel al desplegar el backend (lanzamiento):**

| Variable | Valor | Notas |
|---|---|---|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | URL pública del backend Medusa | p. ej. `https://api.tumanada.cl` o la URL de Railway/Render |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_…` del sales channel "Manada Web" del **backend de producción** | ⚠️ **NO** reutilizar la key del seed local: el backend de prod genera la suya. Obtenerla del Admin de prod o del seed de prod. |

> Ambas son `NEXT_PUBLIC_` → se **hornean en el bundle en build time**. Cambiar su valor exige **redeploy** del frontend. Plantilla local en `apps/web/.env.example`.

**Secrets del backend (cuando exista, viven en Railway/Render, no en Vercel):** `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`/`ADMIN_CORS`/`AUTH_CORS` (deben incluir el dominio del frontend). Hoy en dev usan valores por defecto (D25 los marcó como deuda de lanzamiento).

---

## 3 · Estrategia de ramas (Git → deploys)

**Provisional durante el desarrollo (decidido por Carlos, D27):** mantenerlo **simple**.
- **`main` = rama principal y de producción** (default de Vercel). Cada merge a `main` → deployment `production` (build verde, tienda "apagada" sin backend). Como **no hay dominio conectado**, nada queda vivo → es solo salud de build.
- **`feature/*`** (auth, account, search…) → **Preview deployments** automáticos con URL por rama. `main` se mantiene siempre estable.

**A decidir justo antes del lanzamiento:** si se adopta una **rama `production` dedicada** (para que el primer deployment de *Production* de la historia del proyecto sea ya el funcional) o se mantiene `main`=prod y el corte lo marca la conexión del dominio + backend + env vars. Cualquiera de las dos honra la regla de oro; se elige en su momento. *(Contexto: se evaluó la rama `production` dedicada; se pospuso por simplicidad de desarrollo.)*

---

## 4 · Backend (pendiente — diferido)

**No desplegar todavía** (mandato de Carlos: no invertir tiempo en infra de backend hasta cerrar el MVP — Etapas A + B del plan D25).

Cuando toque (post-MVP): Medusa v2 no corre en Vercel (servidor de larga vida). Necesita **host de contenedor/servidor** (Railway/Render/Fly) + **Postgres gestionado** + **Redis**. Pasos macro: desplegar backend → migrar + seed de prod → obtener URL pública + publishable key de prod → CORS apuntando al dominio del frontend → setear las 2 env vars en Vercel (§2) → redeploy del frontend.

---

## 5 · Checklist — "Primer deploy de producción funcional"

Se marca cuando la tienda funciona de punta a punta de cara al público:

- [ ] MVP cerrado (Etapa A cuentas ✅ + Etapa B tienda coherente) — plan D25.
- [ ] Backend Medusa desplegado (host + Postgres + Redis) con secrets de prod reales.
- [ ] Seed/datos de prod + publishable key de prod.
- [ ] CORS del backend incluye el dominio del frontend.
- [ ] `NEXT_PUBLIC_MEDUSA_BACKEND_URL` + `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` seteadas en Vercel → **redeploy**.
- [ ] Smoke en la URL de Vercel: catálogo hidrata · carrito · checkout → orden real.
- [ ] (Si aplica) rama `production` definida (§3).
- [ ] Dominio `tumanada.cl` conectado en Vercel + DNS + SSL.
- [ ] Recién entonces: **Mercado Pago** (Checkout Pro) — posterior, no bloquea el primer prod funcional del flujo manual.

---

## 6 · Referencias

- Decisiones: **D27** (este deploy), D20 (monorepo), D21 (Medusa), D22 (MVP-first), D25 (infra de lanzamiento como deuda).
- Reglas arquitectónicas: `ARCHITECTURE.md §2` (backend solo en `apps/backend`; web sin lógica de negocio).
- Env local: `apps/web/.env.example` · backend local: `apps/backend/DEV.md`.
