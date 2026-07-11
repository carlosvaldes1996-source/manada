# FRONTEND_ARCHITECTURE — Arquitectura real de `apps/web`

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Arquitectura REAL del frontend: stack, estructura, patrones de datos y convenciones. (El plan original de 2026-06-27 está archivado en `history/06`.) |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo — refleja el código en producción de desarrollo |
> | **Last Updated** | 2026-07-11 |
> | **Depends On** | DESIGN_SYSTEM.md (tokens), ARCHITECTURE.md (§2 reglas), API.md (contratos que consume) |
> | **Supersedes** | `history/06-frontend-architecture-plan-2026-06-27.md` (plan pre-implementación + bitácora de etapas) |
> | **Source of Truth** | ✅ de *la arquitectura del frontend*. El catálogo de uso de componentes es COMPONENT_LIBRARY.md. |

> ⚠️ **Antes de tocar código:** leer `apps/web/AGENTS.md` y los docs de Next 16 en `apps/web/node_modules/next/dist/docs` (cambios de ruptura). Component-system-first: mapear a los tipos/componentes existentes, no reescribir.

## 1. Stack (versiones reales — D13, movido a `apps/web` por D20)

Next.js **16** (App Router, Turbopack) · React **19** · TypeScript **5.9** estricto · **Tailwind v4 CSS-first** (`@theme` en `src/app/globals.css`; **no existe `tailwind.config.ts`**) · Radix UI (16 paquetes, primitivas a11y) · framer-motion 12 · lucide-react · `@medusajs/js-sdk`. Fuentes self-hosted con `next/font/google` (Fraunces variable con eje `opsz` + Hanken Grotesk).

## 2. Estructura real de `src/`

```
src/
├── app/                         # rutas (App Router); vistas co-locadas *-view.tsx
│   ├── page.tsx                 # / — server: hidrata catálogo → HomeSwitch decide
│   │                            #   LandingView (anónimo) vs DashboardView (sesión) — U041/D17
│   ├── (tienda)/                # categoria/[slug] · producto/[slug] · carrito · buscar ·
│   │                            #   cuenta{,/mascotas,/pedidos,/direcciones} · páginas de contenido
│   ├── checkout/ + checkout/confirmacion/
│   ├── comenzar/ (+ recomendacion/)      # funnel: wizard + plan de la mascota (F1–F4)
│   ├── {ingresar,crear-cuenta,recuperar,recuperar/nueva,bienvenida}/
│   ├── dev/                     # styleguide /dev/{components,tokens,medusa} — 404 en prod (D29)
│   ├── error.tsx · not-found.tsx (de marca, D29)
│   └── globals.css              # TODOS los tokens del design system (@theme)
├── components/
│   ├── ui/ · layout/ · commerce/ · pet/   # librería (~70+) → COMPONENT_LIBRARY.md
│   ├── providers/               # Motion → Session → Pet → Cart → Toast (AppProviders)
│   └── dev/
├── lib/                         # format · motion · anticipation · recommend (puro) ·
│   │                            #   catalog (filtros/facetas puros) · pet · icons · demo-data
│   └── medusa/                  # LA capa de datos (ver §3)
├── hooks/                       # use-auth-actions · use-disclosure · use-breakpoint · …
├── config/                      # site.ts (SITE) · nav.ts (MAIN_NAV, LIVE_ACCOUNT_HREFS)
└── types/                       # Pet, Product, CartItem, User, …
```

## 3. Patrón de datos (regla de la casa)

1. **Todo dato de negocio entra por `lib/medusa/`** (cliente SDK + funciones por dominio + mappers `Store* → tipo del front`). Ningún componente conoce la forma de Medusa fuera del mapper. El front **no calcula negocio** (precios de suscripción, regla de envío, relojes de anticipación = backend).
2. **Server component hidrata → vista cliente recibe props** (patrón D23): `page.tsx` (server, `force-dynamic`) llama `listProducts()`/etc. y pasa datos a `*-view.tsx` (cliente). Aplica a Home, PLP, PDP, `/buscar`, `/comenzar/recomendacion`, `/bienvenida`, `/cuenta/mascotas`.
3. **Providers = la costura con el backend:** `SessionProvider` (JWT persistente del SDK; SSR cae a `nostore`) · `PetProvider` (hidrata `/store/pets` al login; empuja mascotas de invitado — espejo de `transferCart`; escrituras optimistas + PATCH) · `CartProvider` (carrito real; `cart_id` en `localStorage`). Los componentes consumen la superficie pública de los providers; cambiar el backend no toca componentes.
4. **Flags de honestidad:** `SUBSCRIPTIONS_ENABLED=false` en `lib/medusa/map-product.ts` (D29) apaga toda la UI de suscripción en cascada (gateada por `product.subscribable`).

## 4. Convenciones

- **Component-system-first:** token → componente de librería → página. Nunca markup suelto ni valores mágicos de color (todo sale de `globals.css`).
- **Paridad logueado/no-logueado (principio 9, D31):** misma superficie visual = mismo componente compartido; la experiencia con sesión jamás usa una versión más antigua que la anónima.
- **Datos estructurados se editan con el patrón del funnel** (chips/selector/buscador; nunca texto libre) — D38.
- **Comprar ≠ definir qué come** (D39): la PDP es e-commerce puro; el perfil define; el puente es un toast de 1 tap.
- Server Components por defecto; `"use client"` solo con estado/efectos. Vistas co-locadas `*-view.tsx`. Naming: carpetas `kebab-case`, componentes `PascalCase`, barrels por carpeta.
- **A11y AA:** Radix en interactivos, foco visible, color+ícono/texto, áreas ≥44px, `prefers-reduced-motion`.
- **Verificación estándar de todo bloque:** `pnpm exec tsc --noEmit` + `pnpm lint` + `pnpm build` + smoke HTTP de las rutas tocadas.

## 5. Historia

Cómo se llegó aquí (etapas, deviations del plan, rationale): D12–D19 en `DECISIONS.md` y el plan original archivado en `history/06-frontend-architecture-plan-2026-06-27.md`.
