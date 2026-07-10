# PET EXPERIENCE — Perfil logueado · Target Experience + Plan de bloques

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Visión objetivo (target experience) de la experiencia logueada de mascota + plan de implementación por bloques. Se vuelve aquí durante el desarrollo. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo · visión aprobada 2026-07-09. Implementación por bloques, frontend primero. |
> | **Depends On** | DESIGN_SYSTEM.md, UX.md, COMPONENT_LIBRARY.md, CURRENT_STATE.md |
> | **Source of Truth** | ✅ de la *experiencia objetivo del perfil logueado* y del *orden de implementación*. |

> **Cómo usar este doc.** La **Parte 1** es el diseño (qué debe sentir y verse el usuario, asumiendo que todo persiste). La **Parte 2** es el plan operativo: bloques pequeños e independientes, **frontend primero** y **backend después**, siempre separados. No implementar todo de una vez: se cierra un bloque completo, se revisa, se itera, y recién ahí el siguiente.

---

## Tesis de diseño

El momento en que se sube la foto de la mascota es la **bisagra** donde Manada deja de ser *una cuenta* y pasa a ser *un vínculo*. La foto es "la principal prueba de Amor" (DESIGN_SYSTEM §1) y el dato-protagonista. Todo lo de abajo persigue una sola sensación: **"Toby ahora vive aquí, y esta app lo conoce."**

Regla transversal (DESIGN_SYSTEM §8): **una jerarquía por vista — un héroe, un acento.** En las pantallas de mascota el héroe es *ella* (foto + nombre en Fraunces `pet-name`); el acento es **Miel** (anticipación).

---

# PARTE 1 — Target Experience (el diseño)

## 1.1 La foto: cómo cambia toda la app

Tres tiempos.

**Tiempo 1 — El acto (premium, ~30s).** El avatar `xl` **es** la zona de subida (no un "examinar" frío). Al soltar/elegir archivo → `Dialog` con **recorte circular en vivo** + zoom. Copy cálido: *"Encuádralo. Así lo vas a reconocer de un vistazo."* Botón **"Guardar a {nombre}"**. Al confirmar, la imagen entra con `scale .96→1` + fade (250 ms, easing entrada DS §10).

**Tiempo 2 — La revelación (SOLO la primera vez: el "wow").** Coreografía única de ~1.2 s, jamás repetida:
1. (0 ms) el crop se cierra con la cara ya montada en el avatar del perfil.
2. (150 ms) toast cálido: *"¡Hola, {nombre}! 🐾 Ya eres parte de la manada."*
3. (300 ms) el **avatar del header** hace cross-fade emoji→cara (mismo cross-fade del selector, DS §10) → "te acompaño arriba en todo el sitio ahora".
4. (500 ms) la **barra de completitud** sube (Progress miel, `animateIn`) — foto pasa a `done`.
- `prefers-reduced-motion` → solo fade corto + toast.
- Por qué el header y no confeti: ver su cara aparecer en el chrome que te sigue por todo el sitio es *específico* de Manada ("te conoce"), no decorativo.

**Tiempo 3 — El estado permanente (cada superficie, para siempre).** Donde hoy hay emoji o nombre suelto, aparece su cara:

| Superficie | Después (con foto) |
|---|---|
| Header · PetSwitcher | cara + nombre · el avatar **navega al perfil** |
| Perfil · hero | **retrato** grande que ancla la página (§1.2) |
| Dashboard · saludo | su cara junto al `display-l` |
| AnticipationCapsule | mini-avatar en el overline |
| ProductRail "Lo de siempre de {nombre}" | overline con su cara → el riel se siente suyo |
| RecommendationCard salud | "Pensado para {nombre}" con cara mini |
| CartItem de alimento | chip **"· para {nombre}"** con su cara (§1.3) |
| Confirmación / /bienvenida | "Le avisaremos a {nombre}" + su cara |
| /cuenta | fila de **avatares de la manada** al tope (§1.4) |
| Favicon/título del perfil (deleite) | "{nombre} · Manada" |

**Firma de personalización.** Patrón mínimo: un **overline personalizado** `[cara] PARA TOBY` (usa `PetAvatar size="xs"`) que reemplaza los `PARA TOBY 🐾` de cápsula, riel y recomendaciones. Un componente, 4+ lugares: toda la personalización pasa a tener rostro.

## 1.2 El perfil de mascota (retrato editorial, calidad de la landing)

Composición objetivo (desktop; en móvil apila en 1 col, el retrato arriba centrado):

