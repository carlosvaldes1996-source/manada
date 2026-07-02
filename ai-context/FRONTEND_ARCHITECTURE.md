# FRONTEND_ARCHITECTURE — Sistema de componentes Manada (Next.js)

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Arquitectura del frontend `web/`: estructura `src/`, inventario, puente de tokens y orden de construcción + bitácora de ejecución por etapa. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟡 En ejecución — Etapas 1–2 ✅ (§9); Etapa 3 (pantallas) siguiente. |
> | **Last Updated** | 2026-06-29 |
> | **Depends On** | DESIGN_SYSTEM.md, UX.md, ARCHITECTURE.md, AUDIT_UI_UX.md |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ de *la arquitectura del frontend*. El catálogo de uso de componentes es COMPONENT_LIBRARY.md. |
>
> **⚠️ Lectura:** las §§1–8 son el **plan original (2026-06-27)**. La **realidad ejecutada** (que difiere en 3 puntos) está en §9 y en D13/D15. Donde haya conflicto, **manda §9**.

> **Plan ejecutable.** Define la estructura `src/`, el inventario de componentes reutilizables, el puente de design tokens a Tailwind y el orden de construcción, para que **otro chat pueda implementarlo sin re-derivar contexto**.
>
> - **Fuente de verdad visual:** `prototype/` (6 páginas HTML + `assets/styles.css` con todos los tokens y clases de componente ya aplicados). Cada componente de este inventario mapea a un bloque ya diseñado del prototipo.
> - **Fuente de verdad de marca/diseño:** `ai-context/DESIGN_SYSTEM.md` (D11) y `BRANDING.md`.
> - **Stack confirmado:** `ai-context/ARCHITECTURE.md §1` + decisión **D12** (este giro).
> - *Generado: 2026-06-27. Etapa 1 ejecutada: 2026-06-28 (ver §9 y D13).*
>
> **⚙️ Estado de ejecución:** Etapa 1 (fundaciones) **completa** en `web/`. Tres ajustes sobre este plan, ya aplicados (detalle en §9 y D13): (1) **Tailwind v4 = CSS-first** → tokens en `globals.css` con `@theme`, **no** `tailwind.config.ts`; (2) **rutas semánticas** `/categoria/[slug]`, `/producto/[slug]`, `/cuenta/mascotas` (no `plp/pdp/mascota`); (3) **estado con Context Providers** (`usePet`/`useCart`), `localStorage` diferido a Etapa 2.

---

## 1. Stack y convenciones

- **Framework:** Next.js (App Router) + React + **TypeScript** (estricto).
- **Estilos:** Tailwind CSS con tokens de marca en `tailwind.config.ts` + CSS variables en `globals.css` (mismo set que `prototype/assets/styles.css`). **No** CSS-in-JS.
- **Primitivas UI:** shadcn/ui re-estilizado a la marca (Radix por debajo → accesibilidad y foco gratis). Los componentes `ui/` envuelven o reemplazan a shadcn manteniendo nuestra API.
- **Iconos:** `lucide-react` (línea 1.75px, rounded) — reemplaza los emojis stand-in del prototipo.
- **Componentes Server por defecto;** marcar `"use client"` solo donde haya estado/efectos (drawer, toggle, tabs, qty, cart).
- **Naming:** carpetas `kebab-case`, componentes `PascalCase`, hooks `useX`, un componente por archivo + `index.ts` barrel por carpeta.
- **Estado demo:** sin backend aún; datos en `src/lib/data/*` y estado de carrito/mascota en hooks con `localStorage` (igual que `prototype/assets/app.js`). El backend real (Medusa.js u otro, **a validar**) entra en Fase 4 — ver `ARCHITECTURE.md`.
- **A11y y motion:** WCAG AA, foco visible, áreas táctiles ≥44px, `prefers-reduced-motion` (heredado del prototipo).

---

## 2. Estructura de carpetas

