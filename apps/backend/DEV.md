# Manada · Backend (Medusa v2) — setup local

Backend e-commerce del MVP (D21/D22). E-commerce primero; envíos y boleta
**manuales**; pago **manual** (`pp_system_default` = transferencia) hasta wirear Webpay.

## Requisitos
- Node ≥ 20, pnpm 10, PostgreSQL 16 corriendo en `localhost:5432`.
- (Redis **no** es necesario en dev: sin `REDIS_URL`, Medusa usa módulos in-memory.)

## Variables de entorno
`apps/backend/.env` (no versionado). Mínimo:
```
DATABASE_URL=postgres://<usuario>@localhost:5432/medusa_manada
STORE_CORS=http://localhost:3000,http://localhost:8000
ADMIN_CORS=http://localhost:5173,http://localhost:9000
AUTH_CORS=http://localhost:3000,http://localhost:5173,http://localhost:9000
JWT_SECRET=<secreto-dev>
COOKIE_SECRET=<secreto-dev>
```

## Puesta en marcha (desde la raíz del monorepo)
```bash
createdb medusa_manada                 # 1) crear la BD (una vez)
pnpm install                           # 2) instalar el workspace
pnpm migrate:backend                   # 3) migraciones (crea el esquema)
pnpm --filter @manada/backend exec medusa user -e admin@tumanada.cl -p <pass>   # 4) admin
pnpm seed:backend                      # 5) seed Chile (CLP + región + catálogo)
pnpm dev:backend                       # 6) arrancar → http://localhost:9000
```

- **Admin:** http://localhost:9000/app  (usuario del paso 4)
- **Store API:** `http://localhost:9000/store/*` con header `x-publishable-api-key: <pk_...>`
  (la key se crea en el seed; obtenerla: `select token from api_key where type='publishable';`)

## Lo que deja el seed (MVP)
- Tienda en **CLP**, región **Chile** (`cl`), tax region `cl`.
- Bodega **Santiago** + fulfillment **manual** + despacho **Estándar $3.990 / Express $5.990**.
- Pago **`pp_system_default`** (manual/transferencia) habilitado en la región.
- Sales channel **Manada Web** + publishable key (1↔1).
- **6 productos** en CLP alineados con `apps/web/src/lib/data/catalog.ts`.

## Checkout (verificado, Store API)
`POST /store/carts` → `line-items` → `POST /store/carts/:id` (shipping_address + email)
→ `shipping-options` → `shipping-methods` → `payment-collections` + `payment-sessions`
(`pp_system_default`) → `POST /store/carts/:id/complete` → **orden registrada**.
Fulfillment y boleta se gestionan a mano desde el Admin (D22).
