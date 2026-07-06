# DECISIONS — Bitácora de decisiones (append-only)

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Bitácora append-only de toda decisión con su rationale (D1…). Trazabilidad permanente. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo (append-only) |
> | **Last Updated** | 2026-07-06 |
> | **Depends On** | — |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ de *las decisiones y su rationale*. PROJECT_MASTER.md §16 es solo un resumen. |
>
> **Estado de cada decisión (vigencia):** D1 ✅ · D2 ✅ · D3 ✅ *(cerrada por D8)* · D4 ✅ · D5 ✅ · D6 ✅ · D7 ✅ · D8 🔒 · D9 🔒 · D10 🔒 *(vector pendiente)* · D11 🔒 · D12 ✅ *(ejecutada por D13/D15; ya no "activa")* · D13 🔒 · D14 🟢 *(activo, backlog vivo)* · D15 🔒 *(Component Library)* · D16 ✅ *(Activation Flow — ejecutado; revisado y cerrado por D17)* · D17 🔒 *(cierre Fase 3.3: revisión visual aplicada + modelo "e-commerce como piso, perfil destacado")* · D18 🔒 *(política CLP; política de imágenes OPEN)* · D19 🔒 *(Fase 4 adelantada; Polish 3.4 ⏸)* · D20 🔒 *(estructura física: monorepo apps/ + reglas arquitectónicas)*.

> Toda decisión con su rationale. No se borra ni se reescribe; si una decisión cambia, se anexa una nueva entrada que la supersede.

---

### D1 · Modelo de negocio — Tienda completa + suscripción
- **Fecha:** 2026-06-27 · **Fase:** 0.1
- **Decisión:** alimento + accesorios + farmacia, con suscripción/recompra como motor de LTV.
- **Rationale:** compite con los grandes en surtido, pero el diferenciador real es la recurrencia (alimento = consumo predecible = mayor LTV). Se descartó "solo alimento" (mercado chico) y "marketplace multi-tienda" (complejidad excesiva al inicio).

### D2 · Stack técnico — Custom headless Next.js
- **Fecha:** 2026-06-27 · **Fase:** 0.1
- **Decisión:** desarrollo custom headless con Next.js.
- **Rationale:** control total, diseño 100% original, performance de élite. Se descartó Shopify (menos original, fees por venta) y open-source autohospedado puro como única opción.

### D3 · Nombre de trabajo — Manada
- **Fecha:** 2026-06-27 · **Fase:** 0.3 · **Estado:** ✅ cerrado por D8 (nombre definitivo Manada · `tumanada.cl`)
- **Decisión:** usar "Manada" como nombre de trabajo, validado por la estrategia (comunidad/pertenencia, "tu manada").
- **Rationale:** alineado al alma emocional de la marca. Pendiente: confirmar contra alternativas y resolver que `manada.cl` está registrado (ver BRANDING.md).

### D4 · Territorio de marca — Amor como alma sobre moat defendible
- **Fecha:** 2026-06-27 · **Fase:** 0.3
- **Decisión:** liderar con el eje emocional (amor/comunidad) pero sostenido por un moat estructural.
- **Rationale:** el comité (Interbrand/Landor/Pentagram/McKinsey) concluyó que el cariño solo es copiable con presupuesto; necesita una barrera estructural debajo.

### D5 · Concepto rector — C1 "Te conoce como nadie y se anticipa"
- **Fecha:** 2026-06-27 · **Fase:** 0.3
- **Decisión:** concepto rector definitivo = *"Manada te conoce como nadie y se anticipa a lo que tu mascota necesita."*
- **Rationale:** fusiona conocimiento (A), anticipación (C) y amor (B) en una sola idea; el moat (dato propietario por mascota + costo de cambio) se profundiza con el tiempo y no se compra con presupuesto. Supera a C2 (ecosistema) y C3 (red), que son destinos que requieren escala previa.

### D6 · Arquitectura de marca — Conocimiento → Anticipación → Amor
- **Fecha:** 2026-06-27 · **Fase:** 0.3
- **Decisión:** 🧠 Conocimiento = moat; ⚡ Anticipación = producto; 💛 Amor = marca.
- **Rationale:** ordena cómo cada eje se manifiesta. El amor pasa de discurso a prueba.