```
src/
├── app/                          # Rutas (App Router) = "pages"
│   ├── layout.tsx                # <html>, fuentes, AppShell, providers
│   ├── globals.css               # tokens (CSS vars) + base
│   ├── page.tsx                  # Home            (← index.html)
│   ├── plp/page.tsx              # Listado         (← plp.html)
│   ├── pdp/[slug]/page.tsx       # Ficha           (← pdp.html)
│   ├── mascota/page.tsx          # Perfil mascota  (← mascota.html)
│   ├── carrito/page.tsx          # Carrito         (← carrito.html)
│   └── checkout/page.tsx         # Checkout        (← checkout.html)
│
├── components/
│   ├── ui/                       # Primitivas sin lógica de dominio (~28)
│   ├── layout/                   # Chrome de la app (~8)
│   └── commerce/                 # Componentes de dominio e-commerce (~16)
│
├── lib/
│   ├── utils.ts                  # cn() (clsx + tailwind-merge)
│   ├── format.ts                 # formatCLP(), formatDate(), ration()
│   ├── anticipation.ts           # motor de anticipación (días restantes, etapa)
│   ├── tokens.ts                 # tokens tipados (espejo del theme)
│   └── data/
│       ├── pets.ts               # Toby + tipos Pet
│       ├── products.ts           # catálogo demo + tipos Product
│       ├── cart.ts               # carrito demo
│       └── nav.ts                # estructura de navegación / mega-menú
│
├── hooks/                        # (~7)
│   ├── use-cart.ts
│   ├── use-pet.ts
│   ├── use-subscription.ts
│   ├── use-disclosure.ts
│   ├── use-breakpoint.ts
│   ├── use-reduced-motion.ts
│   └── use-toast.ts
│
└── types/
    └── index.ts                  # Pet, Product, CartLine, ShippingOption, etc.

tailwind.config.ts                # tokens de marca (color/space/radius/shadow/font)
```

---

## 3. Puente de tokens → Tailwind

Los tokens ya existen como CSS variables en `prototype/assets/styles.css`. Se portan **idénticos** a `globals.css` y se exponen en Tailwind por nombre semántico (no por escala cruda en el markup).

`tailwind.config.ts` (extracto guía):

```ts
theme: {
  extend: {
    colors: {
      terracota: { 50:'#FBF0EB', 100:'#F5DAD0', /* …900:'#421F14' */ },
      pino:      { /* 50…900 */ },
      miel:      { /* 50…900 */ },
      arena:    '#FAF6F0', carbon: '#2A2722',
      // semánticos (preferidos en JSX):
      canvas:'var(--bg-canvas)', surface:'var(--bg-surface)',
      brand:'var(--text-brand)', 'brand-soft':'var(--bg-brand-soft)',
      success:{DEFAULT:'#3C8C5A', soft:'#E7F2EC', strong:'#256B42'},
      info:{DEFAULT:'#3B7A9E', soft:'#E7F0F4', strong:'#255A78'},
      urgency:{DEFAULT:'#D98324', soft:'#FBEDDD', strong:'#9A5A12'},
    },
    fontFamily: { display:['var(--font-fraunces)'], ui:['var(--font-hanken)'] },
    borderRadius: { sm:'8px', md:'12px', lg:'16px', xl:'24px', pill:'999px' },
    boxShadow: { xs:'0 1px 2px rgba(42,39,34,.06)', sm:'0 2px 8px rgba(42,39,34,.08)',
                 md:'0 8px 24px rgba(42,39,34,.10)', lg:'0 16px 48px rgba(42,39,34,.12)' },
    maxWidth: { container:'1280px' },
  }
}
```

**Reglas:** un acento por vista (Terracota=acción, Miel=anticipación/suscripción); fondo Arena (nunca blanco puro); texto sobre Miel = Carbón. Tipografía: `font-display` (Fraunces) solo títulos/emoción; `font-ui` (Hanken, `tabular-nums`) para datos/precios. Breakpoints Tailwind por defecto coinciden con el brief (sm640/md768/lg1024/xl1280).

Fuentes: `next/font/google` → Fraunces + Hanken Grotesk, expuestas como `--font-fraunces` / `--font-hanken`.

---

## 4. Inventario de componentes (~52)

> Formato: **Nombre** — props clave — (← bloque del prototipo). "client" = necesita `"use client"`.

### 4.1 `components/ui/` — primitivas (28)