```
── HERO / RETRATO ──  Section tone="brand" (brand-soft), radius.xl
  [FOTO retrato]   TOBY  (Fraunces pet-name, text.brand)
                   🐕 Perro · Adulto · 8 kg · Mestizo   (PetStatus)
                   Perfil completo ▓▓▓▓▓▓▓▓░░ 80%  (Progress miel)   [Editar perfil]

── SU DÍA A DÍA ──  el acento (Miel), protagonista
  [cara] PARA TOBY · "A Toby le quedan ~5 días"  (AnticipationCapsule)
  ┌ Stat cards (reusa módulo specs PDP) ┐
  │ ~180 g/día │ ~24 días │ Acana Adult │ 8 kg │

── SU FICHA ──  2 col de PetEditCard (vacío = invitación cálida con beneficio)
  Peso · Raza · Esterilización · Alimento · Salud

── LO DE SIEMPRE DE TOBY ──  ProductRail (su recompra habitual)

── SU SALUD ──  RecommendationCard (cross-sell farmacia, con "por qué")

── SU HISTORIA CON MANADA ──  (deleite, ligero) timeline vertical
```

**Mapeo a componentes existentes:** hero = evoluciona `PetProfileHeader` (foto con anillo `terracota-100`, `Section tone="brand"`, `Progress tone="miel"` embebida); día a día = `AnticipationCapsule` + módulo stat-cards de `ProductView` (specs); ficha = `PetEditCard`; lo de siempre = `ProductRail`; salud = `RecommendationCard`; historia = patrón nuevo mínimo (timeline con `Separator` + puntos miel).

**Decisión clave — los campos vacíos invitan, no se ocultan.** Hoy el perfil filtra los campos sin valor y por eso se ve vacío. En el objetivo, "Salud — + Cuéntame si tiene alguna condición" es **contenido** (invitación cálida con su beneficio, UX.md §6.4). Un solo lugar pide datos; sin panel "te falta" duplicado.

## 1.3 Asociar alimento a una mascota (el flujo ideal)

Principio: la asignación es **acto de cuidado, no formulario**. Se infiere y se confirma con calidez.

- **1 mascota → silencioso.** La PDP ya muestra ración/duración "para {nombre}". Al agregar: toast *"Guardamos que {nombre} come esto — te avisaremos antes de que se le acabe."* Cero clics extra. Ese toast es donde el usuario entiende que Manada acaba de aprender algo de su mascota.
- **≥2 mascotas → segmented inline** (avatares, default = activa) antes del CTA; el CTA nombra a quién (**"Agregar para Toby"**); las stat-cards **recalculan en vivo** al cambiar de mascota (peso/etapa distintos = otra ración/duración).
- **Mismo alimento para dos → multi-selección** ("Toby + Luna"); en el carrito, dos chips o "· para Toby y Luna".
- **Reflejo posterior:** chip "· para {nombre}" en `CartItem` (solo alimento); stat "su alimento" del perfil se llena sola; enciende la anticipación (días restantes). Editar desde el perfil: stat "su alimento" ✎ → `/categoria/alimento` con la mascota preseleccionada.
- **Deleite:** primera asignación → *"Ya sé qué come Toby. Desde ahora me adelanto a su próxima bolsa."*

## 1.4 Restyle de pantallas menos terminadas (reusar antes de inventar)

- **`/cuenta` → "tu manada primero":** fila superior de **avatares de la manada** (`PetAvatar`, navega al perfil; `+` reusa el estado "Agregar mascota" del `PetSwitcher`), bajo `overline "Tu manada"`; la grilla de gestión actual se conserva pero **degradada a secundaria** bajo `SectionHeading overline="Gestión"`. 0 componentes nuevos.
- **`/cuenta/pedidos` · `/cuenta/direcciones`:** cada ítem en `Card` (`radius.lg`, `shadow.sm`), estado con `Badge` semántico, total en `price`; vacío → `EmptyState` (ilustración + copy cálido + CTA), estándar DS §12.5. Pedido con alimento → chip "· para {nombre}".
- **Confirmación / `/bienvenida`:** cerrar loop emocional — check dibujado + "Le avisaremos a {nombre}" con su cara (`FeatureCard`/`Card`).
- **Norma:** ningún estado vacío queda como texto pelado.

---

# PARTE 2 — Plan de implementación por bloques

**Convención de trabajo:** cada bloque es pequeño, independiente, deja la app **funcional** y **no rompe** el resto. Se construye el **frontend primero** (contra el estado local de los providers actuales); la **integración con backend** se lista aparte y se hace en una segunda pasada por bloque. El `PetProvider`/`CartProvider` son la **costura**: el frontend consume su superficie; el backend se conecta reemplazando sus internos.