### D7 · Documentación — Sistema /ai-context
- **Fecha:** 2026-06-27 · **Fase:** meta
- **Decisión:** documentación permanente multi-archivo en `/ai-context` + `CLAUDE.md` como puerta de entrada. Reemplaza el esquema previo de `/docs` (archivado en `history/`).
- **Rationale:** permite retomar el proyecto en cualquier chat nuevo leyendo una sola carpeta; convierte a Claude en colaborador de largo plazo.

### D8 · Nombre definitivo — Manada (dominio oficial `tumanada.cl`)
- **Fecha:** 2026-06-27 · **Fase:** 1 · **Estado:** LOCKED · **Supersede:** confirma y cierra D3.
- **Decisión:** nombre de marca = **Manada**. Dominio oficial = **`tumanada.cl`**. El nombre visible de la marca es siempre "Manada"; la variante es solo la URL.
- **Rationale:** Manada gana en calidez, memorabilidad (5/5) y pertenencia ("tu manada" = comunidad). `manada.cl` está registrado por un tercero, por lo que se resuelve con variante. Entre las libres se elige `tumanada.cl` porque "Tu Manada" refuerza el tuteo posesivo de la voz oficial ("tu regalón", "tu mascota") y el eje personal/anticipatorio del concepto rector (D5). Se descartaron Querencia/Olfato/Instinto (más alineados al concepto pero menos cálidos/masivos) y las variantes somosmanada/holamanada/manadapet (menos personales o menos premium).
- **Pendiente derivado:** verificar marca en INAPI y registrar `tumanada.cl` + handles de redes.

### D9 · Dirección visual — Cálido pero preciso, personal y anticipatorio
- **Fecha:** 2026-06-27 · **Fase:** 1 · **Estado:** LOCKED.
- **Decisión:** la dirección visual debe *probar* el concepto rector (D5): cálido pero preciso, personal (no genérico), anticipatorio, premium-accesible y distintivo frente al rojo genérico de la categoría CL. Cada pilar de marca tiene manifestación visual definida (ver DESIGN_SYSTEM.md §1).
- **Rationale:** verse cálido es copiable; la diferenciación está en que el diseño se sienta atento, personal y un paso adelante, reflejando el moat (dato propietario por mascota). El usuario pidió avanzar con decisiones ejecutivas y no optimizar prematuramente.
- **Derivado:** paleta (Terracota/Pino/Miel) y tipografía (Fraunces + Hanken Grotesk) se mantienen como base de trabajo; confirmación formal en pasos 4 y 5 de Fase 1.

### D10 · Logo — Imagotipo "huella-manada"
- **Fecha:** 2026-06-27 · **Fase:** 1 · **Estado:** LOCKED (concepto; ejecución vector pendiente).
- **Decisión:** imagotipo = logotipo "Manada" (serif cálido base Fraunces) + isotipo "huella-manada": huella cuyos dedos/almohadillas son siluetas agrupadas (doble lectura huella + manada). Spec completa en BRANDING.md §7.
- **Rationale:** une "mascota" + "pertenencia" en un símbolo ownable y escalable a favicon. El riesgo (la huella es común en la categoría) se mitiga con ejecución distintiva: siluetas reconocibles, espacio negativo trabajado, geometría cálida y precisa (refleja Conocimiento + Amor).

### D11 · Sistema visual de marca completo — confirmado
- **Fecha:** 2026-06-27 · **Fase:** 1 · **Estado:** LOCKED.
- **Decisión:** se confirma el Brand & Visual Design System completo (paleta full con escalas y tokens, sistema tipográfico, iconografía, dirección fotográfica, ilustración, composición, grid/espaciado/radios/sombras, motion y microinteracciones, componentes base y ejemplos de UI). Detalle en DESIGN_SYSTEM.md. Se confirma la paleta base (Terracota primario · Pino secundario · Miel acento/anticipación · Arena fondo · Carbón texto) y la tipografía (Fraunces display + Hanken Grotesk UI/datos), ya validadas contra la dirección visual D9.
- **Rationale:** la paleta y tipografía provisionales encajan al 90% con D9 (cálido, premium-accesible, distintivo frente al rojo genérico de la categoría); redefinirlas sería optimización prematura. Se elevan a sistema completo con escalas, tokens y reglas de uso listos para construir el producto. Decisión tomada en modo ejecutivo por mandato del usuario (avanzar con velocidad; tomar la opción claramente superior y documentar rationale).