| # | Componente | Props (contrato) | Mapea a |
|---|---|---|---|
| 1 | **Button** | `variant?: 'primary'\|'secondary'\|'ghost'\|'subscribe'; size?:'md'\|'lg'; block?:boolean; asChild?:boolean` | `.btn*` |
| 2 | **IconButton** | `label:string; children` (a11y `aria-label`) | `.icon-btn` |
| 3 | **Badge** | `variant:'subscribe'\|'success'\|'urgency'\|'info'\|'error'` | `.badge*` |
| 4 | **Chip** | `active?:boolean; onToggle?:()=>void` · client | `.chip` |
| 5 | **Card** | `as?; padded?:boolean` | `.card` |
| 6 | **Input** | `label?; error?; ...inputHTML` | `.input` |
| 7 | **Select** | `label?; options:{value,label}[]` | `.input` (select) |
| 8 | **Textarea** | `label?; ...` | — |
| 9 | **Field** | `label; htmlFor; hint?; error?` (wrapper) | `.field` |
| 10 | **RadioCard** | `selected; value; name; onSelect` · client | `.radio-card` |
| 11 | **Checkbox** | `checked; onChange; label` | `.check` |
| 12 | **Toggle** | `on:boolean; onChange; label` (switch, "on"=Miel) · client | `.toggle` |
| 13 | **Tabs** | `tabs:{id,label}[]; defaultId` + `TabPanel` · client | `.tabs` |
| 14 | **Breadcrumb** | `items:{label,href?}[]` | `.crumb` |
| 15 | **Rating** | `value:number; count?:number` | `.stars` |
| 16 | **Price** | `now:number; was?:number; size?` (CLP, tabular) | `.product__price` |
| 17 | **Avatar** | `emoji?\|src?; size:'sm'\|'lg'` | `.pet-switch__avatar`/`.avatar-lg` |
| 18 | **ProgressBar** | `value:0-100; tone:'miel'\|'brand'` | `.completeness`/`.capsule__bar` |
| 19 | **Skeleton** | `w?;h?;radius?` (shimmer cálido) | (loaders del brief) |
| 20 | **Drawer** | `open; onClose; side:'right'` · client | `.overlay.drawer` |
| 21 | **Sheet** | `open; onClose` (bottom) · client | `.overlay.sheet` |
| 22 | **Dialog** | `open; onClose; title` · client | (modales xl) |
| 23 | **Popover** | `trigger; children` · client | "¿por qué te lo recomendamos?" |
| 24 | **Toast** | vía `useToast()` · client | feedback add-to-cart |
| 25 | **QtyStepper** | `value; onChange; min=1` · client | `.qty` |
| 26 | **SectionHeading** | `overline?; title; href?; linkLabel?` | encabezados de sección |
| 27 | **EmptyState** | `icon; title; body; action?` | estados vacíos del brief |
| 28 | **Container** | `as?; size?` (máx 1280, paddings responsive) | `.container` |

### 4.2 `components/layout/` — chrome (8)

| # | Componente | Props | Mapea a |
|---|---|---|---|
| 29 | **AppShell** | `children; padBottomNav?:boolean` | `<body class="pb-nav">` |
| 30 | **Header** | `variant?:'default'\|'checkout'; activePage` | `<manada-header>` |
| 31 | **Navbar** | `activePage` (desktop) | `.navbar` |
| 32 | **MegaMenu** | `data: NavColumn[]` | `.mega` |
| 33 | **SearchBar** | `placeholder; onSubmit?` · client | `.search` |
| 34 | **PetSwitcher** | usa `usePet()` · client | `.pet-switch` (global) |
| 35 | **Footer** | — | `<manada-footer>` |
| 36 | **BottomNav** | `activePage` | `<manada-botnav>` |

### 4.3 `components/commerce/` — dominio (16)

