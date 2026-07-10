# COMPONENT_LIBRARY — Librería de componentes de Manada (Fase 3 · Etapa 2)

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Catálogo de los ~70 componentes reutilizables y cuándo usar cada uno. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | ✅ Etapa 2 completa (D15). Espera aprobación antes de Etapa 3. |
> | **Last Updated** | 2026-06-29 |
> | **Depends On** | DESIGN_SYSTEM.md, FRONTEND_ARCHITECTURE.md |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ del *uso de componentes*. El código vive en `apps/web/src/components/**`; styleguide en `/dev/components`. |

> **Catálogo y guía de uso de todos los componentes reutilizables.** Fuente de verdad de *cómo y cuándo* usar cada pieza del frontend. Construido sobre los design tokens (DESIGN_SYSTEM.md) y la arquitectura de FRONTEND_ARCHITECTURE.md.
>
> - **Código:** `apps/web/src/components/{ui,layout,commerce,pet}` + `apps/web/src/hooks` + `apps/web/src/lib`.
> - **Styleguide vivo y navegable:** `/dev/components` (todas las variantes, interactivo). Tokens en `/dev/tokens`.
> - **Estado:** ✅ Etapa 2 completa (2026-06-28 · D15). `tsc` + `eslint` + `next build` + smoke-test en verde. **Pendiente de aprobación del usuario** antes de Etapa 3 (pantallas).
> - **Regla:** las pantallas (Etapa 3) se ensamblan **solo** con estos componentes. Si falta algo, se agrega aquí primero (token → componente → página), nunca markup suelto en una página.

---

## 1. Principios de la librería

1. **Genérica, no específica de pantalla.** Ningún componente conoce una página concreta; recibe datos por props.
2. **TypeScript estricto.** Props tipadas y documentadas; sin `any`.
3. **Accesible (WCAG AA).** Las primitivas interactivas usan **Radix UI** por debajo (foco-trap, teclado, ARIA). Las señales nunca son solo color: siempre color + ícono/texto. Foco visible en todo lo interactivo. Áreas táctiles ≥44px.
4. **Responsive y mobile-first.** Breakpoints del sistema (sm640/md768/lg1024/xl1280).
5. **Respeta los tokens.** Color/espaciado/radio/sombra/tipografía/motion salen de `globals.css`. Cero valores mágicos de color en el markup.
6. **Estados completos.** Donde aplica: `loading`, `error`, `disabled`, `empty`, `hover`, `focus`, `active`.
7. **Motion con propósito** (Framer Motion + tokens), neutralizado por `prefers-reduced-motion`.
8. **Sin duplicación.** Variantes vía `cva`; composición sobre copia.
9. **Paridad logueado / no-logueado (D31).** Una misma superficie visual se implementa **una sola vez** y se comparte entre el estado anónimo y el de sesión (con props/variantes si el contexto cambia). La experiencia logueada **nunca** debe usar una versión más antigua de un componente que la anónima. Si una vista con sesión necesita algo que ya existe pulido en marketing, se reutiliza el componente, no se re-inlinea.

**Decisión clave (D15):** primitivas interactivas sobre **Radix UI** (lo previsto en ARCHITECTURE.md §1: "shadcn/Radix → accesibilidad gratis"). Componentes presentacionales hand-rolled sobre tokens. Toast y carrusel propios (sin dependencias extra).

---

## 2. Convenciones

- **Import:** por barrel — `@/components/ui`, `@/components/layout`, `@/components/commerce`, `@/components/pet`, `@/hooks`.
- **Server vs Client:** Server por defecto; `"use client"` solo donde hay estado/efectos (overlays, toggles, tabs, carrito, switch…).
- **`cn()`** (`@/lib/utils`) para componer clases (clsx + tailwind-merge).
- **`asChild`** (Radix Slot) en `Button`/`IconButton` para renderizar como `<Link>` conservando estilos.
- **Estado global:** `usePet()` / `useCart()` (providers) · `useToast()` (feedback). Datos demo en `lib/demo-data.ts` (Carlos + Toby + catálogo).

---

## 3. `ui/` — Primitivas (sin lógica de dominio)

### Layout
| Componente | Cuándo usar |
|---|---|
| **Container** | Centrar contenido con el ancho máx (1280) y paddings responsive. Base de toda sección. `size`: default/prose/full. |
| **Section** | Banda vertical de página con ritmo (`spacing`) y fondo (`tone`: canvas/subtle/brand/accent/inverse). Envuelve en Container salvo `contained={false}`. |
| **Stack / Row** | Flex 1D con la escala de gap del sistema. `Stack`=vertical, `Row`=horizontal centrado. El 80% de los layouts. |
| **Grid** | Grilla responsive declarativa: `<Grid cols={2} md={3} lg={4}>`. La grilla de catálogo es 2→3→4. |
| **Spacer** | Espacio vertical explícito o empujador flexible (`grow`) en contenedores flex. |