> **Sobre el estado durante el desarrollo.** Mientras no exista el módulo `pet-profile`, los bloques de frontend operan sobre el estado en memoria del `PetProvider`. El Bloque 4 introduce una persistencia local ligera (`localStorage`) **como andamio de revisión**, marcada para ser reemplazada por el backend. No es la verdad final; es para poder revisar el frontend sin perder estado al recargar.

Orden recomendado (impacto × seguridad, narrativa "arreglar → dar rostro → dar vida"):

---

### 🔹 Bloque 1 — El header: la mascota es un lugar ✅ COMPLETADO (2026-07-09)
Arregla el callejón sin salida exacto que se detectó (clic en la mascota no hace nada).

> **✅ Implementado y validado** (smoke manual de Carlos, 2026-07-09). Diff acotado a `components/pet/pet-switcher.tsx`. Estados: **0 mascotas** sin cambios ("Agregar mascota" → `/comenzar`); **1 mascota** → el pill (avatar + nombre) navega a `/cuenta/mascotas`, sin chevron ni menú; **≥2 mascotas** → zonas de hit separadas (avatar/nombre navega + chevron aparte) y el menú Radix con "Ver perfil de {nombre}", cambio de mascota activa, "Gestionar mi manada" y "Agregar mascota". **Decisiones aprobadas:** áreas táctiles a 44px (`min-h-11`, consistente con los IconButton del header, por sobre conservar la altura anterior); en móvil (<sm) se ocultan nombre y chevron y solo el avatar navega (el cambio entre mascotas en móvil se resuelve en el rediseño de perfil/manada, no aquí). `tsc` + `eslint` + `next build` verdes. Durante el smoke surgieron observaciones de UX en otros flujos (onboarding, recomendación, registro, checkout, alta de 2ª mascota); dos tocan este flujo pero **no rompen Bloque 1**. Se documentan como backlog aparte.

- **UX/UI (frontend):** el avatar + nombre del `PetSwitcher` **navega a `/cuenta/mascotas`**; el chevron/menú aparece **solo con ≥2 mascotas**; el menú gana "Ver perfil de {nombre}" arriba y "Gestionar mi manada" al pie.
- **Componentes crear/modificar:** modificar `components/pet/pet-switcher.tsx` (separar zona de navegación de zona de menú; ambas ya son Radix-friendly).
- **Dependencias:** ninguna.
- **Integración backend (posterior):** ninguna (pura navegación). Su valor pleno llega cuando la mascota persista (Bloque 4).
- **Resultado:** trivial, alta visibilidad, riesgo cero.

### 🔹 Bloque 2 — Firma de personalización (overline con cara) ✅ COMPLETADO (2026-07-10)
El patrón `[cara] PARA TOBY` en toda la app.

> **✅ Implementado y aprobado** (Carlos, 2026-07-10). Componente base `PetTag` valorado como "buena dirección, no invasiva". **Creado** `components/pet/pet-tag.tsx` (overline + `PetAvatar size="xs"` + label + tono `brand`/`miel`; con foto = cara, sin foto = emoji de especie, **fallback idéntico a hoy**; avatar `aria-hidden` para no duplicar "Foto de Toby · Para Toby" en lectores). **Tamaño `xs` (20px) añadido a `ui/avatar.tsx`** (aditivo, lo pedía el spec). **Enchufado vía prop opcional `pet?`** en `anticipation-capsule.tsx` y `recommendation-card.tsx` (si no llega `pet`, cae al overline Sparkles de siempre → **`/bienvenida` del funnel queda intacto**); call-sites `dashboard-view.tsx` y `cuenta/mascotas/page.tsx` pasan `pet={activePet}`. Styleguide `/dev/components` documenta `PetTag`. **Decisiones de alcance:** (1) **`ProductRail` (el "riel") NO se tocó** — no está en la lista de archivos del bloque y el riel actual ("Para tu perro") no tiene el patrón `PARA TOBY 🐾`; el riel con cara ("Lo de siempre de Toby") llega en **Bloque 3**. (2) La tarjeta de salud del dashboard **conserva su copy** ("Pensado para tu perro", U053) y solo **gana el rostro** — no se rediseñó texto. (3) **No se tocó `/bienvenida`** (dominio del chat del Funnel). **Verificado:** `tsc` + `eslint` + `next build` (28 rutas) verdes; smoke HTTP (`/dev/components`, `/cuenta/mascotas`, `/`) 200 sin errores de runtime. **Nota:** la validación emocional de la cara real espera al **Bloque 4** (hoy se ve el rostro-emoji, estado correcto sin foto persistida).