| # | Componente | Props | Mapea a |
|---|---|---|---|
| 37 | **ProductCard** | `product:Product; subscribable?` | `.product` |
| 38 | **ProductGrid** | `products:Product[]` (2→3→4 col) | `.grid-products` |
| 39 | **ProductRail** | `title; products` (scroll-snap) | `.rail` |
| 40 | **HonestShippingBlock** | `date:string; cost:number\|'free'; comuna` | `.ship` ✱ siempre visible |
| 41 | **SubscriptionBox** | `price; discountPct; frequency; onToggle` · client | `.subbox` (PDP) |
| 42 | **AnticipationCapsule** | `petName; daysLeft; productName; runOutDate; onReschedule` | `.capsule` |
| 43 | **PersonalizationBanner** | `pet:Pet` ("Filtrado para Toby") | `.perso-banner` |
| 44 | **ReasonWhy** | `text` (dentro de Popover) | transparencia del brief |
| 45 | **PetProfileHeader** | `pet:Pet; completeness:number` | cabecera `mascota.html` |
| 46 | **PetEditCard** | `label; value?; emptyHint?; onEdit` (lleno/vacío) | `.edit-card`/`--empty` |
| 47 | **CartLine** | `line:CartLine; onQty; onRemove` · client | `.line` |
| 48 | **OrderSummary** | `lines; subtotal; savings; shipping; total; cta` | `.summary`/`.totals` |
| 49 | **FreeShippingBar** | `remaining:number` | `.freebar` |
| 50 | **CheckoutStepper** | `steps:{n,title,done}[]` + **CheckoutStep** | `.step` |
| 51 | **PaymentMethodSelector** | `methods; value; onChange` · client | radio-cards pago |
| 52 | **FiltersPanel** | `groups:FilterGroup[]` → render en **FiltersSidebar** (desktop) y **FiltersSheet** (móvil) · client | `.filters`/sheet |

> Tiles auxiliares de Home (**QuickAccessTile**, **CategoryTile**, **EduBlock**, **VisitorHero**) pueden vivir como secciones en `app/page.tsx` o promoverse a `commerce/home/` si se reutilizan. Cuentan dentro del rango ~50-55.

---

## 5. `lib/` y `hooks/`

**lib/format.ts**
- `formatCLP(n)` → `"$54.990"` (separador de miles, tabular).
- `formatDate(d)` → `"mañana 28 jun"` / `"2 de julio"`.
- `dailyRation(weightKg, stage)` → g/día (≈18 g/kg adulto, demo).

**lib/anticipation.ts** (motor del diferenciador, stub con reglas estáticas del brief §5)
- `daysLeft(bagKg, ration, lastPurchase)` → nº días + % restante.
- `suggestStageTransition(pet)` → fórmula sugerida por edad/etapa.
- `crossSellPharmacy(pet)` → recordatorio desparasitación por especie+peso+RM.