### Core
| Componente | Cuándo usar |
|---|---|
| **Button** | Acción. `variant`: primary (Terracota, 1 por vista) · secondary · ghost · subscribe (Miel) · link · destructive. `size` sm/md/lg, `block`, `loading`, `leadingIcon`, `asChild`. |
| **IconButton** | Acción de solo ícono; **exige `label`** (aria). Variantes ghost/solid/outline. |
| **Fab** | Acción flotante persistente (p. ej. "Pedir de nuevo"). Fija sobre la BottomNav. |
| **Badge** | Estado compacto no interactivo: neutral/subscribe/success/urgency/info/error/brand. Siempre con ícono+texto. |
| **Chip** | Filtro/selección interactivo (`aria-pressed`). `removable` = filtro aplicado con "×". |
| **Card** (+ Header/Title/Description/Content/Footer) | Agrupar contenido. `interactive` eleva la sombra al hover. |
| **FeatureCard** | Propuesta de valor: tile de ícono + título (Fraunces) + texto. "Cómo funciona", diferenciadores de confianza, próximos pasos (Landing, Bienvenida). `tone` brand/accent/pino. |
| **Price** | Precio en CLP tabular. El precio anterior va tachado en gris (nunca rojo de oferta). |
| **Rating** | Estrellas Miel con relleno parcial (4.8 ≠ 5.0) + valor accesible. |
| **Avatar** | Foto real (preferida) o fallback emoji/iniciales sobre degradado cálido. sm/md/lg/xl. |
| **Skeleton** | Placeholder de carga con shimmer cálido (no spinners donde hay layout). |
| **Separator** | Divisor 1px (Radix). |
| **SectionHeading** | Overline + título (Fraunces) + enlace "ver todo". Estandariza cabeceras de sección. |

### Formularios
| Componente | Cuándo usar |
|---|---|
| **Field** | Envoltura label + control + hint/error con aria cableado. La usan los controles; o envuelve controles a medida. |
| **Input / Textarea** | Texto de 1 o varias líneas. Con label/hint/error se auto-envuelven en Field. Adornos leading/trailing. |
| **Select** | Lista de pocas opciones (Radix). |
| **Combobox** | Lista **filtrable** cuando son muchas (comuna, marca, raza). Teclado ↑/↓/Enter/Esc, roles ARIA. |
| **Checkbox** | Selección múltiple (Radix). Soporta indeterminado; fila clicable con label + meta (conteo). |
| **Radio / RadioGroup / RadioCard** | Selección única (Radix). `RadioCard` = tarjeta seleccionable (despacho, mascota, pago). |
| **Switch** | On/off (Radix). Encendido = Miel (anticipación/suscripción). |
| **Slider** | Rango 1 o 2 thumbs (precio en filtros). `formatValue` para el valor legible. |
| **QuantitySelector** | Cantidad − valor + (carrito/PDP), con min/max y aria. |

### Feedback
| Componente | Cuándo usar |
|---|---|
| **ToastProvider / useToast** | Feedback efímero tras una acción ("Agregado al carrito"), con acción y región aria-live. Montado en `AppProviders`. |
| **Alert** | Mensaje contextual **dentro del flujo** (validación, aviso). info/success/urgency/error con ícono. |
| **Banner** | Anuncio **full-width** global (envío gratis, aviso). Opcionalmente descartable. |
| **Tooltip** | Pista breve al hover/focus (Radix). No para info esencial. |
| **Popover** | Contenido rico flotante: "¿por qué te lo recomendamos?" (transparencia). |
| **Dialog** | Modal centrado (confirmaciones, formularios cortos). Foco-trap/Esc/scroll-lock (Radix). |
| **Drawer / Sheet** | Panel deslizante lateral (carrito, menú) o inferior (filtros móviles). Mismo motor Radix. |
| **Progress** | Barra 0–100 (completitud de perfil, días de comida, envío gratis). role=progressbar. |
| **EmptyState** | Vacío cálido (carrito/búsqueda/sin mascotas): ilustración + copy + acción. |