### D12 · Fase 2 — De prototipo HTML a sistema de componentes Next.js
- **Fecha:** 2026-06-27 · **Fase:** 2 · **Estado:** ✅ EJECUTADA (por D13 fundaciones + D15 component library; el "solo planificar ahora" ya no aplica). **No supersede stack:** confirma `ARCHITECTURE.md §1`.
- **Decisión:** se construye el **prototipo HTML estático** completo (6 páginas: index/plp/pdp/mascota/carrito/checkout en `prototype/`, reutilizando `assets/styles.css`, con chrome extraído a Web Components) **y** se adelanta el sistema de componentes real: **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui re-estilizado**, planificado en el nuevo `FRONTEND_ARCHITECTURE.md` (árbol `src/`, inventario ~50 componentes con contratos de props, puente de tokens, `lib/` + `hooks/`, orden de construcción).
- **Modo elegido (por el usuario):** *solo planificar ahora* — se documenta la arquitectura e inventario para que un chat ejecutor implemente; aún **no** se genera código de la app Next.
- **Rationale:** el usuario pidió trabajar como equipo de ingeniería serio (tokens + componentes reutilizables → páginas) para evitar rehacer al convertir el prototipo en app real. El stack ya estaba decidido (Next.js) en `ARCHITECTURE.md`, así que esto es adelantar el *timing*, no cambiar el rumbo. El prototipo HTML se conserva como **fuente visual de verdad** y referencia de copy (voz de marca).
- **Derivados:** (1) ejecutar scaffold Next en carpeta nueva conservando `/prototype`; (2) portar tokens de `styles.css` a `tailwind.config.ts` + `globals.css`; (3) construir en orden ui → layout → commerce → pages (ver FRONTEND_ARCHITECTURE.md §7).

### D13 · Fase 3 · Etapa 1 — Fundaciones del frontend Next.js (ejecutadas)
- **Fecha:** 2026-06-28 · **Fase:** 3 · **Estado:** LOCKED · **Ejecuta:** D12 (que era "solo plan").
- **Decisión:** se ejecuta la Etapa 1 del frontend (estructura, routing, providers, design tokens, tema y tipografías) en la carpeta **`web/`**, con paridad de tokens al design system (DESIGN_SYSTEM.md). Build, type-check, lint y smoke-test en verde. Pendiente de aprobación del usuario para avanzar a Etapa 2 (componentes).
- **Stack fijado (versiones):** Next.js **16.2.9** (App Router, Turbopack) · React **19.2** · TypeScript **5.9** (estricto) · Tailwind CSS **v4.3** · shadcn/ui (estilo *new-york*, configurado vía `components.json`) · framer-motion **12** · lucide-react. Fuentes self-hosted con `next/font/google` (Fraunces + Hanken Grotesk).
- **Tres ajustes sobre el plan D12 (mejoras, documentadas):**
  1. **Tokens en CSS-first, no `tailwind.config.ts`.** Tailwind v4 define el tema con `@theme` dentro de `globals.css`; no se usa archivo de config JS. *Supersede el derivado (2) de D12.* Los tokens (escalas 50–900 + semánticos + estados + radios/sombras/motion) viven como CSS vars en `:root` y se exponen como utilidades vía `@theme inline`. Se añade un **puente shadcn** (`--primary`, `--background`, `--accent`…) mapeado a la paleta Manada para que los componentes shadcn entren ya re-estilizados.
  2. **Rutas semánticas en español**, no los nombres de archivo del prototipo: `/` (Home), `/categoria/[slug]` (PLP), `/producto/[slug]` (PDP), `/carrito`, `/checkout`, `/cuenta` + `/cuenta/mascotas` (perfil/núcleo). *Rationale:* SEO y URLs de producción; coinciden con la lista de pantallas del brief de Fase 3 (Home, Categoría, Producto, Carrito, Checkout, Mi Cuenta). El prototipo (`plp/pdp/mascota`) sigue siendo la referencia visual.
  3. **Estado global con React Context Providers** (`MotionProvider` → `PetProvider` → `CartProvider`) exponiendo la API planeada `usePet()` / `useCart()`. La persistencia con `localStorage` se difiere a Etapa 2.