- **UX/UI (frontend):** nuevo overline personalizado que reemplaza los `PARA TOBY 🐾` de cápsula, riel y recomendaciones. Con foto muestra la cara; **sin foto, fallback al emoji actual** (idéntico a hoy → no rompe nada).
- **Componentes crear/modificar:** **crear** `components/pet/pet-tag.tsx` (overline + `PetAvatar size="xs"`); **modificar** `anticipation-capsule.tsx`, `dashboard-view.tsx`, `cuenta/mascotas/page.tsx` y los usos de `RecommendationCard` que nombran a la mascota.
- **Dependencias:** ninguna.
- **Integración backend (posterior):** ninguna directa; se enriquece solo cuando la foto persista (Bloque 4).
- **Resultado:** prepara el terreno visual de la foto; ya suma en el dashboard.

### 🔹 Bloque 3 — Perfil restyle (retrato editorial) ✅ COMPLETADO (2026-07-10)
El mayor salto visual: de "se siente vacío" a "la casa de Toby".

> **✅ Implementado y aprobado** (Carlos, 2026-07-10): "ahora sí se siente como la casa de la mascota, no una página de datos". **Evolucionado** `pet-profile-header.tsx` → **hero editorial** (`bg-brand-soft` + `radius-xl`, retrato `xl` con anillo `terracota-100`, nombre Fraunces `pet-name` `text-brand`, `PetStatus` + `Progress miel`). **Creado** `cuenta/mascotas/mascotas-view.tsx` (cliente) con la composición §1.2: Hero → **Su día a día** (AnticipationCapsule con rostro + stat-cards con el patrón specs de la PDP: ración diaria, duración del saco) → **Su ficha** (`PetEditCard` grid, **campos vacíos = invitación cálida**, sin panel "te falta" duplicado, §1.2) → **Lo de siempre de {nombre}** (`ProductRail`, derivado por especie como degradación honesta) → **Su salud** (`RecommendationCard` con rostro). `cuenta/mascotas/page.tsx` pasa a **server component** que hidrata `listProducts()` (mismo patrón que la Home). **Decisiones de alcance:** (1) **no se duplicó "su alimento"** — vive como campo editable en la ficha; las stat-cards quedan como métricas derivadas. (2) **No se tocó la PDP ni `ProductRail`** (reutilizados tal cual); el patrón stat-card se replicó con las mismas clases. (3) **"Su historia" (timeline) → diferida** (opcional). (4) **"Su salud"** se mantiene en el perfil **y** en el Home — **decisión de Carlos**: el perfil debe ser el lugar donde vive toda la info de la mascota; la duplicidad con U072 no preocupa hoy (a futuro se evaluará adelgazar el Home). **Verificado:** `tsc` + `eslint` + `next build` (28 rutas; `/cuenta/mascotas` ahora dinámica) verdes; smoke HTTP 200 sin errores. **Nota:** el camino "con alimento" (capsule + stat-cards) es demo hasta **Bloque 6** — en el flujo real ninguna mascota tiene alimento asignado aún, así que el perfil degrada a la invitación "cuéntanos qué come". **→ Carlos prioriza cerrar ese loop (Bloque 6) antes de seguir puliendo el perfil.**

- **UX/UI (frontend):** recomposición completa de `cuenta/mascotas` según §1.2 — hero retrato (`tone="brand"`), stat-cards (reusa módulo specs de la PDP), secciones "Su día a día" / "Su ficha" / "Lo de siempre" / "Su salud" / (historia opcional). Campos vacíos = invitaciones. Degrada con gracia si falta dato (ración se deriva del peso/etapa reales; "su alimento" se muestra como invitación si no se conoce).
- **Componentes crear/modificar:** **modificar** `cuenta/mascotas/page.tsx`; evolucionar `pet-profile-header.tsx` (o extraer `PetHero`); **reutilizar** `ProductRail`, `AnticipationCapsule`, `RecommendationCard`, `PetEditCard`, `PetStatus`, `Progress`, el `PetTag` del Bloque 2 y el patrón stat-card de `ProductView`.
- **Dependencias:** Bloque 2 (PetTag).
- **Integración backend (posterior):** los datos ricos (días restantes, "su alimento", "lo de siempre", historia) provienen del backend real; hasta entonces se derivan/omiten sin romper el layout.
- **Resultado:** el perfil alcanza la calidad de la landing usando piezas existentes.

### 🔹 Bloque 4 — Subir foto + cascada + revelación
El corazón emocional. Introduce la costura de edición del perfil.

