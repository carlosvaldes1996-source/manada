# AUDIT_UI_UX.md — Auditoría de diseño convertida en backlog priorizado

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Backlog priorizado de mejoras de UI/UX (108 ítems `U001`–`U122`) consumido por cada etapa de Fase 3. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo — se actualiza por ítem en cada etapa. |
> | **Last Updated** | 2026-07-03 |
> | **Depends On** | DESIGN_SYSTEM.md, COMPONENT_LIBRARY.md, FRONTEND_ARCHITECTURE.md, `/prototype` |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ de *mejoras/deuda de frontend*. |

> **Fuente de verdad de mejoras de UI/UX para el frontend de Manada.**
> Generado a partir de la auditoría crítica del prototipo (`/prototype`) realizada con la mirada de tres referentes: VP of Design (Apple), Head of Product Design (Stripe), Director de UX (Chewy).
>
> **Regla de uso:** ninguna etapa de frontend (3.2 → 3.4) se cierra sin revisar este archivo. Cada ítem se actualiza con su `estado` a medida que se ejecuta. No se elimina nada: lo resuelto se marca **Hecho** y se conserva el rationale.

---

## Cómo leer este backlog

**Clasificación por fase**
- **Fase 3.2 — Component Library:** se resuelve en el sistema de diseño / componentes reutilizables (`apps/web/src/components/**`, tokens). Arreglar aquí propaga a todas las páginas.
- **Fase 3.3 — Product Experience:** decisiones de flujo, IA, jerarquía de página y conversión que se materializan al ensamblar pantallas.
- **Fase 3.4 — Frontend Polish:** dirección de arte aplicada, microinteracciones, movimiento, refinamiento premium y copy.
- **Fase futura (Backend / CRO):** requiere datos reales, integraciones, contenido (fotografía, reseñas), o experimentación A/B. No bloquea el frontend, pero se documenta para no perderlo.

**Métricas**
- **Impacto (1–5):** 5 = mueve conversión/confianza/percepción de marca de forma decisiva; 1 = cosmético marginal.
- **Esfuerzo (1–5):** 5 = trabajo grande/dependencias externas; 1 = cambio puntual.
- **Prioridad:** derivada de impacto vs. esfuerzo (estilo ICE, prioriza impacto alto con esfuerzo bajo).
  - **P0 — Crítico:** corrección de algo roto o que daña la promesa de marca. Hacer ya.
  - **P1 — Alto:** alto impacto, esfuerzo razonable. Primer lote de cada fase.
  - **P2 — Medio:** valioso, no urgente.
  - **P3 — Bajo:** marginal o alto esfuerzo / bajo retorno.
- **Estado:** `Pendiente` · `En progreso` · `Hecho`.

**Resumen de carga**

| Fase | Ítems | P0 | P1 | P2 | P3 |
|---|---|---|---|---|---|
| 3.2 Component Library | 32 | 3 | 14 | 12 | 3 |
| 3.3 Product Experience | 33 | 4 | 15 | 11 | 3 |
| 3.4 Frontend Polish | 24 | 0 | 7 | 13 | 4 |
| Fase futura (Backend/CRO) | 19 | 1 | 9 | 8 | 1 |
| **Total** | **108** | **8** | **45** | **44** | **11** |

**Los 3 cambios estructurales que condicionan todo** (ver detalle en sus ítems):
1. **Fotografía real** (U090) — sin esto, ~70% de la deuda de "premium/confianza/emoción" es irresoluble. Bloquea el diseño definitivo de `product-card`, PDP y hero.
2. **Jerarquía de acción + modelo de suscripción** (U001, U002, U003, U040) — barato, sube conversión y claridad de inmediato.
3. **Estados vacío/carga/error** (U020, U021, U022) — un e-commerce sin ellos es una demo, no un producto premium.

---

## Fase 3.2 — Component Library

> Se arregla una vez en el componente/token y se propaga. Máximo apalancamiento.

