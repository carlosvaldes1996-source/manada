# web/ — Frontend de Manada (Next.js)

App real del e-commerce **Manada** (Fase 3). La fuente de verdad de producto/marca/diseño vive en **`../ai-context/`** — léela antes de tocar código.

> ⚠️ **Este Next.js tiene breaking changes** respecto a versiones previas. Lee `web/AGENTS.md` y los docs en `node_modules/next/dist/docs/` antes de escribir código.

## Stack (D13/D15)

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript 5.9** (estricto)
- **Tailwind CSS v4** — CSS-first vía `@theme` en `src/app/globals.css` (**no hay `tailwind.config.ts`**)
- **Radix UI** (primitivas accesibles) · **framer-motion 12** · **lucide-react**
- Fuentes **Fraunces** + **Hanken Grotesk** vía `next/font/google`
- Gestor de paquetes: **pnpm**

## Empezar

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Rutas útiles en dev:
- `/` Home · `/categoria/[slug]` · `/producto/[slug]` · `/carrito` · `/checkout` · `/cuenta` · `/cuenta/mascotas`
- `/dev/tokens` — styleguide de design tokens
- `/dev/components` — styleguide navegable de la Component Library

## Verificar (debe quedar todo en verde)

```bash
pnpm build
pnpm exec tsc --noEmit
pnpm lint
```

## Estructura

```
src/
├── app/            # rutas (App Router) + globals.css (tokens @theme)
├── components/     # ui · layout · commerce · pet · providers · dev
├── hooks/          # useDisclosure, useBreakpoint, usePrefersReducedMotion, useSubscription…
├── lib/            # utils, format, motion, anticipation, icons, data/catalog, demo-data
├── config/         # site, nav
└── types/          # Pet, Product, CartItem, ShippingEstimate…
```

## Documentación

- **Catálogo de componentes:** `../ai-context/COMPONENT_LIBRARY.md`
- **Arquitectura del frontend:** `../ai-context/FRONTEND_ARCHITECTURE.md`
- **Backlog UI/UX:** `../ai-context/AUDIT_UI_UX.md`
- **Estado y siguiente paso:** `../ai-context/CURRENT_STATE.md`
- **Cómo continuar (Etapa 3):** prompt #7 de `../ai-context/PROMPTS.md`