- **UX/UI (frontend):** avatar-como-dropzone; `Dialog` con recorte circular; la coreografía única de la primera vez (§1.1); cascada al header/perfil/tags. Foto en estado del provider (objectURL local) + persistencia `localStorage` (andamio).
- **Componentes crear/modificar:** **crear** `components/pet/pet-photo-uploader.tsx` (Dialog + crop + estados idle/cropping/saving/done/error); **modificar** `pet-provider.tsx` (añadir `updatePet` + hidratación `localStorage`), el hero del perfil y el `PetSwitcher` (cross-fade). Los sitios que ya leen `pet.avatarUrl` vía `PetAvatar` se actualizan solos.
- **Dependencias:** Bloques 1–3 (para que la cascada luzca); provider `updatePet`.
- **Integración backend (posterior):** subir a blob store (Vercel Blob o file-provider de Medusa) → **persistir `avatar_url`** en el módulo `pet-profile`; reemplazar objectURL/localStorage por la URL real.
- **Resultado:** la mascota "vive dentro de Manada". El `updatePet` habilita el Bloque 5.

### 🔹 Bloque 5 — Editar campos del perfil (Dialog real)
Elimina los toasts muertos ("se conecta en la siguiente fase").

- **UX/UI (frontend):** `PetEditCard.onEdit` abre un `Dialog` con `Input`/`RadioGroup` reales; guarda vía `updatePet`; la barra de completitud sube. Un solo lugar de edición.
- **Componentes crear/modificar:** **crear** `components/pet/pet-edit-dialog.tsx`; **modificar** `pet-edit-card.tsx` y `cuenta/mascotas/page.tsx`. Reutiliza `updatePet` del Bloque 4.
- **Dependencias:** Bloque 4 (`updatePet`), Bloque 3 (perfil restyle).
- **Integración backend (posterior):** `updatePet` llama al endpoint real del módulo `pet-profile` (PATCH mascota); validación server-side.
- **Resultado:** el perfil es editable de verdad (local); backend es swap directo.

### 🔹 Bloque 6 — Asociar alimento a la mascota (UX) ✅ COMPLETADO (2026-07-10)
Materia prima del moat, como experiencia.

> **✅ Implementado y verificado** (2026-07-10). El loop alimento↔mascota queda cerrado en el frontend y, de paso, **saca la última deuda demo de las superficies logueadas reales**. **Costura nueva** en `pet-provider.tsx`: `assignFood(petId, foodId)` (set `currentFoodId`) + `foodAssignedAt` (fecha ISO por mascota, para contar la anticipación desde la asignación) — **una sola API** que luego reusará la recomendación del funnel y que el backend reemplaza persistiendo `current_food`. **PDP** (`product-view.tsx`): selector "¿para quién?" (≥2 mascotas, patrón segmented con `PetAvatar xs`), specs que **recalculan por la mascota destino**, CTA **"Agregar para {nombre}"**, y al agregar → `assignFood()` + **toast de cuidado** (*"Guardamos que {nombre} come esto — te avisaremos antes de que se le acabe"*). **Carrito** (`cart-item.tsx`): chip **"· para {nombre}"** en la línea de alimento, derivado de `pet.currentFoodId` (fuente única). **Dashboard y perfil** (`dashboard-view.tsx`, `mascotas-view.tsx`): la anticipación deja de leer `TOBY_ANTICIPATION`/`PRODUCT_BY_ID` y se **deriva de `petFoodAnticipation(pet, productoReal, foodAssignedAt)`** (motor real en `anticipation.ts` con `bagKgFromFormat`); sin alimento o sin peso → degrada a invitación cálida, **sin números inventados**. **Deuda demo eliminada:** `demo-data.ts` queda consumido **solo** por el hero de la landing anónima (`TOBY_ANTICIPATION`, conservado por decisión de marca D28) y `/dev/components` (styleguide, gateado en prod). **Verificado:** `tsc` + `eslint` + `build` (24 rutas) verdes; boot smoke (`/`, `/cuenta/mascotas`, `/producto/[slug]`) → 200 sin errores; ramas "con mascota" auditadas por código (sin null-deref; ids reales de Medusa de punta a punta: `map-product` fija `id`/`format` desde el producto/variante, `assignFood` guarda ese id, dashboard/perfil lo resuelven con `products.find`); confirmado que los **4 alimentos reales traen `format` en kg** → la anticipación efectivamente se enciende en el flujo real. **Caveat honesto (esperado):** la asignación vive **en memoria** del `PetProvider` (efímera, se pierde al recargar) — esto es **el seam**, no el almacén final; la persistencia es Bloque 4 (localStorage andamio) / backend. **Alcance diferido (menor):** "mismo alimento para dos → multi-selección" (§1.3) **no** se implementó (la mascota destino es única); se agenda si se prioriza. **Integración backend (sin cambios respecto al plan):** `line_item.metadata.pet_id` + subscriber `order.placed` → set `current_food` → enciende la anticipación real; el cálculo ya existe.