| ID | Descripción | Imp | Esf | Prioridad | Estado | Archivos afectados |
|---|---|---|---|---|---|---|
| U001 | **Una sola acción primaria por tarjeta de producto.** Hoy "Agregar" (terracota) y "◍" (miel) pesan casi igual. Definir primario sólido + secundario outline/ghost. | 5 | 2 | **P0** | **Hecho (E2)** | `commerce/product-card.tsx`, `ui/button.tsx` |
| U002 | **Reemplazar el símbolo "◍"** por afordancia legible (ícono de ciclo ↻ + label "Suscribir"). Nadie decodifica "◍". | 4 | 1 | **P0** | **Hecho (E2)** | `ui/icon-button.tsx`, `lib/icons.tsx`, `commerce/subscription-box.tsx`, `commerce/badges.tsx` |
| U020 | **Componente de estado vacío** (carrito, sin mascota, sin resultados de filtro). Hoy no existe. | 5 | 3 | **P0** | **Hecho (E2)** | `ui/empty-state.tsx`, `commerce/cart-drawer.tsx`, `commerce/product-grid.tsx` |
| U003 | **Repensar el color de "suscripción" (miel).** Se lee como advertencia y el texto oscuro sobre miel parece deshabilitado pese a ser acción clave de negocio. | 4 | 2 | **P1** | Pendiente · *token de marca (D11): se mantuvo Miel+Carbón por a11y; revisar en Polish (3.4)* | `globals.css` (tokens), `ui/button.tsx`, `commerce/subscription-box.tsx`, `commerce/badges.tsx` |
| U004 | **Componente Rating accesible y fraccionable.** Hoy ★★★★★ es texto fijo: 4.8 se ve igual que 5.0 y es invisible para lectores de pantalla. | 3 | 2 | **P1** | **Hecho (E2)** | `ui/rating.tsx` |
| U005 | **Switch accesible de verdad.** El toggle `role="switch"` en `<div>` no garantiza teclado (Space/Enter) ni `aria-checked` dinámico. | 4 | 2 | **P1** | **Hecho (E2)** · Radix Switch | `ui/switch.tsx`, `commerce/subscription-box.tsx` |
| U006 | **Unificar los 4 "chips informativos"** (`.ship`, `.reco`, `.badge--info`, `.perso-banner`) en un componente con variantes de tono. | 3 | 2 | **P1** | **Parcial (E2)** · Badge(variants)+Banner+HonestShippingBlock | `ui/badge.tsx`, `ui/banner.tsx`, `commerce/honest-shipping-block.tsx`, `commerce/personalization-banner.tsx` |
| U007 | **Quitar el chip azul de envío repetido** en cada tarjeta. Choca con la paleta cálida y genera ceguera de banner. Convertir a texto con ícono. | 4 | 1 | **P1** | **Hecho (E2)** · texto+ícono, opcional por prop | `commerce/product-card.tsx`, `globals.css` |
| U008 | **Tokenizar tipografía de precio.** Hoy los tamaños van inline (`28px/18px/13px`) → inconsistencia entre PDP/carrito/checkout. | 3 | 2 | **P1** | **Hecho (E2)** · `<Price size>` | `ui/price.tsx`, `globals.css` |
| U009 | **Aplicar `font-variation-settings` (opsz) a Fraunces.** Se carga el eje óptico y nunca se usa: titulares sin el refinamiento por el que se paga. | 3 | 2 | **P1** | **Hecho (3.4·lote 1)** · Fraunces como variable font con `axes: ["opsz"]`; corte por nivel: display 144/120 · h1 72 · h2 48 · h3 32 · pet-name 18 | `globals.css`, `layout.tsx` |
| U010 | **Resolver el solape de escala tipográfica** `h1` (28–40) vs `display-l` (33–48): producen tamaños ambiguos según viewport. | 3 | 2 | **P1** | **Hecho (3.4·lote 1)** · rangos sin solape a todo viewport: h1 28–36 < display-l 36–48 < display-xl 44–60 | `globals.css`, `ui/section-heading.tsx` |
| U011 | **Skeletons de carga** para grid de productos, PDP y carrito. Hoy todo aparece de golpe. | 4 | 3 | **P1** | **Hecho (E2)** | `ui/skeleton.tsx`, `commerce/product-grid.tsx`, `commerce/product-card.tsx` |
| U012 | **Toast/confirmación contextual de "agregado al carrito"** (no solo cambiar el label del botón); incluir manejo de error. | 4 | 3 | **P1** | **Hecho (E2)** · `useToast` con variante error | `ui/toast.tsx`, `commerce/product-card.tsx`, `providers/cart-provider.tsx` |
| U013 | **Focus-trap, retorno de foco y `Esc`** en drawer y sheet (overlays). Microinteracción incompleta en accesibilidad. | 4 | 3 | **P1** | **Hecho (E2)** · Radix Dialog/Drawer | `ui/drawer.tsx`, `ui/dialog.tsx`, `commerce/cart-drawer.tsx`, `commerce/filters-panel.tsx` |
| U014 | **Sombras cálidas en tokens.** Todas son grises frías (`rgba(42,39,34)`) sobre paleta cálida; restan profundidad de marca. | 2 | 1 | **P2** | Pendiente · Polish (3.4) | `globals.css` |
| U015 | **Definir jerarquía de uso de las 3 familias** (terracota / miel / pino): cuándo cada una. Hoy compiten sin regla → identidad difusa. | 4 | 2 | **P1** | **Parcial (E2)** · aplicado en componentes (Terracota=acción, Miel=anticipación, Pino=confianza); falta doc explícita | `DESIGN_SYSTEM.md`, `globals.css` |
| U016 | **Profundidad premium en tarjetas.** Dependen de borde + `shadow-sm`; se ven planas. Revisar elevación/estados. | 3 | 2 | **P2** | **Parcial (E2)** · hover sombra md + translate; revisar en Polish | `ui/card.tsx`, `commerce/product-card.tsx` |
| U017 | **Regla semántica de radios** (`md/lg/xl`): hoy se mezclan sin lógica jerárquica. | 2 | 2 | **P2** | **Parcial (E2)** · radios consistentes por tipo de componente | `DESIGN_SYSTEM.md`, `globals.css` |
| U018 | **Sistema de espaciado / línea base** consistente; hoy `mt-8/12/16/24` ad hoc. | 3 | 3 | **P2** | **Parcial (E2)** · Stack/Grid/Section con escala de gap | `globals.css`, `ui/stack.tsx`, `ui/spacer.tsx` |
| U019 | **Erradicar `style="..."` inline** migrándolos a clases/props del sistema. Decenas dispersos erosionan el design system. | 3 | 3 | **P2** | **Parcial (E2)** · componentes sin inline salvo % de progreso (valor dinámico legítimo) | todos los componentes `commerce/**`, `pet/**` |
| U021 | **Componente de estado de error** (pago fallido, sin stock, fallo de red). | 4 | 3 | **P1** | **Hecho (E2)** · Alert(error) + EmptyState | `ui/alert.tsx`, `ui/empty-state.tsx` |
| U022 | **Estado "sin resultados" en filtros/búsqueda** con sugerencia de relajar filtros. | 3 | 2 | **P2** | **Hecho (E2)** · `ProductGrid` empty | `commerce/product-grid.tsx`, `commerce/filters-panel.tsx`, `ui/empty-state.tsx` |
| U023 | **Reducir tipos de etiqueta que compiten** en tarjeta (`subscribe`/`urgency`/`info`/`reco`/`ship`): definir máximo 1–2 visibles y reglas de prioridad. | 3 | 2 | **P2** | **Hecho (E2)** · card muestra máx. subscribe+discount | `commerce/badges.tsx`, `commerce/product-card.tsx` |
| U024 | **Léxico único de CTAs.** Conviven "Agregar/Ver/◍/Suscribir/Adelantar/Reagendar". Definir 3–4 verbos y reusarlos. | 3 | 1 | **P1** | **Parcial (E2)** · verbos consistentes (Agregar/Suscribir/Reagendar/Ver); falta glosario en config | `ui/button.tsx`, `config/site.ts` |
| U025 | **Estado `:active`/press táctil** equivalente al hover-translateY de tarjetas (no existe feedback en móvil). | 2 | 1 | **P2** | **Hecho (E2)** · `active:scale` en botones | `commerce/product-card.tsx`, `ui/card.tsx` |
| U026 | **Validación accesible en inputs** (`aria-invalid`, mensajes, estados error/success). | 3 | 2 | **P2** | **Hecho (E2)** · Field/Input con aria-invalid + error | `ui/field.tsx`, `ui/input.tsx` |
| U027 | **Estructura del grupo de radios de envío sin depender de `<br>`** (frágil semánticamente). | 2 | 1 | **P2** | **Hecho (E2)** · RadioGroup (Radix) | `ui/radio.tsx`, `commerce/shipping-method.tsx` |
| U028 | **Contraste AA en texto chico** (`text-muted` #7A7064 / notas 12–13px) sobre blanco/`neutral-50`. Verificar y ajustar. | 3 | 1 | **P1** | **Hecho (3.4·lote 1)** · `neutral-500` #7A7064→#6F665A: AA sobre blanco 5.6:1, Arena 5.2:1 y `neutral-100` 4.7:1 (antes fallaba sobre neutral-100 con 4.06:1) | `globals.css` |
| U029 | **Verificar contraste del botón miel en hover** (`miel-600` + texto `neutral-800`). | 2 | 1 | **P2** | **Hecho (3.4·lote 1, verificado sin cambios)** · miel-600+Carbón 4.9:1 ✓ AA · miel-500+Carbón 6.8:1 ✓ | `globals.css`, `ui/button.tsx` |
| U030 | **Intención (delay) en hover del mega-menú** para evitar parpadeo al cruzar el cursor. | 2 | 2 | **P3** | Pendiente | `layout/mega-menu.tsx` |
| U031 | **Set de íconos de marca** (reemplazo sistemático de emoji-iconos en accesos rápidos/categorías) con peso/estilo uniforme. | 3 | 3 | **P2** | **Parcial (E2)** · lucide unificado (1.75px) vía `NavIcon`; emoji solo como placeholder de categoría | `lib/icons.tsx`, `commerce/category-card.tsx` |
| U032 | **Centralizar `<head>`/favicon** (hoy duplicado literal en 6 archivos del proto). En Next.js vive en `layout.tsx`/metadata. | 1 | 1 | **P3** | **Hecho (E2)** · metadata en `layout.tsx` | `layout.tsx`, `app/favicon.ico` |
| U033 | **Orden de tabulación del header** verificado en móvil (donde el search desaparece): logo → pet-switch → cuenta → carrito. | 2 | 1 | **P3** | **Parcial (E2)** · orden DOM correcto; verificar con lector en Etapa 3 | `layout/header.tsx` |

---

## Fase 3.3 — Product Experience

> Flujo, arquitectura de información, jerarquía de página y conversión al ensamblar pantallas.

| ID | Descripción | Imp | Esf | Prioridad | Estado | Archivos afectados |
|---|---|---|---|---|---|---|
| U040 | **Coherencia de fechas de anticipación.** Home: "se acaba el 2 jul / ~5 días". PDP/checkout: "llega mañana 28 jun / hoy 27 jun". Sistema: hoy 28 jun. Para una marca cuyo core es anticipar, una fecha mal calculada destruye la promesa. | 5 | 2 | **P0** | **Hecho (E3)** · fuente única `TOBY_ANTICIPATION` (peso+etapa+saco+días) alimenta Home, cápsula, perfil y landing | `lib/anticipation.ts`, `lib/demo-data.ts`, `pet/anticipation-capsule.tsx`, `commerce/honest-shipping-block.tsx` |
| U041 | **Resolver la doble identidad de la home** (dashboard logueado + hero de visitante en la misma página). Decidir estado y CTA único. | 5 | 3 | **P0** | **Hecho (3.3B)** · `/` decide `LandingView` (anónimo) vs `DashboardView` (sesión) | `app/page.tsx`, `landing-view.tsx`, `dashboard-view.tsx`, `providers/session-provider.tsx` |
| U042 | **Free-shipping bar con progreso real.** Hoy arranca en "$0 restante" (ya gratis) y desperdicia la única palanca de AOV. | 4 | 2 | **P0** | **Hecho (E3)** · la barra usa el subtotal real del carrito (`paySubtotal` vs umbral) | `commerce/free-shipping-bar.tsx`, `app/(tienda)/carrito/page.tsx` |
| U043 | **PLP no debe ocultar catálogo por defecto.** El filtro "Para Toby" activo de entrada puede esconder lo que el usuario busca. Mostrar todo + sugerir personalización. | 4 | 2 | **P0** | **Hecho (E3)** · catálogo completo por defecto; personalización opt-in (Switch), nunca oculta | `app/(tienda)/categoria/[slug]/page.tsx`, `commerce/filters-panel.tsx`, `commerce/personalization-banner.tsx` |
| U044 | **Subir specs de valor en PDP** (ración 145 g/día, duración ~100 días, $/kg) a un módulo destacado arriba, no enterrados en tab "Descripción". | 4 | 2 | **P1** | **Hecho (E3)** · módulo de specs (ración/día, duración, $/kg) arriba en la PDP | `app/(tienda)/producto/[slug]/page.tsx`, `pet/feeding-schedule.tsx` |
| U045 | **Jerarquizar PDP hacia la suscripción** (modelo recurrente = margen). Hoy "Agregar" y "◍ Suscribir" pesan igual. | 5 | 2 | **P1** | **Hecho (E3)** · SubscriptionBox precede al CTA; el botón refleja estado y precio | `app/(tienda)/producto/[slug]/page.tsx`, `commerce/subscription-box.tsx` |
| U046 | **Reaseguro "pausa/cancela cuando quieras" junto al toggle en PDP** (primer punto de decisión), no solo en checkout. | 4 | 1 | **P1** | **Hecho (E3)** · "pausa o cancela cuando quieras" visible bajo el toggle (PDP y recomendación) | `commerce/subscription-box.tsx` |
| U047 | **Reformular los "4 pasos" del checkout de una pantalla.** La numeración promete secuencia inexistente y sugiere "falta mucho". | 4 | 2 | **P1** | **Hecho (E3)** · una pantalla sin numeración; bloques con encabezados claros | `commerce/checkout-stepper.tsx`, `app/checkout/page.tsx` |
| U048 | **Aclarar alcance del toggle de suscripción en checkout** (¿todo el pedido? ¿solo el alimento?) para evitar miedo a recurrencia no deseada → abandono. | 4 | 2 | **P1** | **Hecho (E3)** · "Solo esta línea se repite" + nota de compra única | `app/checkout/page.tsx`, `commerce/subscription-box.tsx` |
| U049 | **Hacer visible la creación del "perfil de recompra"** (hoy en nota chica al final del checkout). Decisión importante mal señalizada. | 3 | 1 | **P1** | **Hecho (E3)** · Switch visible "Guardar el perfil de recompra" | `app/checkout/page.tsx`, `commerce/order-summary.tsx` |
| U050 | **Celebrar visualmente el ahorro por suscripción** ("−$8.249") en carrito/checkout; hoy tiene el mismo peso que el resto. | 4 | 2 | **P1** | **Hecho (E3)** · ahorro en verde con línea propia en OrderSummary | `commerce/order-summary.tsx` |
| U051 | **Distinguir línea suscripción vs. compra única** en el carrito más allá de un badge chico (agrupar "se repite" / "una vez"). | 3 | 2 | **P1** | **Hecho (E3)** · grupos "Se repite automáticamente" vs "Compra única" | `commerce/cart-item.tsx`, `app/(tienda)/carrito/page.tsx` |
| U052 | **Reducir densidad del cross-sell** (home + PDP + carrito a la vez). Definir reglas de cuándo aparece para no saturar. | 4 | 2 | **P1** | **Hecho (E3)** · un único riel por pantalla, relevante a la especie | `commerce/product-rail.tsx`, `app/page.tsx`, `app/(tienda)/producto/[slug]/page.tsx`, `app/(tienda)/carrito/page.tsx` |
| U053 | **Reducir la densidad del nombre "Toby".** ~5 veces solo en la home: cruza de cálido a uncanny. Alternar con "tu perro"/"él". | 4 | 2 | **P1** | **Hecho (E3)** · alternancia nombre ↔ "tu perro/tu compañero" en Home | `lib/demo-data.ts`, `app/page.tsx`, copy global |
| U054 | **Barra de completitud del perfil accionable:** listar los 2 campos que faltan para 100%, no solo el porcentaje. | 3 | 2 | **P1** | **Hecho (E3)** · panel "Te falta poco" lista los campos faltantes con CTA | `pet/pet-profile-header.tsx`, `pet/pet-edit-card.tsx`, `app/(tienda)/cuenta/mascotas` |
| U055 | **Cuadrar conteo y contenido en PLP** ("24 productos" con 8 cargados; "mejores para Toby" sin explicar criterio). | 3 | 2 | **P1** | **Hecho (E3)** · conteo real tras filtrar + facetas con conteos reales | `app/(tienda)/categoria/[slug]/page.tsx`, `commerce/product-grid.tsx` |
| U056 | **Hacer coincidir barra y número** de la cápsula ("≈18% restante" vs. barra casi vacía). | 3 | 1 | **P1** | **Hecho (E3)** · barra y número salen de la misma fuente única (ver U040) | `pet/anticipation-capsule.tsx`, `ui/progress.tsx` |
| U057 | **Renombrar "Mi recompra"** (jerga) y unificar con "Mascotas"/"Mis mascotas" (hoy 3 nombres para zonas que se confunden). | 3 | 1 | **P1** | **Hecho (E3)** · nomenclatura unificada ("Mascotas"/"Mis mascotas"; sin "Mi recompra") | `config/nav.ts`, `layout/navbar.tsx`, `layout/bottom-nav.tsx`, `layout/footer.tsx` |
| U058 | **Separar landing de marca de la "app" logueada** para no mezclar modelos mentales. | 4 | 3 | **P1** | **Hecho (3.3B)** · landing en chrome `marketing`; embudo en `FunnelShell`; app logueada intacta | `app/page.tsx`, `landing-view.tsx`, `layout/funnel-shell.tsx`, `layout/header.tsx` |
| U059 | **Quitar "Buscar" como ítem del bottom-nav** (redundante con el search del header) y dar al search móvil un acceso visible. | 3 | 2 | **P2** | **Hecho (E3)** · bottom-nav de 5 destinos sin "Buscar" | `layout/bottom-nav.tsx`, `layout/header.tsx`, `ui/search-bar.tsx` |
| U060 | **Search disponible en móvil** (<768px hoy desaparece por completo sin alternativa inmediata). | 3 | 2 | **P2** | **Hecho (E3)** · search siempre visible <md en el header (incl. chrome marketing) | `layout/header.tsx`, `ui/search-bar.tsx` |
| U061 | **Nivelar la IA del nav:** mezcla categorías (Alimento/Accesorios/Farmacia) con destinos personales (Mi recompra) en el mismo nivel. | 3 | 3 | **P2** | **Hecho (E3)** · MAIN_NAV solo catálogo; lo personal vive en Mi cuenta | `config/nav.ts`, `layout/navbar.tsx`, `layout/mega-menu.tsx` |
| U062 | **Coherencia breadcrumb ↔ nav:** breadcrumb usa "Perro" como nivel 1 pero el nav no tiene eje Perro/Gato. | 2 | 2 | **P2** | **Hecho (E3)** · breadcrumb Inicio › Comprar › categoría, coherente con el nav | `ui/breadcrumb.tsx`, `config/nav.ts` |
| U063 | **Separar filtro personal de filtros de catálogo** (el chip "Para Toby ✕" se mezcla con filtros normales y confunde qué se filtra). | 3 | 2 | **P2** | **Hecho (E3)** · realce personal (banner/switch) separado de los filtros de catálogo | `commerce/filters-panel.tsx`, `commerce/personalization-banner.tsx` |
| U064 | **Explicar el orden "Recomendado para Toby"** (criterio caja negra) con tooltip/nota. | 2 | 1 | **P2** | **Hecho (E3)** · popover "¿Por qué este orden?" explica el criterio | `commerce/product-grid.tsx`, `ui/tooltip.tsx` |
| U065 | **Arreglar enlaces placeholder del perfil** ("Mi suscripción" enlaza a sí misma; varios `#`). | 3 | 2 | **P2** | **Hecho (E3)** · secciones futuras marcadas "Pronto", sin enlaces rotos | `app/(tienda)/cuenta/**`, `config/nav.ts` |
| U066 | **Redondeo de precios de suscripción** ($46.741 con decimales raros genera fricción en CLP). Definir política de redondeo. | 3 | 1 | **P2** | **Hecho (3.4·lote 1)** · política: **hacia abajo al múltiplo de $10** ($46.741,5 → $46.740, nunca se cobra de más). `subscriptionPrice()`/`roundCLP()` en `lib/format.ts` como fuente única (reemplaza 5 cálculos duplicados en carrito/checkout/PDP) | `lib/format.ts`, `hooks/use-subscription.ts`, `providers/cart-provider.tsx` |
| U067 | **Decidir descubrimiento en PLP:** "Cargar más" vs. scroll infinito vs. paginación con conteo claro. | 3 | 2 | **P2** | **Hecho (E3)** · paginación con conteo claro | `ui/pagination.tsx`, `commerce/product-grid.tsx` |
| U068 | **Saludo de home condicionado al estado real** ("Toby está listo para su semana" asume suscripción activa que un usuario nuevo no tiene). | 3 | 2 | **P2** | **Hecho (3.3B)** · `DashboardView` adapta saludo/cápsula a `hasAnticipation` (mascota recién creada no muestra días de Toby) | `dashboard-view.tsx` |
| U069 | **Aislar la cápsula de anticipación** (el momento más valioso compite con accesos rápidos pegados debajo). Darle aire/jerarquía. | 3 | 2 | **P2** | **Hecho (E3)** · cápsula en sección propia con aire, clímax del panel | `app/page.tsx`, `pet/anticipation-capsule.tsx` |
| U070 | **Lógica de cercanía en métodos de despacho** ("Retiro en Providencia" aparece con perfil en Ñuñoa). | 2 | 2 | **P3** | Pendiente · Fase futura: requiere datos reales de tiendas/stock por comuna | `commerce/shipping-method.tsx`, `app/checkout/page.tsx` |
| U071 | **Selector de direcciones guardadas** en checkout (hoy inputs sueltos sin gestión). | 3 | 3 | **P2** | **Hecho (E3)** · direcciones guardadas con sesión; inputs directos para el invitado | `app/checkout/page.tsx`, `ui/field.tsx` |
| U072 | **Eliminar redundancia "¿Ya desparasitaste a Toby?"** repetida en home, PDP y perfil. | 2 | 1 | **P3** | **Hecho (E3)** · recordatorio de salud SOLO en Home | `pet/recommendation-card.tsx`, `app/page.tsx`, `app/(tienda)/producto/[slug]/page.tsx` |

---

## Fase 3.4 — Frontend Polish

> Dirección de arte aplicada, microinteracciones, movimiento, refinamiento premium y copy.

| ID | Descripción | Imp | Esf | Prioridad | Estado | Archivos afectados |
|---|---|---|---|---|---|---|
| U080 | **Integrar el sistema de imágenes en `product-card`** (relación de aspecto por categoría — sacos verticales, no 1:1 forzado; sombra de contacto; padding del packshot). Depende de U090. | 5 | 3 | **P1** | Pendiente | `commerce/product-card.tsx`, `ui/card.tsx` |
| U081 | **Galería de PDP real** (zoom, múltiples ángulos, foto del formato, tabla nutricional como imagen). Depende de U090. | 4 | 3 | **P1** | Pendiente | `app/(tienda)/producto/[slug]/page.tsx` |
| U082 | **Diferenciar thumbnails como vistas del mismo producto** (hoy 4 emoji distintos parecen 4 productos). | 3 | 2 | **P1** | Pendiente | `app/(tienda)/producto/[slug]/page.tsx` |
| U083 | **Avatar de mascota con foto real** del perro del usuario (alto valor emocional) + fallback. | 4 | 2 | **P1** | Pendiente | `pet/pet-avatar.tsx`, `ui/avatar.tsx` |
| U084 | **Hero de visitante con dirección de arte real** (perro real, no gradiente con emoji). Depende de U090. | 4 | 3 | **P1** | Pendiente | `app/page.tsx`, `commerce/brand-card.tsx` |
| U085 | **Animación de la barra de progreso de comida** (llenado) para reforzar la "anticipación". | 3 | 2 | **P2** | **Hecho (3.4·lote 1)** · prop `animateIn` de `Progress` (llenado 0→valor, 900ms ease-out, keyframe `progress-fill`); activa en la cápsula y el hero-card de la landing; reduce-motion la neutraliza | `pet/anticipation-capsule.tsx`, `ui/progress.tsx`, `globals.css` |
| U086 | **Animación "vuelo al carrito"** al agregar (refuerza feedback). | 3 | 3 | **P2** | Pendiente | `commerce/product-card.tsx`, `providers/cart-provider.tsx`, `lib/motion.ts` |
| U087 | **Reconsiderar el `pulse` de la cápsula:** anima una alerta de comida que se acaba → puede generar ansiedad en vez de cuidado tranquilo. | 3 | 1 | **P1** | **Hecho (3.4·lote 1)** · pulso eliminado (keyframe `pulse-soft` retirado); la atención la gana el llenado calmado de la barra (U085) — cuidado, no urgencia | `pet/anticipation-capsule.tsx`, `globals.css` |
| U088 | **Afordancia visual de botón** en "¿Por qué te lo decimos?" (transparencia bien pensada, mal señalizada). | 2 | 1 | **P2** | **Hecho (3.4·lote 1)** · trigger como pill con borde terracota + fondo surface (botón real, no texto suelto) | `pet/anticipation-capsule.tsx` |
| U089 | **Transiciones de ritmo entre secciones** (el bloque pino oscuro aparece de golpe entre secciones claras). | 2 | 2 | **P2** | **Hecho (3.4·lote 1)** · la banda oscura de la landing es ahora pieza editorial inset (`radius-xl` + márgenes laterales), no corte full-bleed abrupto | `app/landing-view.tsx` |
| U091 | **Tratamiento de imagen consistente** (fondo, aspecto, sombra de contacto, padding) como sistema, no caso a caso. Depende de U090. | 4 | 3 | **P1** | Pendiente | `DESIGN_SYSTEM.md`, `ui/card.tsx`, `commerce/product-card.tsx` |
| U092 | **Imágenes de mini-línea (carrito/checkout) decentes** (hoy emoji 30px hace ver de juguete ítems de $55.000). Depende de U090. | 3 | 2 | **P2** | Pendiente | `commerce/cart-item.tsx`, `commerce/order-summary.tsx` |
| U093 | **Reducir dependencia de emoji como vehículo emocional** (🐾💛🐶) sustituyéndolo por imagen + tipografía. | 3 | 3 | **P2** | Pendiente | global, `lib/icons.tsx` |
| U094 | **Momento de deleite real** (p. ej. experiencia activa de cumpleaños del perro, hoy solo campo vacío). | 3 | 3 | **P2** | Pendiente | `pet/pet-edit-card.tsx`, `app/(tienda)/cuenta/mascotas` |
| U095 | **Variación de registro de tono** para momentos serios (farmacia/salud) vs. cálido-cercano general. | 2 | 2 | **P2** | Pendiente | copy global, `pet/recommendation-card.tsx` |
| U096 | **Destacar specs de confianza como módulo** ($3.666/kg, ~100 días) en vez de nota chica. | 3 | 2 | **P2** | Pendiente | `app/(tienda)/producto/[slug]/page.tsx`, `pet/feeding-schedule.tsx` |
| U097 | **Realzar "devolución sin costo si no le gusta a Toby"** (gran promesa enterrada en `note` de 12px). | 3 | 1 | **P1** | Pendiente | `app/(tienda)/producto/[slug]/page.tsx`, `ui/banner.tsx` |
| U098 | **Color de acento reservado al "momento mágico"** (anticipación) distinto del miel genérico del resto. | 3 | 2 | **P2** | Pendiente | `globals.css`, `pet/anticipation-capsule.tsx` |
| U099 | **Texturas / detalle editorial cálido** que justifique el posicionamiento premium (hoy "limpio" pero anónimo). | 3 | 3 | **P2** | Pendiente | `globals.css`, `app/page.tsx` |
| U100 | **Foco en una sola home con clímax** (hoy 6 secciones apiladas sin jerarquía ni acción dominante). | 4 | 3 | **P1** | Pendiente | `app/page.tsx` |
| U101 | **Reparar el ritmo vertical** (`.section` 40/72px anulado con `padding-top:0` + overrides inline). | 2 | 2 | **P2** | **Hecho (3.4·lote 1, verificado — deuda del prototipo)** · en `apps/web/` el ritmo lo da `<Section>` (40/72); único override: colapso deliberado entre dos secciones canvas contiguas del dashboard | `ui/section.tsx` |
| U102 | **Distinguir explícitamente formato de alimento** (los sacos son verticales; el media 1:1 desperdicia altura). Depende de U080. | 2 | 2 | **P3** | Pendiente | `commerce/product-card.tsx` |
| U103 | **Pulido del logo / marca de huella** (huella de 4 círculos = cliché #1 de marcas de mascotas; diferenciación nula). | 2 | 3 | **P3** | Pendiente | `layout/logo.tsx`, branding |
| U104 | **Equilibrar uso de urgencia** ("Últimas unidades", pulse): sin escasez verificable se percibe como truco. | 2 | 1 | **P3** | Pendiente | `commerce/badges.tsx`, `pet/anticipation-capsule.tsx` |

---

## Fase futura (Backend / CRO)

> Requiere datos reales, integraciones, contenido o experimentación. Documentado para no perderlo; no bloquea el frontend.

| ID | Descripción | Imp | Esf | Prioridad | Estado | Archivos afectados |
|---|---|---|---|---|---|---|
| U090 | **Fotografía real de producto y lifestyle** (packshots sobre fondo cálido + perros reales). Cambio #1 de percepción premium/confianza. Bloquea U080/U081/U084/U091/U092. | 5 | 5 | **P0** | Pendiente | `public/**`, pipeline de assets, `lib/demo-data.ts` |
| U105 | **Sistema de reseñas con datos reales** (volumen, fecha, foto, "compra verificada"). Hoy 2 testimonios genéricos en una tab. | 4 | 4 | **P1** | Pendiente | `commerce/review-card.tsx`, backend reviews |
| U106 | **Prueba social local** ("X familias de Ñuñoa lo recompran"). | 4 | 4 | **P1** | Pendiente | `commerce/product-card.tsx`, backend |
| U107 | **Credibilidad de farmacia** (sello/revisión veterinaria, explicar el 🔒 = requiere datos/receta). | 4 | 3 | **P1** | Pendiente | `app/(tienda)/categoria/[slug]/page.tsx`, contenido legal |
| U108 | **Logos reales de pago + SSL** (Webpay/Transbank/MercadoPago/Khipu) en vez de solo texto "Pago seguro". | 4 | 2 | **P1** | Pendiente | `layout/footer.tsx`, `app/checkout/page.tsx` |
| U109 | **Cálculo de ahorro anual de la suscripción** ("vs. comprar suelto pagas $X más al año"): el argumento más potente, falta el dato. | 4 | 3 | **P1** | Pendiente | `lib/anticipation.ts`, `commerce/subscription-box.tsx`, backend |
| U110 | **Express checkout / 1-click** (Apple Pay, Google Pay) y "comprar de nuevo" prominente para recompra. | 4 | 4 | **P1** | Pendiente | `app/checkout/page.tsx`, integraciones de pago |
| U111 | **Política de devolución y garantía visibles** (en alimento/farmacia la garantía vende). | 3 | 2 | **P1** | Pendiente | contenido, `app/(tienda)/producto/[slug]/page.tsx`, `layout/footer.tsx` |
| U112 | **Datos de empresa (RUT, dirección, atención)** para confianza local chilena. | 3 | 2 | **P2** | Pendiente | `layout/footer.tsx`, contenido |
| U113 | **Realzar "Boleta SII"** como señal de formalidad (importante en Chile). | 3 | 1 | **P1** | Pendiente | `layout/footer.tsx`, `app/checkout/page.tsx` |
| U114 | **Reaseguro de privacidad de datos de la mascota** (peso/salud/cumpleaños). | 3 | 2 | **P2** | **Parcial (3.3B)** · onboarding (paso salud) y registro reaseguran "privado y solo para cuidarlo mejor"; falta contenido legal | `app/comenzar/onboarding-wizard.tsx`, `app/crear-cuenta/register-view.tsx`, contenido legal |
| U115 | **Credibilidad experta** (veterinario/nutricionista) detrás de las recomendaciones "para Toby". | 3 | 3 | **P2** | Pendiente | `pet/recommendation-card.tsx`, contenido |
| U116 | **Ancla de valor de la suscripción** más allá de "-15%" (comparativa de precio suelto). | 3 | 3 | **P2** | Pendiente | `commerce/subscription-box.tsx`, backend |
| U117 | **Búsqueda funcional con autocomplete/sugerencias** (clave en catálogo amplio). | 4 | 4 | **P2** | Pendiente | `ui/search-bar.tsx`, `ui/combobox.tsx`, backend search |
| U118 | **Validación de cobertura/dirección** en checkout (mapa, comuna, despacho disponible). | 3 | 3 | **P2** | Pendiente | `app/checkout/page.tsx`, integración logística |
| U119 | **Taxonomía real de catálogo** (hoy todos los links van a una sola PLP). | 4 | 4 | **P2** | Pendiente | `config/nav.ts`, `app/(tienda)/categoria/**`, backend |
| U120 | **Experimentación A/B de urgencia y jerarquía de suscripción** (validar que no se perciba como truco y que suba conversión). | 3 | 3 | **P2** | Pendiente | analítica/CRO |
| U121 | **Regalo sorpresa de cumpleaños** como flujo real (gancho emocional hoy pasivo). | 3 | 4 | **P2** | Pendiente | `pet/pet-edit-card.tsx`, backend campañas |
| U122 | **Diferenciación de marca / identidad visual propietaria** (más allá del cliché de huella). | 2 | 4 | **P3** | Pendiente | branding, `layout/logo.tsx` |

---

## Changelog del backlog

- **2026-06-28** — Creación. 108 ítems derivados de la auditoría del prototipo (`/prototype`). Todos en estado `Pendiente`. Pendiente de incorporar a `TODO.md`/`ROADMAP.md` como dependencia de Etapa 2 (componentes).
- **2026-06-28 (cierre Etapa 2 · D15)** — Revisión de **Fase 3.2** al construir la Component Library. **3/3 P0 Hechos** (U001, U002, U020). De los 14 P1: **Hechos** U004, U005, U007, U008, U011, U012, U013, U021; **Parciales** U006, U015, U024 (+U016/U017/U018/U019/U031/U033 P2/P3 parciales); **Pendientes para Polish 3.4** U003, U009, U010, U028, U029 (tokens de marca / verificación de contraste / opsz). Detalle por ítem en la columna *Estado* arriba. Fases 3.3 y 3.4 se mantienen `Pendiente` (se resuelven al ensamblar pantallas y en el polish; muchas dependen de fotografía real **U090**). Ya incorporado a `TODO.md`/`ROADMAP.md` como dependencia por etapa.
- **2026-06-29 (consolidación documental)** — Limpieza de tags basura al final del archivo (`</content>`/`</invoke>`, artefacto de escritura) y adición de metadata. Sin cambios en los 108 ítems.
- **2026-06-29 (Fase 3.3B · D16 — Activation Flow)** — El embudo de activación resuelve **U041** (doble identidad de la home → `/` decide por sesión) y **U058** (separar landing de la app logueada) → **Hechos**. **U068** (saludo condicionado al estado real) **Hecho**. **U042** (free-shipping con progreso real) confirmado **Hecho (E3)**. **U114** (privacidad de datos de la mascota) **Parcial**. La Fase 3.3 sigue abierta hasta la revisión visual del flujo.
- **2026-07-03 (cierre Fase 3.3 · D17)** — Revisión visual completa de la Etapa 3 (pantallas + embudo 3.3B) con mejoras aplicadas en dos rondas. **Fase 3.3: 27/33 ítems Hechos** (U041/U042/U058/U068 ya lo estaban; se cierran U040, U043–U057, U059–U065, U067, U069, U071, U072). **Diferidos:** U066 (redondeo CLP) → Polish 3.4 · U070 (cercanía de retiro) → Fase futura · U114 sigue Parcial. **Mejoras fuera de backlog:** token `--radius-pill` faltante (pills renderizaban cuadrados), cursor pointer global (preflight Tailwind v4), alturas uniformes de ProductCard, diálogo real de reagendo (fecha programada + opciones), alta de 2ª mascota cableada, y **modelo invitado (D17)**: landing-vitrina con riel, header marketing con buscador/nav/carrito, checkout de invitado punta a punta, gate honesto de suscripción (cuenta solo si hay suscripción), registro valor-primero post-compra en /bienvenida e invitaciones contextuales en PLP/PDP. La **Fase 3.3 queda CERRADA**; siguiente etapa: **Polish 3.4** (condicionada por fotografía real U090).
- **2026-07-05 (Polish 3.4 · lote 1 — track no-fotográfico)** — Arranca la Fase 3.4 por lo que no depende de imágenes (decisión del fundador: las fotos IA de ChatGPT se probarán después). **10 ítems Hechos:** U009 (Fraunces variable + opsz por nivel), U010 (escala sin solape 28–36/36–48/44–60), U028 (`neutral-500` → #6F665A, AA en los 3 fondos), U029 (verificado sin cambios), U066 (política CLP: piso a múltiplo de $10, `subscriptionPrice()` como fuente única), U085 (llenado animado de la barra, `animateIn`), U087 (pulso-alerta eliminado), U088 (trigger "¿Por qué te lo decimos?" como pill), U089 (banda oscura de landing como pieza editorial inset), U101 (verificado: deuda del prototipo, no aplica en `web/`). **Pendiente del track no-fotográfico (lote 2):** U003 (color suscripción — requiere decisión de marca), U086 (vuelo al carrito), U093–U100, U104. **Track fotográfico** (U080/U081/U082/U084/U091/U092) espera assets (U090 / fotos IA por probar). Verificación: `tsc` + `eslint` + `next build` (22 rutas) + smoke HTTP 200 (/, carrito, PDP, checkout) ✅.