- **Extra:** styleguide vivo en `/dev/tokens` (verificación visual de paleta/tipografía/estados/radios/sombras). `prefers-reduced-motion` respetado vía `MotionConfig reducedMotion="user"` + CSS. `/prototype` se conserva intacto como fuente de verdad visual.
- **Rationale:** el stack ya estaba fijado (D2/D12); aquí se ejecuta con las versiones actuales y las convenciones idiomáticas del framework (Tailwind v4 es CSS-first), evitando deuda técnica desde el día 1. Se construye de forma incremental y se espera aprobación entre etapas (mandato del brief de Fase 3).

### D14 · Fase 3 — Auditoría crítica de UI/UX como backlog priorizado (fuente de verdad)
- **Fecha:** 2026-06-28 · **Fase:** 3 · **Estado:** ACTIVO.
- **Decisión:** se audita el prototipo (`/prototype`) con mirada de tres referentes (VP Design Apple · Head of Product Design Stripe · Director de UX Chewy) y se convierte el resultado en un backlog priorizado permanente → **`AUDIT_UI_UX.md`** (108 ítems con ID estable `U001`–`U122`, impacto/esfuerzo/prioridad/estado/archivos afectados). Queda como **fuente de verdad de mejoras de frontend**: cada etapa (3.2 Component Library → 3.3 Product Experience → 3.4 Frontend Polish → Fase futura Backend/CRO) consume y actualiza este archivo antes de cerrarse.
- **Rationale:** el prototipo cumplió como fuente visual de verdad, pero arrastra deuda concreta (emoji como imagen, doble CTA sin jerarquía, fechas incoherentes, ausencia de estados vacío/carga/error, símbolo "◍" ilegible, sobre-uso del nombre de la mascota). Documentar antes de ejecutar evita re-trabajo y da trazabilidad: los componentes de Etapa 2 se construyen ya corrigiendo los ítems P0/P1 de Fase 3.2, no replicando los defectos del HTML.
- **Tres cambios estructurales que condicionan el resto** (marcados como dependencias en el backlog): (1) **fotografía real** (`U090`) bloquea el diseño definitivo de `product-card`/PDP/hero; (2) **jerarquía de acción + modelo de suscripción** (`U001/U002/U040/U045`); (3) **estados vacío/carga/error** (`U020/U021/U022`).
- **Derivados:** (1) la Etapa 2 (componentes) arranca por los **P0/P1 de Fase 3.2** de `AUDIT_UI_UX.md`; (2) el prototipo `/prototype` deja de ser "objetivo a replicar 1:1" y pasa a "referencia de copy/voz + base a mejorar" (matiza el alcance de paridad visual de D13/Etapa 3); (3) los ítems de Fase futura alimentarán Fases 4–7 (Backend/CRO).