### Navegación
| Componente | Cuándo usar |
|---|---|
| **Breadcrumb** | Orientación jerárquica (PLP/PDP); último item = página actual. |
| **Pagination** | Catálogo paginado: números con elipsis + prev/next. |
| **SearchBar** | Búsqueda prominente (`role=search`) con limpiar. Variantes bar/field. |
| **Tabs** | Secciones de la PDP (Descripción · Ingredientes · Opiniones) (Radix). |

---

## 4. `layout/` — Chrome de la app

| Componente | Cuándo usar |
|---|---|
| **AppShell** | Esqueleto: Header + main + Footer + BottomNav. Envuelve cada pantalla de tienda. `variant="checkout"` = chrome mínimo; `variant="marketing"` = header de visitante (Logo + Ingresar + Comenzar) + Footer, sin BottomNav (Landing). |
| **FunnelShell** | Chrome enfocado del **embudo de activación** (alta de mascota, recomendación, registro, login): Logo + progreso (`step`/`totalSteps`) + salida, sin nav/footer/bottom-nav. Reduce distracciones (patrón Stripe/Typeform). |
| **Header** | Sticky con blur: logo · buscador · selector de mascota · carrito. Monta Navbar (desktop) y MobileNav (móvil). |
| **Navbar** | Navegación por **necesidad** (desktop). El item "Comprar" despliega el MegaMenu. |
| **MegaMenu** | Panel por especie → necesidad → etapa (no por marca). |
| **MobileNav** | Drawer lateral con categorías + cuenta (móvil), disparado por el hamburguesa. |
| **Footer** | Pie de alto contraste (confianza/estructura). No aparece en checkout. |
| **BottomNav** | Barra inferior fija (< lg), 5 destinos con la mascota al centro. |
| **Logo** | Imagotipo "huella-manada" (placeholder vector). `variant` lockup/mark, `tone` default/inverse. |

---

## 5. `commerce/` — Dominio e-commerce

| Componente | Cuándo usar |
|---|---|
| **ProductCard** | Unidad central del catálogo. Packshot · badges · marca/nombre · rating · precio · despacho honesto · CTAs. Conecta al carrito + toast. **Una sola acción primaria** ("Agregar") + suscribir como secundario. |
| **ProductGrid** | Grilla 2→3→4 con estados `loading` (skeletons) y `empty` integrados. |
| **ProductRail** | Carrusel horizontal scroll-snap (cross-sell, destacados). |
| **CategoryCard / BrandCard** | Accesos por necesidad y por marca. `CategoryCard` acepta `imageUrl` (ícono-foto por slug, con fallback cálido si la foto falta) o `icon` (emoji, respaldo/styleguide); **la variante-foto es la canónica**. |
| **CategoryTiles** | Grid de accesos a categorías de la Home (`CATEGORIES.slice(0,4)` con íconos-foto). **Fuente única compartida** por la landing anónima (`LandingView`) y el dashboard con sesión (`DashboardView`) → ambos estados muestran las mismas tarjetas (D31; antes el logueado usaba emojis viejos). |
| **ReviewCard** | Reseña de PDP: autor, estrellas, compra verificada, mención a la mascota. |
| **StockBadge / DiscountBadge / ShippingBadge / SubscriptionBadge** | Átomos de e-commerce sobre Badge, con semántica correcta. |
| **HonestShippingBlock** | Despacho honesto (fecha + costo reales, **siempre visible**). Compacto (card) o completo (PDP). |
| **SubscriptionBox** | Caja de suscripción de la PDP (acento Miel): activar, frecuencia, ahorro, "pausa/cancela cuando quieras". |
| **PersonalizationBanner** | "Filtrado para Toby" en la PLP. |
| **FreeShippingBar** | Progreso real hacia el envío gratis; celebra al alcanzarlo. |
| **FiltersSidebar / FiltersSheet** | Filtros del catálogo: sidebar (desktop) y sheet inferior (móvil). Estado controlado por la página. |
| **CartItem** | Línea de carrito (cantidad, subtotal, eliminar). Página y drawer. |
| **CartDrawer** | Drawer lateral del carrito (líneas + FreeShippingBar + subtotal + CTA). |
| **OrderSummary** | Resumen de compra con desglose honesto; total como cifra mayor. |
| **Coupon** | Código de descuento con estados aplicando/aplicado/error. |
| **ShippingMethod / PaymentMethod** | Selección de despacho y pago (radio-cards). |
| **CheckoutStepper** | Progreso del checkout (Pino); completados en verde. Vertical u horizontal. |

---

## 6. `pet/` — Núcleo del producto (el moat)