**lib/data/** — `Pet` demo = Toby (perro, adulto, 8 kg, Ñuñoa); catálogo (Royal Canin, Pro Plan, Hill's, Acana, NexGard…), carrito demo (2 líneas), navegación.

**hooks/**
- `useCart()` → `{ count, lines, add, remove, setQty, totals }` (localStorage, espejo de `app.js`).
- `usePet()` → `{ active, pets, switchTo }` (selector global re-personaliza la UI).
- `useSubscription()` → `{ on, frequency, toggle, setFrequency, savings }`.
- `useDisclosure()` → `{ open, onOpen, onClose, onToggle }` (drawer/sheet/dialog).
- `useBreakpoint()` / `useReducedMotion()` / `useToast()`.

---

## 6. Mapeo páginas → componentes

| Ruta | Componentes principales |
|---|---|
| `/` Home | AnticipationCapsule, QuickAccessTile×4, ProductRail, EduBlock, CategoryTile, VisitorHero |
| `/plp` | Breadcrumb, PersonalizationBanner, Chip(filtros), SortSelect, FiltersSidebar/Sheet, ProductGrid |
| `/pdp/[slug]` | galería+thumbs, Price, SubscriptionBox, RadioCard(mascota), HonestShippingBlock, Button×2, StickyCta, Tabs, ProductRail(cross-sell) |
| `/mascota` | PetProfileHeader, ProgressBar, AnticipationCapsule, PetEditCard×N, cross-sell farmacia, tiles de acción |
| `/carrito` | CartLine×N, FreeShippingBar, OrderSummary, ProductRail(cross-sell) |
| `/checkout` | Header(checkout), CheckoutStepper, Field/Input, RadioCard(despacho), PaymentMethodSelector, Toggle(suscripción), OrderSummary(sticky) |

Todas envueltas en **AppShell** (Header + BottomNav + Footer).

---

## 7. Orden de construcción (para el chat ejecutor)

1. **Scaffold:** `create-next-app` (TS, Tailwind, App Router) en carpeta nueva (p.ej. `/app` o `/web`), conservando `/prototype` como referencia.
2. **Tokens:** portar `styles.css` → `globals.css` + `tailwind.config.ts`; cargar fuentes con `next/font`. Validar con un spike visual.
3. **lib/ + types/ + hooks/:** datos demo y utilidades primero (sin UI).
4. **ui/ (28):** primitivas, empezando por Button/Card/Badge/Input/Price/Toggle.
5. **layout/ (8):** AppShell + Header/Footer/BottomNav (portar de los Web Components ya hechos).
6. **commerce/ (16):** ProductCard → resto.
7. **app/ (6 rutas):** componer las páginas reutilizando todo lo anterior; comparar 1:1 contra el prototipo a 360/768/1280px.
8. **QA:** AA de contraste, foco, `prefers-reduced-motion`, Lighthouse.

**Criterio de paridad:** cada página Next debe ser visualmente equivalente a su `.html` del prototipo (mismo layout, copy y datos de Toby).

---

## 8. Notas

- El prototipo `/prototype` **no se borra**: es la referencia visual y de copy (voz de marca) que el ejecutor debe replicar.
- Backend, pagos CL, búsqueda y motor de recompra real → Fase 4 (`ARCHITECTURE.md §3`, `API.md`, `DATABASE.md`). Aquí solo se construye el frontend con datos demo.
- Si se adopta shadcn/ui: instalar y re-tematizar (no usar estilos por defecto); nuestros `ui/` mantienen la API de esta tabla aunque por dentro usen Radix.

---

## 9. Estado de ejecución (Fase 3)

### ✅ Etapa 1 — Fundaciones (2026-06-28 · D13) — en `web/`
- **Scaffold:** `create-next-app` → Next 16 (App Router, Turbopack), React 19, TS 5.9 estricto, ESLint. + framer-motion, lucide-react, shadcn deps (`clsx`, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`).
- **Tokens/tema:** todo el design system en `src/app/globals.css` — CSS vars en `:root` (escalas 50–900, semánticos, estados soft/base/strong, radios, sombras cálidas, motion) expuestas a Tailwind con `@theme inline`, + **puente shadcn** (`--primary`/`--background`/`--accent`…). *No hay `tailwind.config.ts`* (Tailwind v4 CSS-first). `components.json` configurado (*new-york*, `cssVariables`, alias `@/*`).
- **Tipografía:** `next/font/google` (Fraunces 400/500/600 + Hanken 400–700) → vars `--font-fraunces`/`--font-hanken`. Escala como clases en `@layer components` (`display-xl`…`price`, `.pet-name`).
- **Routing:** `app/page.tsx` (Home) + grupo `(tienda)/{categoria/[slug],producto/[slug],carrito,cuenta,cuenta/mascotas}` + `checkout/` + `dev/tokens` (styleguide). Placeholders provisionales (`components/dev/route-placeholder.tsx`).
- **Providers:** `components/providers/` → `AppProviders` = `MotionProvider`(reduced-motion) → `PetProvider`(`usePet`) → `CartProvider`(`useCart`). Montados en el root layout.
- **Foundation lib/types/config:** `lib/utils.ts` (`cn`), `lib/format.ts` (`formatCLP`/fecha/plural), `lib/demo-data.ts` (Carlos+Toby), `config/site.ts`, `config/nav.ts`, `types/index.ts` (Pet, Product, CartItem, ShippingEstimate, AnticipationNudge…).
- **Carpetas listas (con README):** `components/{ui,layout,commerce,pet}`, `hooks/`.
- **QA:** `tsc --noEmit` ✅ · `eslint` ✅ · `next build` ✅ (9 rutas) · smoke-test HTTP 200 + fuentes self-hosted ✅.

### ✅ Etapa 2 — Componentes (2026-06-28 · D15) — en `web/`
Construida la **librería completa de ~70 componentes** en `components/{ui,layout,commerce,pet}` + `hooks/` + `lib/`. Documentación de uso en **`COMPONENT_LIBRARY.md`** (catálogo + cuándo usar cada uno); **styleguide navegable en `/dev/components`**.
- **Base a11y:** **Radix UI** para primitivas interactivas (Dialog, Drawer/Sheet, Select, Combobox, Tabs, Switch, Checkbox, RadioGroup, Slider, Tooltip, Popover, DropdownMenu, Separator). Toast y carrusel propios. *Confirma el "shadcn/Radix" de ARCHITECTURE.md §1; sustituye los componentes shadcn por wrappers propios sobre Radix con la API de §4.*
- **Cobertura ampliada** sobre el inventario §4 (el brief de Etapa 2 pidió más): se añadieron Combobox, Slider, Banner, Pagination, Fab, CategoryCard, BrandCard, ReviewCard, badges de stock/descuento/envío/suscripción, ShippingMethod, PaymentMethod, Coupon, FeedingSchedule, PetStatus, además de los del inventario.
- **Contratos de props:** mantenidos respecto a §4 (algunos nombres afinados, p. ej. `RadioCard`, `HonestShippingBlock`, `FiltersSidebar`/`FiltersSheet`). Núcleo de mascota en `components/pet/`.
- **Backlog:** resuelve los 3 P0 de Fase 3.2 de `AUDIT_UI_UX.md` + mayoría de P1 (estados por ítem allí).
- **QA:** `tsc --noEmit` ✅ · `eslint` ✅ · `next build` (10 rutas) ✅ · smoke-test HTTP 200 ✅. **⏸ Espera aprobación del usuario** antes de Etapa 3.

### 🟢 Etapa 3 — Pantallas (en curso)
Home → Categoría → Producto → Carrito → Checkout → Mi Cuenta ensambladas con la Component Library + páginas de contenido (nosotros, ayuda, despacho, devoluciones, términos, privacidad, anticipación) sobre `layout/ContentPage`.

### 🟢 Fase 3.3B — New User Experience & Activation Flow (D16)
Embudo de activación del visitante nuevo. **No cierra la Fase 3.3** (espera revisión visual).

- **Rutas nuevas:** `/` (decide por sesión: `landing-view` vs `dashboard-view`) · `/comenzar` (alta de mascota, wizard conversacional con state-machine interna) · `/comenzar/recomendacion` · `/crear-cuenta` · `/ingresar` · `/bienvenida`. Vistas co-locadas (patrón `product-view.tsx`).
- **Estado (en memoria, sin backend — coherente con D13):** `components/providers/session-provider.tsx` (`useSession`) montado en `AppProviders` (Motion → Session → Pet → Cart → Toast). `PetProvider` y `CartProvider` **arrancan vacíos** y exponen `addPet`/`seedPets`/`clearPets` y `seedItems`/`clear`. Coordinador `hooks/use-auth-actions.ts` (`enterDemo` siembra Carlos+Toby+carrito; `leave` limpia).
- **Chrome:** `layout/funnel-shell.tsx` (embudo, con progreso) + variante `marketing` en `Header`/`AppShell` (Landing). El `FocusShell` de una iteración previa se retiró (unificado en `FunnelShell`).
- **Motor:** `lib/recommend.ts` (`recommendFood`/`recommendComplements`/`foodPlan`) reutiliza `lib/anticipation.ts`. Nuevos componentes de librería: `ui/feature-card.tsx`.
- **Integración:** `app/(tienda)/carrito` (bloque de confianza) y `app/checkout` (datos del comprador desde `useSession`; "pagar" → `/bienvenida`).
- **QA:** `tsc --noEmit` ✅ · `eslint` ✅ · `next build` (**22 rutas**) ✅ · smoke-test HTTP 200 ✅.

### ⬜ Etapa 4 — Polish (Fase 3.4)
Dirección de arte aplicada, microinteracciones, premium. Depende de **fotografía real (U090)**.
