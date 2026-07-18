# DEPLOYMENT — Infraestructura y despliegue

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Fuente de verdad de **cómo y dónde se despliega Manada**: hosting, settings, variables de entorno, estrategia de ramas y el checklist del "primer deploy de producción funcional". |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-11 |
> | **Depends On** | ARCHITECTURE.md (§2 reglas), DECISIONS.md (D20 monorepo · D22 MVP-first · D25 infra de lanzamiento · **D27 Vercel**) |
> | **Source of Truth** | ✅ de *la configuración de despliegue*. |

---

## 0 · Estado actual (foto rápida)

> **EN VIVO desde 2026-07-16 (D30).** El primer deploy de producción salió 100 % funcional (honrando la regla de oro D22/D27), no a medias.

| Servicio | Estado | Dónde |
|---|---|---|
| **Frontend** (`apps/web`, Next.js) | 🟢 **EN VIVO** en `https://www.tumanada.cl` (catálogo real, SSL) | Vercel `manada-web` |
| **Backend** (`apps/backend`, Medusa v2) | 🟢 **EN VIVO** — `https://manadabackend-production.up.railway.app` (`/health` 200) | Railway `creative-creation` · servicio `@manada/backend` (`shared`, build nativo) |
| **Base de datos / Redis** | 🟢 Provisionados (con volúmenes) | Railway (Postgres + Redis gestionados) |
| **Almacenamiento de archivos** | 🟢 **Railway Volume** `@manada/backend-volume` en `/app/apps/backend/.medusa/server/static` (provider local anclado a `MEDUSA_BACKEND_URL`) | Railway Volume (MVP, sin S3) |
| **Dominio `tumanada.cl`** | 🟢 **Conectado** — `www` canónico, apex → 308 a `www`, SSL OK | Vercel (frontend) |
| **Tracking (GTM/GA4)** | 🟢 En vivo — `GTM-P5RLWHJW` + GA4 `G-1JQM28SLWW`, verificado en Tiempo real (D46) | GTM + GA4 |

> **Fast-follow (no bloquea, ver §5):** packshots por Admin · Search Console · Mercado Pago. *(Resend en vivo ✅ HECHO, D49.)*

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

**Variables del backend (viven en Railway, servicio backend → *Variables*; nunca en Vercel).** Plantilla completa y comentada: `apps/backend/.env.template`.

| Variable | Valor en producción | Notas |
|---|---|---|
| `NODE_ENV` | `production` | Activa cookies seguras, logs JSON y apaga el modo dev. **Setearla explícitamente.** |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Referencia interna al Postgres del proyecto (Railway la resuelve). |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Sin ella, módulos in-memory (no recomendado en prod). |
| `JWT_SECRET` | cadena aleatoria larga | `openssl rand -base64 32`. Sin fallback inseguro en el código. |
| `COOKIE_SECRET` | cadena aleatoria larga | idem. |
| `STORE_CORS` | `https://tumanada.cl,https://www.tumanada.cl,https://manada-web.vercel.app` | Orígenes del storefront. **Debe incluir el dominio del frontend.** |
| `ADMIN_CORS` | `https://api.tumanada.cl` | La propia URL pública del backend (donde vive `/app`). |
| `AUTH_CORS` | `https://tumanada.cl,https://www.tumanada.cl,https://api.tumanada.cl` | Orígenes que hacen login (storefront + Admin). |
| `MEDUSA_BACKEND_URL` | `https://api.tumanada.cl` | URL pública del backend. La usa el Admin **y** las URLs de los archivos subidos (`/static/...`). |
| `MEDUSA_WORKER_MODE` | `shared` (default) | MVP: un solo servicio. Se separa server/worker con tracción. |

Hoy en dev usan valores por defecto (D25 los marcó como deuda de lanzamiento).

**Almacenamiento de archivos (packshots subidos desde el Admin).** El backend usa el **provider local** de Medusa (`@medusajs/medusa/file-local`, configurado en `medusa-config.ts`): guarda en `<cwd>/static` y sirve en `${MEDUSA_BACKEND_URL}/static/...`. **MVP-first: no se agrega S3** (no hay infra externa nueva). Pero el filesystem de Railway es **efímero** → sin persistencia, las imágenes se pierden en cada deploy. Solución: **montar un Railway Volume** en el directorio `static` del server construido (mount path `/app/apps/backend/.medusa/server/static`). Con tracción/crecimiento del catálogo se migra a S3/R2 (cambio solo de config del módulo `file`).

