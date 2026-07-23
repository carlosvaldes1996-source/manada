# 🐾 PROJECT MASTER — Manada

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Documento maestro: visión, estrategia y resumen de decisiones del proyecto. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-11 |
> | **Depends On** | DECISIONS.md (fuente), CURRENT_STATE.md, ROADMAP.md |
> | **Supersedes** | `history/PROJECT_MASTER_v0.md` |
> | **Source of Truth** | ✅ de la *visión y estrategia*. El detalle vive en los archivos temáticos. |

> **Documento maestro: visión y estrategia (lo permanente).** Para detalle de trabajo en curso, ver los archivos temáticos de `/ai-context`.
>
> *📍 El estado actual, la fase activa y el siguiente paso viven **únicamente** en `CURRENT_STATE.md` (no se duplican aquí — regla D40).*

---

## 1. Proyecto

**Manada** — E-commerce de alimentos y accesorios para mascotas en Chile, con suscripción inteligente como motor de negocio. Stack custom headless. Ambición: ser el referente nacional de la categoría.

*(Nombre definitivo: **Manada** · dominio oficial `tumanada.cl` — D8, ver §8 y BRANDING.md.)*

## 2. Objetivo

Construir el e-commerce de mascotas **más confiable, moderno y querido de Chile**, comparable en experiencia a Mercado Libre, Amazon y Shopify, pero adaptado al mercado chileno y diferenciado por conocimiento y anticipación.

## 3. Misión

> Cuidar mejor a cada mascota de Chile **conociéndola como nadie** y anticipándonos a lo que necesita.

## 4. Visión

> Ser el **referente nacional del bienestar de las mascotas**: la marca más confiable, moderna y querida de la categoría en Chile, y dueña del "expediente de vida" de millones de mascotas chilenas.

## 5. Público objetivo

**Pet parents**: dueños que ven a su mascota como un miembro de la familia.

- **Primario:** urbano (RM y grandes ciudades), 25-45 años, digital, ocupado, ingreso medio / medio-alto, valora tiempo y calidad. Compra online y odia la fricción.
- **Secundario:** dueños "involucrados" en salud (mascotas con condiciones, senior, dietas especiales); familias; adultos mayores con mascota de compañía.
- **Insight clave:** sienten culpa/ansiedad por "hacer lo correcto" y por quedarse sin comida. Manada elimina ambas.

## 6. Posicionamiento

> Para los dueños de mascotas en Chile que quieren lo mejor para su compañero sin complicarse, **Manada** es la marca que **conoce a tu mascota como nadie y se anticipa a lo que necesita**. A diferencia de las tiendas que solo venden productos (SuperZoo, PetVet) o de los marketplaces sin criterio (Mercado Libre), Manada opera la vida alimentaria y el bienestar de la mascota.

**Concepto rector (ADN):**
> **"Manada te conoce como nadie y se anticipa a lo que tu mascota necesita."**

## 7. Competidores

| Competidor | Fortaleza | Debilidad que explotamos |
|---|---|---|
| PetVet | Logística + REPET (suscripción) + cards ricas | Copy frío, sin personalización real |
| SuperZoo | Confianza omnicanal (70 tiendas), retiro <3h | Transaccional, promocional, genérico |
| PetHome | Multi-especie, packs, puntos | Sin personalización ni contenido |
| PetCity | Logística propia | Mala reputación (Reclamos.cl, no devoluciones) |
| DrPet | Autoridad veterinaria | (pendiente análisis fino) |
| Mercado Libre | Escala, confianza transaccional, precio | Caótico, sin criterio ni recurrencia inteligente, sin cariño |

Benchmark mundial (norte de calidad): Chewy (cariño + autoship), Zooplus (retención + magazine), Amazon (fricción cero), Petco (membresía Vital Care). Detalle en `history/01-fase-0.2-benchmarking.md`.

## 8. Branding