### D15 · Fase 3 · Etapa 2 — Component Library construida (ejecutada)
- **Fecha:** 2026-06-28 · **Fase:** 3 · **Estado:** LOCKED (pendiente aprobación del usuario para Etapa 3) · **Ejecuta:** plan de FRONTEND_ARCHITECTURE.md §4 + brief de Etapa 2.
- **Decisión:** se construye la **librería completa de componentes reutilizables** en `web/src/components/{ui,layout,commerce,pet}` (~70 componentes), con `hooks/` y `lib/` de soporte, y un **styleguide navegable** en `/dev/components`. Documentada en el nuevo **`COMPONENT_LIBRARY.md`** (catálogo + cuándo usar cada uno). `tsc` + `eslint` + `next build` (10 rutas) + smoke-test HTTP 200 en verde.
- **Base de accesibilidad — Radix UI** (confirmado con el usuario): las primitivas interactivas (Dialog, Drawer/Sheet, Select, Combobox, Tabs, Switch, Checkbox, RadioGroup, Slider, Tooltip, Popover, DropdownMenu, Separator) usan `@radix-ui/*` por debajo → foco-trap, teclado y ARIA probados. Es lo previsto en `ARCHITECTURE.md §1` ("shadcn/Radix"). Los componentes presentacionales se hacen a mano sobre tokens; **Toast** y el **carrusel** (ProductRail) son propios para no sumar dependencias.
- **Cobertura del brief:** Layout (Container/Section/Stack/Grid/Spacer) · Navegación (Navbar/MegaMenu/SearchBar/Breadcrumb/Footer/MobileNav/BottomNav/Pagination) · Botones (primary/secondary/ghost/link/IconButton/Fab) · Formularios (Input/Textarea/Select/Combobox/Checkbox/Radio/Switch/Slider/QuantitySelector) · Feedback (Toast/Alert/Banner/Tooltip/Dialog/Drawer/Skeleton/Progress/EmptyState/Popover) · Ecommerce (ProductCard/CategoryCard/BrandCard/Price/Rating/ReviewCard/StockBadge/DiscountBadge/ShippingBadge/SubscriptionBadge + Grid/Rail/SubscriptionBox/PersonalizationBanner/FreeShippingBar/FiltersPanel) · Mascotas (PetCard/PetAvatar/PetStatus/FeedingSchedule/RecommendationCard + PetSwitcher/PetProfileHeader/PetEditCard/AnticipationCapsule) · Checkout (CartItem/CartDrawer/OrderSummary/Coupon/ShippingMethod/PaymentMethod/CheckoutStepper).
- **Relación con D14 (AUDIT_UI_UX):** se resolvieron los **3 P0 de Fase 3.2** (U001 una sola acción primaria · U002 reemplazo de "◍" por ↻+label · U020 EmptyState) y la mayoría de los P1 de componente (Rating accesible, Switch Radix, Skeletons, Toast, foco-trap, validación de inputs, estados error/sin-resultados…). Lo pendiente de Fase 3.2 (U003 color suscripción, U009 opsz, U028/U029 contraste) se difiere a **Polish 3.4**; lo de Fase 3.3/3.4 se resuelve al ensamblar pantallas y en el polish (muchos dependen de **fotografía real U090**). Estados por ítem actualizados en `AUDIT_UI_UX.md`.
- **Deps añadidas:** 16 paquetes `@radix-ui/react-*`. Sin cambios de stack (sigue D13).
- **Rationale:** construir tokens → componentes reutilizables → (luego) pantallas, como pidió el usuario, para no rehacer al armar la experiencia. Calidad de producción desde el día 1 (TS estricto, a11y AA, responsive, estados, motion). Se espera aprobación de la librería antes de iniciar las pantallas (Etapa 3), por mandato del brief.

### D16 · Fase 3 · Etapa 3.3B — New User Experience & Activation Flow (+ modelo de sesión)
- **Fecha:** 2026-06-29 · **Fase:** 3 (Etapa 3 · sub-fase 3.3B) · **Estado:** 🟢 **IMPLEMENTACIÓN FINALIZADA (congelada)** — integrada en la **revisión general de la Etapa 3.3**. A partir de aquí, **cualquier cambio entra solo como resultado de la revisión visual final** (no se desarrollan nuevas pantallas/funcionalidades). **NO cierra la Fase 3.3.**
- **Decisión:** se diseña e implementa el **embudo de activación completo** para el visitante anónimo: **Landing → alta de mascota conversacional → recomendación personalizada → registro → primer carrito → checkout → bienvenida**. Para habilitarlo se introduce un **modelo de sesión** (`SessionProvider`/`useSession` + coordinador `useAuthActions`) y los providers de **mascota y carrito arrancan vacíos** (antes sembraban Toby + carrito como estado por defecto).
- **Dos decisiones de producto confirmadas con el usuario:**
  1. **Registro "valor primero":** la cuenta se pide **después** del alta + recomendación (pico de motivación, mínima fricción — patrón Duolingo/Typeform/Amazon), no justo tras la Landing.
  2. **Home según sesión** (resuelve **U041/U058**): `/` anónimo → `LandingView`; `/` autenticado → `DashboardView` (panel personal). `signInDemo()` (botón "Ingresar") entra como Carlos y **siembra Toby + carrito** para revisar intacta la app logueada ya aprobada (Etapas 1–2).