**Email transaccional (D45 · Resend) — EN VIVO (D49):** en Railway `RESEND_API_KEY`, `RESEND_FROM=Manada <contacto@tumanada.cl>` (el **nombre visible** va delante del buzón; sin él el cliente de correo muestra "contacto" como remitente) y `STOREFRONT_URL=https://tumanada.cl` (apex, base de los CTAs y del enlace de recuperación). **Dominio `tumanada.cl` verificado en Resend** (SPF/DKIM agregados vía la integración Resend↔Vercel; Vercel solo aporta DNS, el envío corre en el backend). **Sin `RESEND_API_KEY` el provider cae a modo DEV** (loguea, no envía) → útil en local. Plantilla local: `apps/backend/.env.template`.

**Tracking — GTM (D46 · en Vercel, frontend):** `NEXT_PUBLIC_GTM_ID` (`GTM-XXXXXXX`) = contenedor de Google Tag Manager, **único punto de integración de medición**. GA4, Meta Pixel y Google Ads se conectan **dentro de GTM**, no en el código. Es `NEXT_PUBLIC_` → se hornea en build; cambiarla exige **redeploy**. **Sin este valor no se carga GTM ni se miden eventos** (por diseño: dev/preview quedan limpios). La app ya emite al `dataLayer` los 6 hitos del embudo (`onboarding_start`, `recommendation_shown`, `add_to_cart`, `begin_checkout`, `purchase`, `subscription`) con esquema `ecommerce` de GA4. Plantilla local: `apps/web/.env.example`. **Pasos manuales (fuera del código):** crear contenedor GTM → crear propiedad **GA4** y su tag de configuración dentro de GTM → mapear los 6 eventos a tags GA4 → publicar el contenedor → **Google Search Console** (verificar dominio + enviar `https://tumanada.cl/sitemap.xml`) → **Meta Pixel** y **Google Ads** (conversion linker + import de conversiones desde GA4) si se harán campañas.

---

## 3 · Estrategia de ramas (Git → deploys)

**Provisional durante el desarrollo (decidido por Carlos, D27):** mantenerlo **simple**.
- **`main` = rama principal y de producción** (default de Vercel). Cada merge a `main` → deployment `production` (build verde, tienda "apagada" sin backend). Como **no hay dominio conectado**, nada queda vivo → es solo salud de build.
- **`feature/*`** (auth, account, search…) → **Preview deployments** automáticos con URL por rama. `main` se mantiene siempre estable.

**A decidir justo antes del lanzamiento:** si se adopta una **rama `production` dedicada** (para que el primer deployment de *Production* de la historia del proyecto sea ya el funcional) o se mantiene `main`=prod y el corte lo marca la conexión del dominio + backend + env vars. Cualquiera de las dos honra la regla de oro; se elige en su momento. *(Contexto: se evaluó la rama `production` dedicada; se pospuso por simplicidad de desarrollo.)*

---

## 4 · Backend (🚧 despliegue a Railway en curso)

El MVP ya está cerrado (D28/D29), así que el mandato "no desplegar hasta cerrar el MVP" quedó cumplido y el despliegue **arrancó** (2026-07-09). Medusa v2 no corre en Vercel (servidor de larga vida): va a **Railway** (decidido: un solo servicio `shared`, build nativo pnpm sin Docker) + **Postgres gestionado** + **Redis**. Pasos macro: desplegar backend → migrar + seed de prod → URL pública + publishable key de prod → CORS al dominio del frontend → setear las 2 env vars en Vercel (§2) → redeploy del frontend.

> Estado fino, decisiones de la sesión y punto exacto de continuación: **`CURRENT_STATE.md §WIP`** (el detalle se consolida aquí + D30 al validar cada etapa).

### 4.1 · Runbook de despliegue (orden a seguir)

> **✅ EJECUTADO (2026-07-16, D30) — dejado como referencia reproducible.** Estos son los pasos que se corrieron para dejar la infra en vivo; sirven para rehacerla o entenderla. Valores reales entre paréntesis.

