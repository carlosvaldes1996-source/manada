# Manada

Tienda e-commerce (mascotas) en Chile. Monorepo pnpm con storefront Next.js (`apps/web`) que consume un backend Medusa v2 (`apps/backend`). Importado desde GitHub (`carlosvaldes1996-source/manada`).

## Run & Operate (en Replit)

- Storefront: workflow **"Storefront (web)"** → `pnpm --filter @manada/web exec next dev -H 0.0.0.0 -p 5000` (preview en `/`).
- Backend Medusa (aún no configurado aquí): requiere Postgres, migraciones y seed. Ver `apps/backend/DEV.md`.
- pnpm del entorno: 10.26.1 (nix). El campo `packageManager` del repo fija 10.33.2; se desactivó la auto-gestión de versiones en `~/.npmrc` (`manage-package-manager-versions=false`) para que pnpm no intente autoinstalarla.
- El storefront lee `apps/web/.env.local` (no versionado): `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GTM_ID`.

## Stack

- Monorepo pnpm (`apps/*`, `packages/*`), Node 24.
- Frontend: Next.js 16 (Turbopack), React 19, Tailwind v4, Radix UI, framer-motion.
- Backend: Medusa v2 (Postgres 16; Redis opcional en dev).
- Deploy original: Railway (`railway.json`).

## Where things live

- `apps/web/` — storefront Next.js (App Router). Home = server component que hace fetch a Medusa (`listProducts`), por eso da 500 si el backend no está arriba.
- `apps/backend/` — Medusa v2. Setup en `apps/backend/DEV.md`.
- `prototype/` — mockups HTML de referencia.
- `ai-context/` — documentación de decisiones del proyecto (D20, D21, etc.).

## Architecture decisions

- Next dev debe correr con `-H 0.0.0.0` y `allowedDevOrigins` (en `next.config.ts`) para funcionar tras el proxy iframe de Replit.
- Este proyecto NO usa el sistema de "artifacts" de Replit; corre con un workflow webview normal.

## User preferences

_Poblar según indique el usuario._

## Gotchas

- Si un workflow pnpm falla con `pnpm add pnpm@10.33.2 ... exit code 1`, falta `manage-package-manager-versions=false` en `~/.npmrc`.
- El storefront necesita el backend Medusa levantado para que la home (y páginas de catálogo/checkout) no den 500.