- **Rationale:** la auditoría marcó como **mayor deuda** la ausencia de experiencia para visitantes nuevos ("todo empezaba con un usuario que ya tenía mascota", rompía el embudo de adquisición). Sin backend (coherente con D13): sesión y estado **en memoria**; la auth real y la persistencia entran en Fase 4. "No vender productos: vender la tranquilidad de que nunca le falte comida" guía el copy (BRANDING §4).
- **Derivados:** nuevas rutas `/comenzar`, `/comenzar/recomendacion`, `/crear-cuenta`, `/ingresar`, `/bienvenida` + vistas co-locadas `landing-view`/`dashboard-view`; nuevos componentes `layout/FunnelShell` y `ui/FeatureCard` + variante **`marketing`** en `Header`/`AppShell`; nuevo **`lib/recommend.ts`** (motor de recomendación que reutiliza `lib/anticipation.ts`). El chrome del embudo se **unificó en `FunnelShell`** (se retiró un `FocusShell` duplicado de una iteración previa). Carrito y checkout conectados a la sesión (datos del comprador, navegación a `/bienvenida`). Estados de `AUDIT_UI_UX`: **U041/U058 → Hecho**; U042/U068/U114 → avance parcial. **No cierra la Fase 3.3.**

### D17 · Fase 3 · Cierre de la Etapa 3.3 — Revisión visual aplicada + modelo "e-commerce como piso, perfil como camino destacado"
- **Fecha:** 2026-07-03 · **Fase:** 3 (cierre Etapa 3.3) · **Estado:** LOCKED · **Cierra:** la revisión pendiente de D16; la Etapa 3 (Pantallas) queda completa.
- **Decisión:** se cierra la **Fase 3.3 (Product Experience)** tras la revisión visual manual completa (dos rondas de mejoras aplicadas y verificadas), y se adopta el modelo de producto **"e-commerce como piso, perfil como camino destacado"**:
  1. **Tienda navegable y comprable sin cuenta:** landing-vitrina (riel de productos bajo el hero, CTA secundario "Explorar la tienda", categorías a PLPs reales) y header marketing con buscador + nav + carrito.
  2. **Checkout de invitado punta a punta:** datos propios (nombre + correo validados) + dirección manual; `/bienvenida` confirma el pedido y ofrece crear la cuenta con el email prellenado (registro "valor primero" **post-compra**, el pico de motivación).
  3. **Gate honesto de suscripción:** la compra única jamás se bloquea; si el pedido incluye suscripción, la cuenta se crea al pagar (anunciado en el botón: "Crear cuenta y pagar") porque pausar/cancelar la requiere — intercambio de valor, no peaje.
  4. **Invitaciones contextuales discretas** en PLP ("¿Filtramos por tu mascota?") y PDP ("te decimos su ración y cuánto le dura este saco"): el perfil se ofrece donde su valor es evidente.
- **Mejoras de la revisión (fuera del modelo invitado):** token `--radius-pill` faltante (todos los pills renderizaban cuadrados) · **cursor pointer global** (el preflight de Tailwind v4 dejó los `<button>` sin manito) · reviews como cards con nombre sin partir + review de Felipe con titular · jerarquía de la landing (números de paso 01/02/03, CTA final único con fondo terracota-100, chip de envío en verde, progress con contraste) · input de peso con botones −/+ sin spinners nativos · "Ninguna por ahora" como chip · alturas uniformes de `ProductCard` · espaciado superior del catálogo (PLP/PDP) · "Agregar mascota" cableado a `/comenzar` + lógica multi-mascota (recomendación según sesión; cápsula del perfil condicionada a alimento conocido) · **diálogo real de reagendo** (muestra la fecha programada y ofrece fechas concretas; `onReschedule(date)`) · coherencia del widget del hero con la fuente única de anticipación (U040/U056).
- **Rationale:** la revisión detectó que la experiencia era *"muy app y poco e-commerce"*: toda entrada llevaba al onboarding y un invitado **no podía completar una compra** (el checkout asumía sesión y `/bienvenida` expulsaba al anónimo). Referencia del usuario: laikamascotas.cl. Se adopta el piso e-commerce **sin diluir el moat (D5)**: el perfil sigue siendo el camino destacado (hero, "Comenzar", nudges) y la suscripción exige cuenta de forma legítima. El registro forzado es causa principal de abandono de checkout (~24%, Baymard).
- **Derivados:** `SessionProvider` gana estado `guest` (aditivo; `signUp`/`signOut` lo absorben/limpian). Estados de `AUDIT_UI_UX.md` Fase 3.3 actualizados: **27/33 Hechos**; U066 (redondeo CLP) → Polish 3.4; U070 (cercanía de retiro) → Fase futura; U114 sigue Parcial. **Siguiente: Etapa 4 — Polish (Fase 3.4)**, condicionada por fotografía real (U090). Verificación: `tsc` + `eslint` + `next build` (22 rutas) + smoke HTTP ✅.