- **Arquitectura de marca:** 🧠 Conocimiento (moat) → ⚡ Anticipación (producto) → 💛 Amor (marca).
- **Personalidad:** Cuidador + Sabio — cálido, experto, cercano, premium-accesible, anticipatorio. Si fuera persona: una veterinaria cercana de ~35 años que se acuerda del nombre de tu perro y se adelanta a lo que necesitas.
- **Moat:** dato propietario que se compone (perfil vivo de cada mascota) + costo de cambio. Evoluciona hacia ecosistema (C2) y red nacional de datos (C3).
- **Nombre:** ✅ **Manada** (definitivo, D8). Dominio oficial `tumanada.cl`. Descartados Querencia/Olfato/Instinto. Ver BRANDING.md.
- **Logo:** ✅ imagotipo **"huella-manada"** (D10) — huella cuyos dedos son siluetas agrupadas (huella + manada). Logotipo en Fraunces + isotipo escalable. Ver BRANDING.md §7.
- **Voz:** cálida, experta, tuteo chileno, beneficio primero, frases cortas, emojis con moderación. Habla de la mascota por su nombre.
  - ✅ *"A Toby le quedan ~5 días de comida. ¿La reagendamos para que no le falte?"*
  - ❌ *"Recordatorio de recompra programada (24-48 hrs hábiles)."*
- **Mensajes clave:** "Conocemos a tu mascota como nadie" · "Nos anticipamos para que nunca le falte nada" · "Cuidamos mejor porque conocemos mejor". Tagline candidato: *"Cuidamos a quien más quieres."*

## 9. Arquitectura (marca + técnica)

- **De marca:** ver §8.
- **Técnica:** frontend Next.js (App Router) + TypeScript; backend e-commerce headless **Medusa.js v2 (decidido, D21)** con módulos custom para el moat; PostgreSQL + Redis; buscador Meilisearch/Algolia; pagos Webpay/MercadoPago/Khipu; despacho Blue Express/Starken/Chilexpress; boleta SII (LibreDTE/Bsale). **Principio rector (D21): e-commerce primero.** Detalle en ARCHITECTURE.md.

## 10. Paleta

✅ **Confirmada (D11)** con escalas 50–900 y tokens. Terracota `#C2603F` (primario/acción) · Pino `#2F5D50` (secundario/confianza) · Miel `#E5A23C` (acento/anticipación) · Arena `#FAF6F0` (fondo) · Carbón `#2A2722` (texto) + neutros y estados semánticos. Detalle en DESIGN_SYSTEM.md §3.

## 11. Tipografía

✅ **Confirmada (D11).** Fraunces (display/emoción) + Hanken Grotesk (UI/cuerpo/precios con tabular-nums). Escala completa con tokens. Detalle en DESIGN_SYSTEM.md §4.

## 12. UX

✅ Fase 2 completa. Detalle en UX.md.
- **Principios:** mobile-first; navegación por necesidad (especie → necesidad → etapa, no por marca); **perfil de mascota como núcleo**; home y catálogo personalizados; anticipación visible; despacho honesto en la ficha; checkout de 1 pantalla; fricción cero.
- **Lógica del moat (UX):** el Perfil de Mascota (peso, edad, condición, alimento actual) alimenta nudges de recompra ("le quedan ~5 días"), transición de fórmula por etapa, cross-sell de farmacia y "lo de siempre" en 1 clic.
- **Journeys clave:** (A) primera compra con suscripción, (B) recompra anticipada en 1 clic, (C) cross-sell farmacia, (D) alta/gestión de perfil de mascota.
- **Páginas núcleo:** Home, PLP (listado), PDP (ficha), Perfil de Mascota, Carrito, Checkout.

## 13. Diseño