- **UX/UI (frontend):** PDP de alimento con selector "¿para quién?" (≥2 mascotas), CTA "Agregar para {nombre}", stats que recalculan por mascota, toast de cuidado; chip "· para {nombre}" en `CartItem`; stat "su alimento" del perfil se llena.
- **Componentes crear/modificar:** **modificar** `producto/[slug]/product-view.tsx` (selector + CTA + toast), `cart-provider.tsx` (`addItem` acepta `petId`; mapa línea→mascota en estado local), `cart-item.tsx` (chip con cara), `pet-provider.tsx` (set `currentFoodId` local). Reutiliza el patrón segmented del `PetSwitcher`.
- **Dependencias:** Bloque 4/5 (cara + updatePet), Bloque 3 (reflejo en perfil).
- **Integración backend (posterior):** guardar `line_item.metadata.pet_id` en Medusa; **subscriber `order.placed`** → set `pet.current_food` (producto + fecha + tamaño de saco) → **enciende la anticipación real** (el cálculo ya existe en `lib/anticipation.ts`).
- **Resultado:** el vínculo alimento↔mascota es visible y coherente; la anticipación real queda "a un cable" del backend.

### 🔹 Bloque 7 — Restyle de /cuenta + estados vacíos
Cierra la consistencia de toda la zona logueada.

- **UX/UI (frontend):** `/cuenta` con la manada primero (§1.4); estados vacíos con `EmptyState` en pedidos/direcciones; confirmación/`bienvenida` con cara.
- **Componentes crear/modificar:** **modificar** `cuenta/account-view.tsx`, `cuenta/pedidos/orders-view.tsx`, `cuenta/direcciones/addresses-view.tsx`, `bienvenida`. Reutiliza `PetAvatar`, `Card`, `Badge`, `EmptyState`, `SectionHeading`, `FeatureCard`.
- **Dependencias:** Bloque 1 (nav), Bloque 4 (caras).
- **Integración backend (posterior):** pedidos/direcciones ya son reales (Medusa); el chip "para {nombre}" en pedidos depende de la metadata del Bloque 6.
- **Resultado:** la cuenta se siente cálida y "te conoce"; sin patrones nuevos.

---

## Resumen de dependencias

```
B1 (header) ─┐
B2 (pet-tag) ─┴─► B3 (perfil restyle) ─► B4 (foto + updatePet) ─► B5 (editar)
                                                   └─► B6 (alimento↔mascota) ─► B7 (cuenta)
```

## Componentes: nuevos vs reutilizados

- **Nuevos (mínimos):** `pet-tag.tsx` (B2), `pet-photo-uploader.tsx` (B4), `pet-edit-dialog.tsx` (B5), timeline "Su historia" (B3, opcional).
- **Modificados:** `pet-switcher`, `pet-profile-header`/`PetHero`, `pet-edit-card`, `product-view`, `cart-item`, `pet-provider`, `cart-provider`, `dashboard-view`, `account-view`, `orders-view`, `addresses-view`, `anticipation-capsule`.
- **Reutilizados tal cual:** `ProductRail`, `AnticipationCapsule`, `RecommendationCard`, `PetStatus`, `PetAvatar`, `Progress`, `Card`, `Badge`, `Chip`, `EmptyState`, `Dialog`, `SectionHeading`, `FeatureCard`, módulo stat-cards de la PDP.

## Trabajo de integración backend (consolidado, segunda etapa)

1. **Módulo `pet-profile`** en Medusa: `pet` belongs-to `customer` (nombre, especie, etapa, peso, raza, esterilización, condiciones, `avatar_url`, `current_food`). Endpoints CRUD.
2. **Hidratación real:** `PetProvider` carga las mascotas del cliente al login (reemplaza el arranque vacío en memoria y el `localStorage` andamio).
3. **Foto:** upload a blob store + persistir `avatar_url`.
4. **Alimento↔mascota:** `line_item.metadata.pet_id`; subscriber `order.placed` → set `current_food` (producto + fecha + saco) → enciende anticipación real.
5. **Editar:** PATCH mascota con validación server-side.

> **Regla de oro:** en cada bloque, primero cerramos y revisamos el **frontend** (experiencia) contra el estado local; la **integración** se agenda como pasada posterior. Nunca mezclar ambas en el mismo bloque.

---

# PARTE 3 — Observaciones de UX del smoke (backlog · NO implementar aún)