### D18 · Fase 3.4 — Arranque del Polish por el track no-fotográfico + política de redondeo CLP
- **Fecha:** 2026-07-05 · **Fase:** 3.4 (Polish, en curso) · **Estado:** LOCKED (política CLP) / OPEN (política de imágenes).
- **Decisión (orden de trabajo):** la Fase 3.4 arranca por el **track no-fotográfico** (aprobado por Carlos). Las imágenes quedan en un track paralelo: Carlos generó **fotos IA con ChatGPT para probar más adelante**; la política definitiva IA vs. fotografía real (U090, que el audit especifica como "real") **queda abierta** — no adoptar IA como definitiva sin decisión explícita, por el riesgo de autenticidad en una marca cuyo pitch es confianza.
- **Decisión (política de redondeo CLP · U066):** todo precio **calculado** (p. ej. suscripción = base − 15%) se redondea **hacia abajo al múltiplo de $10**: $54.990 − 15% = $46.741,5 → **$46.740**. Fuente única: `subscriptionPrice()` / `roundCLP()` en `web/src/lib/format.ts` (reemplaza 5 cálculos duplicados en carrito, checkout, drawer, provider y PDP).
- **Rationale:** (a) redondear hacia abajo garantiza que **nunca se cobra de más** por redondeo — coherente con la voz honesta de la marca; (b) el múltiplo de $10 elimina los "decimales raros" sin inflar artificialmente a terminaciones .990 un precio derivado; (c) centralizar el cálculo evita que carrito y PDP muestren centavos distintos para el mismo producto.
- **Derivados del lote 1 (detalle por ítem en `AUDIT_UI_UX.md`):** Fraunces pasa a variable font con eje óptico (`axes: ["opsz"]`, corte por nivel; U009) · escala tipográfica re-escalonada sin solape (U010, tabla §4.1 de `DESIGN_SYSTEM.md` actualizada) · `neutral-500` #7A7064 → **#6F665A** para AA 4.5:1 sobre blanco/Arena/neutral-100 (U028, §3.2 actualizada) · el **pulso de la cápsula de anticipación se elimina** y la atención pasa al llenado calmado de la barra (`Progress animateIn`; U085/U087, §10 actualizada — urgencia → cuidado) · banda oscura de la landing como pieza editorial inset (U089). Verificación: `tsc` + `eslint` + `next build` (22 rutas) + smoke HTTP 200 ✅.