✅ Sistema visual completo (D9·D10·D11). Detalle en DESIGN_SYSTEM.md.
- **Dirección (D9):** cálido pero preciso · personal, no genérico · anticipatorio · premium-accesible · distintivo en CL (huir del rojo retail). Lo visual debe *probar* que la marca conoce y se anticipa.
- **Incluye:** logo "huella-manada", paleta con escalas 50–900 + tokens semánticos, sistema tipográfico, iconografía (línea, trazo 1.75px, base Lucide), dirección fotográfica (mascotas reales, luz cálida, foco selectivo), ilustración (flat orgánica), composición (aire, una jerarquía por vista), grid (12 col, máx 1280) + espaciado (base 4/ritmo 8pt) + radios + sombras cálidas, motion anticipatorio (150/250/400ms, ease-out), componentes base y ejemplos de UI.
- **Implementación:** Tailwind v4 CSS-first (`@theme`) + Radix UI re-estilizado a la marca. Tokens vivos en `apps/web/src/app/globals.css` (D13; ruta actualizada por D20); copia original en `prototype/assets/styles.css`.

## 14. Stack

- **Estructura del repo (D20):** monorepo pnpm workspaces — `apps/web` (frontend) · `apps/backend` (backend) · `packages/shared` solo cuando exista el primer contrato compartido aprobado en `API.md`. **Reglas arquitectónicas permanentes en `ARCHITECTURE.md §2`** (frontend sin lógica de negocio ni DB; backend solo en `apps/backend`; comunicación solo vía `API.md`).
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (re-estilizado).
- **Backend:** ✅ **Medusa.js v2 (D21)** en `apps/backend`, **construido y verificado** (D22–D28) — core commerce + Admin incluido; el moat se construye como módulos custom (primer módulo real: `pet`, D34); pago automático (Mercado Pago) y Webpay como providers, post-infra.
- **Infra:** Vercel (front) + Railway/Fly (backend) + Cloudflare CDN.
- **Analytics:** GA4 + eventos e-commerce + PostHog/Hotjar.

## 15. Base de datos

✅ MVP implementado y verificado, Medusa-native: catálogo (D23), cuentas (D26), envío (D28) y **Perfil de Mascota** — la entidad crítica del moat — como módulo custom `pet` (D34/D35). Detalle en DATABASE.md §5–§8. Post-tracción: suscripción como entidad y motor de anticipación completo.

## 16. Decisiones tomadas

Ver `DECISIONS.md` para la bitácora completa con rationale. Resumen LOCKED:

| # | Decisión |
|---|---|
| D1 | Modelo: tienda completa (alimento + accesorios + farmacia) + suscripción |
| D2 | Stack: custom headless Next.js |
| D3 | Nombre de trabajo: Manada (cerrado por D8) |
| D4 | Territorio de marca: Amor como alma sobre moat defendible |
| D5 | Concepto rector: C1 "Te conoce como nadie y se anticipa" |
| D6 | Arquitectura de marca: Conocimiento → Anticipación → Amor |
| D7 | Documentación: sistema /ai-context (multi-archivo temático) |
| D8 | Nombre definitivo: **Manada** · dominio oficial `tumanada.cl` |
| D9 | Dirección visual: cálido pero preciso, personal y anticipatorio |
| D10 | Logo: imagotipo "huella-manada" (logotipo + isotipo) |
| D11 | Sistema visual de marca completo confirmado (paleta, tipografía, iconos, foto, motion, tokens) |
| D12 | Fase 2: de prototipo HTML a sistema de componentes Next.js (plan) — *ejecutado por D13/D15* |
| D13 | Fase 3 · Etapa 1 — Fundaciones del frontend Next.js en `web/` (Next 16 + React 19 + Tailwind v4 CSS-first + Radix) |
| D14 | Fase 3 — Auditoría UI/UX → backlog priorizado `AUDIT_UI_UX.md` (fuente de verdad de mejoras FE) |
| D15 | Fase 3 · Etapa 2 — Component Library construida (~70 componentes) + styleguide `/dev/components` |
| D16 | Fase 3 · Etapa 3.3B — New User Experience & Activation Flow + modelo de sesión (Landing→onboarding→recomendación→registro→checkout→bienvenida) — *revisado y cerrado por D17* |
| D17 | Fase 3 · Cierre Etapa 3.3 — revisión visual aplicada + modelo **"e-commerce como piso, perfil como camino destacado"** (tienda anónima navegable, checkout de invitado, gate honesto de suscripción, registro valor-primero post-compra) |
| D18 | Fase 3.4 · Polish lote 1 (track no-fotográfico) + política de redondeo CLP (piso a múltiplo de $10) |
| D19 | Se adelanta la Fase 4 (Arquitectura técnica); Polish 3.4 restante ⏸ en pausa hasta tener fotos |
| D20 | Fase 4 · Estructura física: monorepo pnpm (`apps/web` + `apps/backend` reservado) + reglas arquitectónicas permanentes (`ARCHITECTURE.md §2`) |
| D21 | Fase 4 · Stack backend: **Medusa.js v2** + principio de producto "e-commerce primero" (moat como módulos custom, sin fork del core) |
| D22 | Fase 4→5 · Mandato **MVP-first**: alternativa manual por defecto; backend Medusa arrancado + checkout→orden real con pago manual |
| D23 | Fase 5 · Etapa 2 — Catálogo Medusa-native (backend = fuente de verdad; `subscription_price` calculado; catálogo administrable sin código) |
| D24 | Fase 5 · Etapa 3 — Carrito real + checkout → **orden real** con pago manual (todo nativo) |
| D25 | Fase 5 · Auditoría de MVP + plan de cierre del flujo propio en 2 etapas (cuentas SÍ, moat diferido) |
| D26 | Fase 5 · Etapa A — **Cuentas y sesión reales** (auth nativo Medusa: registro/login/logout/recuperación + JWT persistente, `transferCart`, pedidos, direcciones) |
| D27 | Fase 5 · Infra — Frontend desplegado en **Vercel** (staging sin backend; monorepo verificado; `main`=prod provisional) → `DEPLOYMENT.md` |
| D28 | Fase 5 · Etapa B — **Tienda coherente y honesta** (buscador real, cross-sell real, regla única de envío del backend + promoción automática de envío gratis, auditoría de copy) → **flujo propio del MVP cerrado** |
| D29 | Fase 5 · Endurecimiento pre-lanzamiento (7 correcciones de bajo riesgo; suscripción atenuada `SUBSCRIPTIONS_ENABLED=false` → compra única) |
| D30 | **Infraestructura de producción EN VIVO** (2026-07-16) — backend Medusa en **Railway** (Postgres+Redis+volumen de archivos, build nativo, `PORT=9000`, secrets/CORS reales) + frontend en **Vercel** con dominio **`tumanada.cl`** (SSL) + seed de prod (6 productos, publishable key, promo envío gratis) + admin + **tracking GTM/GA4 en vivo**. Cierra la deuda de infra de D25/D27/D29 → `DEPLOYMENT.md` |
| D31 | Paridad logueado/no-logueado — `CategoryTiles` compartido + principio 9 de la Component Library |
| D32 | Funnel F4 — recomendación consultiva "El plan de {mascota}" (sobre estado local) |
| D33 | Integración O5 — funnel sobre catálogo real; muere `lib/data/catalog`; demo solo hero/styleguide |
| D34 | Backend — módulo custom `pet`: perfil de mascota persistido (`/store/pets`) + hidratación del provider |
| D35 | Backend — subscriber `order.placed`: anticipación anclada a la compra confirmada |
| D36 | Frontend — `ProductImage`: URL real del Admin vs emoji placeholder |
| D37 | Pet Experience B5 — edición real del perfil (`PetEditDialog` → PATCH persistido) |
| D38 | Consistencia perfil↔onboarding — salud con chips curados; regla "todo dato estructurado se edita con el patrón del funnel" |
| D39 | Comprar ≠ definir qué come — PDP e-commerce pura + toast-puente 1-tap + `FoodSelectorDialog` |
| D40 | Meta — refactorización documental por ownership (estado con dueño único; reglas anti-deuda) |
| D41 | Product Completion Pass — B4 foto (andamio local honesto) + B7 /cuenta manada-first + anticipación honesta ("Pedir de nuevo") + simplificación MVP (sin "Otro"/Marcas/Ofertas ni promesas de suscripción) |
| D42 | Home logueada = centro de control de la mascota — PetStatusCard (retrato + estado + línea de tiempo del saco + "Plan de {nombre}" con espacio reservado a suscripción) + recompra en dos taps + necesidades (PetActionGrid) + catálogo al final |
| D43 | Motor de recomendación defendible — cálculo nutricional RER/MER + densidad calórica (`kcal_per_kg`), puertas duras (nunca recomienda incompatible) vs. score de preferencia configurable, explicación verificada (sin afirmaciones no comprobadas). Determinístico, sin IA. Owner: `RECOMMENDATION_ENGINE.md` |
| D44 | Funnel F4 rediseñado — "carta de plan": el cierre del onboarding **decide, no persuade**. Desktop en 2 columnas que convierte altura en ancho; razones on-demand (disclosure "¿Por qué esta?"); anticipación comprimida con su lugar reservado a suscripción; **"ya come otra marca" = buscador inteligente** que rearma y GUARDA el plan (misma anticipación, sin empujar el cambio de marca). Solo presentación: sin tocar backend ni la tesis de `FUNNEL_TARGET §1.5` |
| D45 | Emails transaccionales — **Notification Module nativo de Medusa + provider Resend** (`apps/backend/src/modules/resend`) con un **sistema de plantillas React Email reutilizable** (layout + componentes comunes + registro central; branding Manada, responsive, `formatCLP`). 4 emails críticos cableados a eventos nativos: bienvenida (`customer.created`/`has_account`), reset (`auth.password_reset`), compra (`order.placed`), envío (`shipment.created`). Sin `RESEND_API_KEY` → modo DEV (loguea, no envía). Suscripción diferida (sin eventos aún). Cero cambios en frontend |
| D46 | SEO técnico + tracking del embudo — **GTM como único punto de integración**. SEO nativo Next: `robots.ts`, `sitemap.ts` (catálogo real, degrada con gracia), `opengraph-image` dinámico (OG/Twitter en todo el sitio), metadata + canonical en PDP/PLP, `noindex` en confirmación. Tracking: capa única `apps/web/src/lib/analytics` que empuja al `dataLayer` los **6 hitos del embudo** (`onboarding_start`, `recommendation_shown`, `add_to_cart`, `begin_checkout`, `purchase`, `subscription`) con esquema `ecommerce` de GA4; el código nunca habla con GA4/Meta/Ads (se conectan dentro de GTM). Env `NEXT_PUBLIC_GTM_ID`; sin ID no carga (dev limpio). Solo `apps/web` |
| D47 | Backoffice — Sección **Pets** en el Admin (explorador read-only: DataTable + admin API) + graduación de la relación Customer↔Pet a **Module Link nativo** (`defineLink` 1→N; se elimina la columna plana `customer_id`; drop prod-safe con 0 mascotas). Solo backend/admin; contrato `/store/pets` intacto |
| D48 | Storefront PDP multi-formato — **selector de variantes real** conectado al catálogo: `ProductVariant` + `variants` en el dominio (mapea todas las variantes, orden por precio), componente `VariantSelector` (solo con >1 variante; agotada = deshabilitada) y **ficha rediseñada al boceto** (nombre → descripción real → selector → cápsulas ración/duración → Compra única; la variante elegida deriva precio/$-kg/duración/`variantId`). Default en la variante primaria (formato recomendado). Suscripción sigue apagada (D29). Solo `apps/web`, sin tocar carrito/checkout/backend |
| D49 | Resend **EN VIVO** en producción — dominio `tumanada.cl` verificado + `RESEND_FROM=Manada <contacto@tumanada.cl>` (nombre visible del remitente) + `STOREFRONT_URL` al apex; cierra el pendiente de D45 (Vercel solo aporta DNS; el envío corre en Railway). Además, **CTA del email de bienvenida → `/cuenta/mascotas`**: la personalización "según la cuenta" vive en **tiempo de clic** (la web adapta: perfil vs. crear), no en el envío —en el funnel valor-primero la mascota aún no existe cuando se dispara `customer.created`. Solo config + `apps/backend` |
| D50 | Backoffice — Widget **"Formatos"** en la ficha de producto del Admin (`product.details.after`) + endpoint `POST /admin/products/:id/formats`: crear variantes/formatos **en un paso** (encapsula el flujo opción→valor→variante de Medusa v2 y **reemplaza la "Default variant"**); helper reutilizable `add-format.ts`, validación zod, ruta autenticada por Medusa. No reemplaza el editor nativo (casos multi-opción los rechaza con mensaje claro). Probado en local (7/7), pendiente deploy. Solo `apps/backend` |
| D51 | Storefront — cards **multi-formato** ("Varios formatos · desde" el más barato), **stock en cards solo como urgencia** (≤5 "¡Quedan X!" / 0 "Agotado", nada con stock normal), **"precio por kilo" reubicado** de tile suelta a **precio unitario** bajo el precio + **empujón "rinde más"** clickeable al formato de mejor $/kg, y **devoluciones honestas** (fuera "garantía de sabor"; nota "los alimentos abiertos no pueden devolverse"). Nota: las cards se diseñaron para packshots **PNG transparentes** (sobre Arena) → **revisado por D52**. Solo `apps/web` |
| D52 | Storefront — **packshots normalizados server-side**: route `/api/packshot` con `jimp` (JS puro; `sharp` no cargaba en la función serverless de Vercel) (aplana sobre blanco + recorta borde + re-encuadra a un cuadrado con margen uniforme, producto ~88 %) + `ProductImage` graduado a `next/image` con **loader custom**; pozos de media **en blanco**, sin padding por card. Encuadre y escala **consistentes** para asset **blanco o transparente** sin editar cada asset (reusable para todo producto futuro de Medusa); JPEG cacheado, `srcset` responsive, cero CLS. **Reemplaza** el "fix por asset" de D51 y cierra el render de la política de imágenes de D18. Solo `apps/web` (+dep `jimp`) |
| D53 | SEO & Tracking — **Meta Pixel** `1437594504862107` conectado **dentro de GTM** (honra D46: **sin código**, sin env var —`NEXT_PUBLIC_META_PIXEL_ID` no se usa) vía **import de contenedor** (Combinar, GA4 intacto): pixel base + `PageView` en All Pages + 4 tags de conversión (Custom HTML) que traducen el `dataLayer` ecommerce a eventos estándar de Meta —`add_to_cart→AddToCart`, `begin_checkout→InitiateCheckout`, `purchase→Purchase`, `recommendation_shown→ViewContent`. Completa el pendiente Meta de D46/D30. Artefacto: `ai-context/assets/gtm-meta-pixel-container.json`. Sin `apps/*` |

## 17. Pendientes

Ver `CURRENT_STATE.md` (frentes abiertos) y `TODO.md` (detalle táctico). **Operativos de marca (no bloquean):** registrar `tumanada.cl` + handles, verificar marca en INAPI, vectorizar logo.

## 18. Roadmap

Ver `ROADMAP.md` (fases 0–8 y su estado).

## 19. Prompts importantes

Ver `PROMPTS.md` (prompts operativos vivos; los de fases cerradas están en `history/07`).