> **Origen.** Detectadas por Carlos durante el smoke manual del **Bloque 1** (2026-07-09), en flujos vecinos al header. Son **importantes para el MVP** pero **no son de Bloque 1**. **Regla:** primero definimos y diseñamos bien la experiencia; recién con el diseño acordado se escribe código. No implementar nada de esta Parte 3 todavía. Dos de estas (O5 y O6) tocan el flujo que se probó al validar Bloque 1; **no rompen Bloque 1** (O5 es previa/independiente; O6 es un hueco temporal que el plan cierra en bloques posteriores).

### O1 · Onboarding — Peso opcional ("No sé su peso")
- **Síntoma.** El paso de peso obliga a un valor exacto; mucha gente no lo conoce y hoy se ve forzada a inventarlo.
- **Dirección.** Añadir opción **"No sé su peso"**. Si el usuario no lo conoce, **estimarlo a partir de la raza** (ver O2) y permitir corregirlo más adelante (perfil editable, Bloque 5).
- **Preguntas de diseño.** ¿El peso pasa a opcional siempre, o solo si se eligió raza estimable? ¿Cómo se comunica que la ración/anticipación es "estimada" hasta confirmar peso? ¿Rango por tamaño (pequeño/mediano/grande) como fallback cuando no hay raza?
- **Dónde encaja.** Onboarding (`comenzar/onboarding-wizard.tsx`) + motor de ración (`lib/anticipation.ts`/`lib/recommend.ts`). Impacta la calidad de la recomendación (O3).

### O2 · Onboarding — Raza antes que peso
- **Síntoma.** Hoy se pide el peso antes que la raza; el orden natural es al revés (la raza informa el peso).
- **Dirección.** Pedir **primero la raza**, con: (a) buscador/desplegable de razas; (b) opción **"Mestizo"**; (c) opción **"No aparece / Otra raza"** que habilite el **ingreso manual** como hoy. Con la raza podemos **estimar el peso** (O1) y afinar la recomendación.
- **Preguntas de diseño.** ¿De dónde sale el catálogo de razas (lista curada local vs fuente externa) y su mapeo a peso típico? ¿Perro y gato tienen listas separadas? ¿"Mestizo" pide tamaño aproximado para estimar peso? ¿Cuánto alarga el onboarding y cómo mantenerlo liviano?
- **Dónde encaja.** Onboarding. Acoplado a O1 (raza → peso estimado).

### O3 · Pantalla de recomendación — replantear (menos transaccional, más acompañada)
- **Síntoma.** La transición hacia el alimento recomendado se siente **demasiado agresiva/transaccional**. Hoy `recommendation-view.tsx` va directo a "el producto + CTA de compra".
- **Dirección (a explorar).** Además del CTA principal: (1) acción clara para **ver otras alternativas** (no encerrar en un solo producto); (2) **explicar mejor el porqué** de la recomendación (hoy hay un bloque "por qué" pero corto); (3) **educar sobre la suscripción** presentándola **siempre como opción, nunca impuesta**; (4) revisar **copy y jerarquía** para que se sienta acompañamiento, no venta.
- **Preguntas de diseño.** ¿"Ver alternativas" abre PLP filtrada, un comparador, o 2–3 cards inline? ¿La suscripción se explica aquí o se difiere? ¿Cuál es el CTA primario honesto si el usuario aún no confía? Relación con la atenuación actual de suscripción (`SUBSCRIPTIONS_ENABLED=false`, D29): hoy se vende como compra única.
- **Dónde encaja.** `comenzar/recomendacion/recommendation-view.tsx`. Es un rediseño de pantalla, candidato a su propio bloque.

### O4 · Registro — momento de pedir correo/contraseña
- **Síntoma.** Según el orden del flujo, pedir cuenta puede generar **demasiada fricción**. Hoy el registro es "valor primero" **post-recomendación / pre-carrito** (visitante), pero conviene cuestionar si ese es el mejor momento.
- **Dirección.** **Cuestionar primero**, no implementar: ¿registrar antes, después de la primera compra, o diferido con checkout de invitado (que ya existe)? ¿Qué se pierde/gana en cada punto (recuperar carrito, guardar perfil de mascota, anticipación)?
- **Preguntas de diseño.** ¿El perfil de mascota puede vivir sin cuenta hasta el checkout? ¿Qué gatilla realmente la necesidad de cuenta (guardar mascota vs pagar vs anticipación)? Alinear con la persistencia del Bloque 4.
- **Dónde encaja.** Transición `recomendacion` → `crear-cuenta` → `carrito`; toca `use-auth-actions`, `session-provider` y el orden del embudo.