1. **Railway — proyecto + servicios.** `railway login` → `railway init` (proyecto `manada`) → agregar **PostgreSQL** y **Redis** (`railway add`). Crear el **servicio backend** desde el repo (root = raíz del monorepo; el `railway.json` de la raíz define build/start/migraciones).
2. **Volumen de archivos.** Crear un **Volume** en el servicio backend, mount path `/app/apps/backend/.medusa/server/static` (persiste los packshots subidos por Admin).
3. **Variables del backend** (§2, tabla): `NODE_ENV=production`, `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `REDIS_URL=${{Redis.REDIS_URL}}`, `JWT_SECRET`/`COOKIE_SECRET` (aleatorios), `STORE_CORS`/`ADMIN_CORS`/`AUTH_CORS`, `MEDUSA_BACKEND_URL`, `STOREFRONT_URL`, y (cuando esté) `RESEND_API_KEY`/`RESEND_FROM`. Si aún no hay dominio, usar primero la URL `*.up.railway.app` en `MEDUSA_BACKEND_URL`/CORS y ajustar al conectar `tumanada.cl`.
4. **Deploy + gate.** `railway up` (o auto-deploy por Git). El `preDeployCommand` corre `medusa db:migrate`. Gate: `curl https://<backend>.up.railway.app/health` → **200**.
5. **Bootstrap de datos (una vez).** Dentro del contenedor (`railway ssh` / shell del servicio): crear admin (`npx medusa user -e ... -p ...`) y correr el seed (`pnpm --filter @manada/backend exec medusa exec ./src/scripts/seed.ts`). Luego setear envío gratis (`setup-free-shipping.ts`) si aplica.
6. **Publishable key de prod.** Obtenerla en Admin (`/app` → Settings → Publishable API Keys, key "Manada Web").
7. **Vercel — env vars.** `NEXT_PUBLIC_MEDUSA_BACKEND_URL` = URL pública del backend · `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` = `pk_...` del paso 6 · (`NEXT_PUBLIC_GTM_ID` si ya hay contenedor). Son `NEXT_PUBLIC_` → **redeploy** del frontend.
8. **Smoke.** En la URL de Vercel: catálogo hidrata · agregar al carrito · checkout → orden real (aparece en Admin). Verificar que las imágenes de producto cargan desde `${MEDUSA_BACKEND_URL}/static/...`.
9. **Resend en vivo — ✅ HECHO (D49).** Dominio `tumanada.cl` verificado en Resend (SPF/DKIM vía DNS de Vercel) + `RESEND_API_KEY`/`RESEND_FROM=Manada <contacto@tumanada.cl>`/`STOREFRONT_URL=https://tumanada.cl` en Railway; bienvenida verificada E2E (alta de cuenta → llega el email).
10. **Dominio.** Conectar `tumanada.cl` (Vercel, frontend) y `api.tumanada.cl` (Railway, backend); ajustar CORS + `MEDUSA_BACKEND_URL` + env vars de Vercel al dominio final y **redeploy**.

---

## 5 · Checklist — "Primer deploy de producción funcional"

Se marca cuando la tienda funciona de punta a punta de cara al público:

- [x] MVP cerrado (Etapa A cuentas ✅ D26 + Etapa B tienda coherente ✅ D28 + endurecimiento ✅ D29) — plan D25.
- [x] Backend Medusa desplegado (Railway + Postgres + Redis) con secrets de prod reales — ✅ D30.
- [x] Seed/datos de prod + publishable key de prod (`pk_0fe6…`, 6 productos, `ENVIO_GRATIS_30K`) — ✅ D30.
- [x] CORS del backend incluye el dominio del frontend (`tumanada.cl` + `www`) — ✅ D30.
- [x] `NEXT_PUBLIC_MEDUSA_BACKEND_URL` + `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` seteadas en Vercel → redeploy — ✅ D30.
- [x] Smoke en vivo: catálogo hidrata (Acana $28.990) · CORS OK · `/health` 200 — ✅ D30. *(Pendiente: una compra de prueba real de punta a punta.)*
- [x] Dominio `tumanada.cl` conectado en Vercel + DNS + SSL (`www` canónico) — ✅ D30.
- [x] Email transaccional en vivo: `RESEND_API_KEY`/`RESEND_FROM`/`STOREFRONT_URL` en Railway + dominio verificado en Resend (D45 · D49) — ✅ HECHO.
- [x] **Tracking (D46):** **GTM** `GTM-P5RLWHJW` + `NEXT_PUBLIC_GTM_ID` en Vercel · **GA4** `G-1JQM28SLWW` conectada dentro de GTM con los 6 eventos y contenedor publicado · verificado en Tiempo real — ✅ D30.
- [ ] **Search Console:** dominio `tumanada.cl` verificado + `sitemap.xml` enviado — ⬜ fast-follow.
- [ ] (Si aplica) **Meta Pixel** / **Google Ads** conectados dentro de GTM para campañas — ⬜.
- [ ] **Packshots** subidos por Admin (hoy emoji) — ⬜ fast-follow.
- [ ] Recién entonces: **Mercado Pago** (Checkout Pro) — posterior, no bloquea el prod funcional del flujo manual.

---

## 6 · Referencias

- Decisiones: **D30** (infra en vivo — Railway + Vercel + dominio + tracking), D27 (Vercel staging), D20 (monorepo), D21 (Medusa), D22 (MVP-first), D25 (infra de lanzamiento como deuda), D45 (Resend), D46 (SEO/tracking), D49 (Resend en vivo + CTA bienvenida).
- Reglas arquitectónicas: `ARCHITECTURE.md §2` (backend solo en `apps/backend`; web sin lógica de negocio).
- Env local: `apps/web/.env.example` · backend local: `apps/backend/DEV.md`.