### D19 · Se adelanta la Fase 4 (Arquitectura técnica); el Polish 3.4 queda en pausa
- **Fecha:** 2026-07-05 · **Fase:** transición 3 → 4 · **Estado:** LOCKED.
- **Decisión:** la **Fase 4 — Arquitectura técnica pasa a ser la fase activa** (aprobado por Carlos). El **Polish 3.4 restante queda ⏸ en pausa** (lote 2 no-fotográfico + track fotográfico) y se retoma cuando existan los assets fotográficos, en paralelo o después de la Fase 4. La Fase 3 **no se cierra** — queda "funcionalmente completa" (etapas 1–3 ✅ + Polish lote 1 ✅ D18).
- **Rationale:** (a) la Fase 4 **no depende en nada** del polish visual — es validación de stack, modelo de datos, API e integraciones CL; (b) lo que queda del Polish está bloqueado igual: el track fotográfico espera assets (U090 sin política decidida; fotos IA de ChatGPT por probar) y U003 espera decisión de marca; (c) varios ítems de percepción premium (reseñas reales U105, prueba social U106, logos de pago U108, ahorro anual U109) **necesitan el backend** para existir — adelantar la Fase 4 desbloquea polish futuro, no lo posterga.
- **Derivados:** `ROADMAP.md` (Fase 3 🟡 con Polish ⏸ / Fase 4 🔄 activa + detalle de orden de trabajo), `TODO.md` (sección Fase 4 activa), `CURRENT_STATE.md` (fase activa 4 + sección "En pausa"), `PROMPTS.md` (**prompt #8** de arranque de Fase 4). La app `web/` queda como frontend de referencia con datos demo; en Fase 4 se decide cómo se conecta (los providers `usePet`/`useCart`/`SessionProvider` fueron diseñados para hidratarse desde backend).

### D20 · Fase 4 — Estructura física del repositorio: monorepo pnpm (`apps/`) + reglas arquitectónicas permanentes
- **Fecha:** 2026-07-06 · **Fase:** 4 · **Estado:** LOCKED · **Aprobada por Carlos** (propuesta de arquitectura con dos modificaciones suyas).
- **Decisión:** el repo evoluciona a **monorepo pnpm workspaces** con frontend y backend como **aplicaciones independientes**:
  1. **`web/` → `apps/web`** (`git mv`, historial preservado; la app queda intacta por dentro; package renombrado `web` → `@manada/web`). Workspace raíz: `pnpm-workspace.yaml` (`apps/*` + `packages/*`) + `package.json` raíz privado (solo orquestación vía `pnpm --filter`) + **lockfile único en raíz** (antes dentro de `web/`; el `pnpm-workspace.yaml` interno —que solo contenía settings— se elimina y sus `ignoredBuiltDependencies` pasan al raíz).
  2. **`apps/backend` queda RESERVADO** (modificación de Carlos: carpeta con `src/`, `docs/` y `README.md`, **sin una línea de código**). El scaffold se genera en **Fase 5**, después de validar el stack (punto 1 de Fase 4). Esto elimina de raíz el riesgo de que el backend nazca dentro del frontend (`web/src/app/api`, `web/server`).
  3. **`packages/shared` NO se crea todavía** (modificación de Carlos): nace **únicamente cuando exista el primer contrato compartido aprobado en `API.md`**. El glob `packages/*` queda declarado en el workspace para ese momento.
  4. **Reglas arquitectónicas permanentes** (nueva sección en `ARCHITECTURE.md §2`, pedida por Carlos): (1) `apps/web` nunca contiene lógica de negocio ni acceso directo a DB; (2) `apps/backend` es la única ubicación válida del backend; (3) toda comunicación entre apps es vía la API documentada en `API.md`; (4) todo contrato nuevo se define primero en `API.md` antes de implementarse; (5) no se crean nuevas apps/paquetes sin aprobación explícita.
- **Rationale:** (a) un equipo de una persona no amortiza polyrepo (dos clones/PRs/configs) y fragmentaría `ai-context/`, el activo operativo del proyecto; (b) la estructura plana sin workspace pierde el lugar único futuro para los contratos tipados del moat (Perfil de Mascota/anticipación); (c) `apps/*` deja espacio natural al worker de recordatorios (Fase 7) y a un admin sin reestructurar — siempre con aprobación previa (regla 5); (d) es **agnóstica al resultado de la validación de stack**: Medusa, Vendure o custom viven igual en `apps/backend`; (e) Vercel y Railway/Fly despliegan desde subdirectorio de monorepo de forma nativa (no había proyecto Vercel enlazado, así que no hubo migración). **Sin Turborepo** por ahora: con dos apps, pnpm workspaces basta; se puede añadir después sin tocar la estructura.
- **Verificación (frontend idéntico tras el movimiento):** `pnpm install` limpio con el lockfile reutilizado · `tsc --noEmit` ✅ · `eslint` ✅ · `next build` **22 rutas** (las mismas) ✅ · smoke HTTP 200 en `/`, `/carrito`, `/checkout`, `/comenzar`, `/dev/components`, PDP y PLP dinámicas ✅.
- **Derivados:** `ARCHITECTURE.md` gana §1 (estructura física) y §2 (reglas permanentes); docs vivos actualizados de `web/` → `apps/web/` (`CLAUDE.md`, `CURRENT_STATE.md`, `PROJECT_MASTER.md`, `ROADMAP.md`, `TODO.md`, `PROMPTS.md`, `README.md` de ai-context, `COMPONENT_LIBRARY.md`, `DESIGN_SYSTEM.md`, `FRONTEND_ARCHITECTURE.md`, `AUDIT_UI_UX.md`); las entradas históricas fechadas (DECISIONS, bitácoras, `history/`, `PROJECT_HEALTH_REPORT.md`) **no se reescriben** — sus rutas `web/…` son correctas para su época. El README de `apps/backend` documenta la reserva y las reglas.