### O5 · BUG — "Agregar a mi pedido" deja el carrito vacío (flujo incompleto)
- **Síntoma.** En la recomendación, al pulsar **"Agregar a mi pedido"** se llega a un **carrito vacío** en vez de avanzar a la compra.
- **Causa raíz (investigada).** La recomendación usa `lib/recommend` → `lib/data/catalog` (**catálogo demo, sin `variantId`**). El carrito real de Medusa (D24) **rechaza** cualquier producto sin `variantId` con un `console.warn` silencioso y no agrega nada (`components/providers/cart-provider.tsx`, guard `if (!product.variantId) { … return; }`). Luego `addToOrder()` navega a `/carrito` (con sesión) o `/crear-cuenta` (invitado) → carrito vacío. **Es previa a Bloque 1 e independiente de él:** el embudo de activación (onboarding → recomendación → carrito) nunca se reconectó al backend real como sí se hizo con Home/PLP/PDP (D23) y el carrito (D24).
- **Dirección.** Reconectar la recomendación al **catálogo real** (Store API / `lib/medusa`) para que el alimento recomendado sea un producto real con `variantId`, y definir el **recorrido ideal recomendación → checkout**. Opcional defensivo: que `addItem` no falle en silencio (feedback si no hay `variantId`).
- **Preguntas de diseño.** ¿El motor de recomendación corre sobre productos reales de Medusa (mapear `recommendFood`/`recommendComplements` al catálogo real)? ¿El recorrido ideal es recomendación → carrito → checkout, o recomendación → checkout directo? ¿Cómo encaja el registro (O4) en ese recorrido?
- **Dónde encaja.** `lib/recommend.ts` (fuente de datos), `recommendation-view.tsx` (CTA/navegación). Relacionado con O3.

### O6 · Alta de 2ª mascota — afordancia poco clara (hueco temporal por Bloque 1)
- **Síntoma.** Con **1 mascota** no hay una forma clara de crear una segunda.
- **Causa (investigada).** Es **consecuencia del diseño aprobado de Bloque 1**: con 1 mascota el pill ahora **navega al perfil** y ya no abre el menú antiguo que contenía "Agregar mascota"; el chevron/menú (que sí la tiene) solo aparece con **≥2** mascotas (círculo: no llegas al menú que agrega mascotas hasta tener 2). Hoy ni `/cuenta/mascotas` (perfil) ni `/cuenta` (cuenta) tienen botón "Agregar mascota" (solo aparece en el *empty state* anónimo de `account-view`). Existen entradas a `/comenzar` (CTAs de landing, dashboard sin mascota, "crear perfil" en PLP/PDP) pero están enmarcadas como "crea tu **primera** mascota", no "agrega otra".
- **Dirección.** El destino previsto para la afordancia es **Bloque 3** (perfil: hero con acción) y **Bloque 7** (`/cuenta` "tu manada primero": fila de avatares + `+` que reusa el estado "Agregar mascota"). Evaluar si conviene un **puente mínimo** ahora (un "Agregar mascota" visible en `/cuenta/mascotas` o `/cuenta`) o esperar a esos bloques.
- **Preguntas de diseño.** ¿Se adelanta el `+` de la manada como micro-afordancia o se resuelve dentro de Bloque 3/7? ¿El perfil (`/cuenta/mascotas`) debería listar la manada además de la activa (hoy solo muestra la activa)?
- **Dónde encaja.** `cuenta/mascotas/page.tsx` (Bloque 3) y `cuenta/account-view.tsx` (Bloque 7). No re-abrir Bloque 1.

> **Cierre de la Parte 3.** Ninguna de estas observaciones se implementa hasta acordar el diseño con Carlos. O5 es el único **bug funcional** (flujo incompleto); O1–O4 y O6 son decisiones de experiencia a definir antes de escribir código. Cuando se prioricen, se convierten en bloques propios (o se integran a los existentes) siguiendo la disciplina "un bloque → validado → un commit".

> **Ruteo acordado (Carlos, 2026-07-10):**
> - **O5 → EN PAUSA** hasta tener el **catálogo y productos reales conectados al backend**. No rediseñar el flujo recomendación→carrito mientras dependa de datos demo (podría estar condicionado por el demo). Reevaluar el síntoma una vez que la recomendación corra sobre productos reales con `variantId`.
> - **O1, O2, O3, O4 → primero UX/producto**, en un **chat separado**, antes de escribir código. Definir la experiencia; recién con el diseño acordado se abre bloque de implementación.
> - **O6** se resuelve dentro del plan (Bloque 3 / Bloque 7); no se re-abre Bloque 1.
> - Los siguientes bloques se continúan en **conversaciones independientes**; este hilo queda como referencia histórica.