| Componente | Cuándo usar |
|---|---|
| **PetAvatar** | Avatar de mascota: foto o emoji por especie sobre degradado cálido. |
| **PetCard** | Resumen de mascota para "Mis mascotas" (avatar + estado + completitud), clicable. |
| **PetStatus** | Fila de badges con los datos (especie · etapa · peso · raza · condiciones). |
| **PetSwitcher** | Selector global de mascota (header). Cambiarla re-personaliza la UI. |
| **PetProfileHeader** | Cabecera del perfil: avatar grande, nombre héroe, completitud. |
| **PetEditCard** | Dato editable; estado vacío = invitación cálida a completar. |
| **FeedingSchedule** | Ración diaria/por comida calculada por peso+etapa (motor de anticipación). |
| **RecommendationCard** | Recomendación personalizada (acento Miel) con motivo transparente (Popover). |
| **AnticipationCapsule** | El momento "se adelantó por mí": días restantes, barra Miel, reagendar/suscribir, razón honesta. Entra con slide+fade + un pulso. |

---

## 7. `hooks/` y `lib/`

**hooks/** — `useDisclosure` (overlays) · `useMediaQuery` / `useBreakpoint` / `useIsDesktop` (responsive, vía `useSyncExternalStore`) · `usePrefersReducedMotion` · `useSubscription` (estado de suscripción + ahorro de un producto) · `useAuthActions` (`enterDemo`/`leave`: coordina sesión + mascota + carrito) · re-export de `useSession`/`usePet`/`useCart`/`useToast`.

**Providers (estado global)** — `SessionProvider`/`useSession` (cuenta: `signUp`/`signInDemo`/`signOut`, anónimo por defecto) · `PetProvider`/`usePet` (arranca vacío; `addPet`/`seedPets`/`clearPets`) · `CartProvider`/`useCart` (arranca vacío; `seedItems`/`clear`).

**lib/** — `utils.ts` (`cn`) · `format.ts` (`formatCLP`, `formatDeliveryDate`, `formatShippingCost`, `discountPercent`, `pluralize`) · `motion.ts` (duraciones/eases/variants de marca) · `anticipation.ts` (`dailyRationGrams`, `estimateRunOut`, `suggestStageTransition`) · `recommend.ts` (motor de recomendación: `recommendFood`, `recommendComplements`, `foodPlan`) · `pet.ts` (completitud del perfil) · `icons.tsx` (`NavIcon` por nombre) · `data/catalog.ts` (marcas, categorías, productos, reseñas, filtros) · `demo-data.ts` (Carlos + Toby + carrito/despacho/nudge demo).

---

## 8. Accesibilidad y motion (resumen)

- **Radix** aporta foco-trap, retorno de foco, `Esc`, navegación por teclado y roles en Dialog/Drawer/Select/Combobox/Tabs/Switch/Checkbox/Radio/Slider/Tooltip/Popover/DropdownMenu.
- **Foco visible** global (anillo Terracota 2px). **Áreas táctiles** ≥44px en controles `md`.
- **No solo color:** estados con ícono + texto. **Contraste AA** (texto sobre Miel = Carbón).
- **Motion:** `MotionConfig reducedMotion="user"` + media query CSS neutralizan animaciones; duraciones/eases desde tokens.

---

## 9. Cómo extender la librería

1. ¿Existe un token para lo que necesitas? Si no, agrégalo en `globals.css` (no inline).
2. ¿Es una primitiva o dominio? `ui/` vs `commerce/`·`pet/`·`layout/`.
3. Tipar props, cubrir estados, a11y (Radix si es interactivo), responsive, motion con tokens.
4. Exportar en el barrel de su carpeta.
5. Agregar una demo en `/dev/components`.
6. Documentar la fila en este archivo.

---

## 10. Mapa con el backlog de UI/UX (`AUDIT_UI_UX.md`)

La Etapa 2 resolvió los **P0 de Fase 3.2** (U001 una acción primaria · U002 reemplazo de "◍" por ↻+label · U020 EmptyState) y la mayoría de los **P1 de componente** (Rating accesible U004, Switch Radix U005, Skeletons U011, Toast U012, foco-trap en overlays U013, validación de inputs U026, RadioGroup sin `<br>` U027, estados error/sin-resultados U021/U022, head/favicon U032…). Los ítems que dependen de **fotografía real (U090)**, de tokens de marca (U003/U014/U015) o de **ensamblar pantallas** (Fase 3.3) quedan para sus etapas. Ver estado por ítem en `AUDIT_UI_UX.md` (tabla Fase 3.2).
