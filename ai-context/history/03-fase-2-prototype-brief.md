# PROTOTYPE_BRIEF — Manada · Brief autocontenido para el prototipo HTML

> **🗄️ ARCHIVADO (2026-06-29).** Este brief cumplió su función: el prototipo HTML (`/prototype`, 6 páginas) ya se construyó (Fase 2 ✅) y el frontend real vive en `web/`. Se conserva como referencia histórica. Las fuentes de verdad vivas son `BRANDING.md`, `DESIGN_SYSTEM.md`, `UX.md` y `COMPONENT_LIBRARY.md`; la voz/copy de referencia está en el propio `/prototype`.
>
> **Documento autosuficiente.** Contiene todo lo necesario para construir el frontend del prototipo HTML estático **sin leer ningún otro archivo**. Si algo no está aquí, decidir con criterio profesional alineado al espíritu del documento.
>
> *Generado: 2026-06-27 · Cierre de Fase 1, apertura del desarrollo de prototipo (Fase 2). · Archivado: 2026-06-29.*

---

## 1. Objetivo del producto

**Manada** es un e-commerce de mascotas en Chile (alimento + accesorios + farmacia) cuyo motor de negocio es la **suscripción inteligente** (recompra recurrente de alimento = mayor LTV).

**Concepto rector (lo que TODO debe probar):**
> **"Manada te conoce como nadie y se anticipa a lo que tu mascota necesita."**

**Diferenciador:** no es una tienda más; opera la vida alimentaria y el bienestar de la mascota. El **Perfil de Mascota** (dato propietario que se acumula) es el moat: permite personalizar y **anticiparse** (avisar antes de que se acabe la comida, sugerir la fórmula por etapa, recordar la desparasitación).

**Objetivo del prototipo:** demostrar, en HTML estático navegable y con la marca 100% aplicada, la experiencia completa de compra y el diferenciador (personalización + anticipación + suscripción + despacho honesto). Público: pet parents urbanos 25-45, mobile-first, que odian la fricción.

**Qué debe sentirse:** cálido pero preciso, personal (no genérico), un paso adelante, premium-accesible. **Qué evitar:** frialdad de catálogo, rojo de retail genérico, sobrecarga promocional.

---

## 2. Identidad de marca

- **Nombre:** **Manada** (nombre visible siempre "Manada"). Dominio: `tumanada.cl`.
- **Personalidad:** Cuidador + Sabio. Una veterinaria cercana de ~35 años que recuerda el nombre de tu perro y se adelanta a lo que necesita.
- **Arquitectura de marca:** 🧠 Conocimiento (moat) → ⚡ Anticipación (producto) → 💛 Amor (marca).
- **Logo — imagotipo "huella-manada":** una huella cuyos 4 dedos/almohadillas son **siluetas agrupadas** (perro + gato + dos miembros) = doble lectura huella + manada. En el prototipo puede representarse con un SVG simple de huella (4 dedos + almohadilla, esquinas redondeadas) en Terracota o Carbón; junto a la palabra "Manada" en la tipografía display. Isotipo reutilizable para favicon/avatar.
- **Voz y copy (usar en toda la UI):**
  - Tuteo chileno cálido. Habla de la mascota por su nombre. Beneficio antes que característica. Frases cortas. Emojis con moderación (🐾 🐶 🐱).
  - ✅ *"A Toby le quedan ~5 días de comida. ¿La reagendamos para que no le falte?"*
  - ❌ *"Recordatorio de recompra programada (24-48 hrs hábiles)."*
  - Mensajes: "Conocemos a tu mascota como nadie" · "Nos anticipamos para que nunca le falte nada". Tagline: *"Cuidamos a quien más quieres."*
- **Mascota demo para el prototipo:** usuario "Carlos", perro **"Toby"** (adulto, 8 kg, RM/Ñuñoa). Usar estos datos de forma consistente en todas las pantallas para mostrar la personalización.

---

## 3. Sistema visual (tokens completos)

> Ya implementados en `prototype/assets/styles.css` como CSS variables y clases. Aquí van completos por autosuficiencia.

### 3.1 Color — escalas 50→900
**Terracota (primario / acción):** `50 #FBF0EB · 100 #F5DAD0 · 200 #EBB6A4 · 300 #E0917A · 400 #D1755A · 500 #C2603F · 600 #A54E31 · 700 #843E27 · 800 #632F1E · 900 #421F14`
**Pino (secundario / confianza):** `50 #ECF3F1 · 100 #CFE0DB · 200 #9FC1B7 · 300 #6FA293 · 400 #4A7E6F · 500 #2F5D50 · 600 #264B41 · 700 #1D3933 · 800 #142824 · 900 #0B1614`
**Miel (acento / anticipación):** `50 #FDF6EA · 100 #FBEACB · 200 #F6D596 · 300 #EFBE61 · 400 #EAAE47 · 500 #E5A23C · 600 #C9852A · 700 #A0681F · 800 #774D18 · 900 #4E3210`
**Neutros cálidos:** `0 #FFFFFF · 50 #FAF6F0 (Arena) · 100 #F0EAE1 · 200 #E0D8CC · 300 #C4BAAB · 400 #9E9486 · 500 #7A7064 · 600 #5A5249 · 700 #403A33 · 800 #2A2722 (Carbón) · 900 #1A1814`

### 3.2 Color — semánticos
| Rol | Valor |
|---|---|
| `bg.canvas` | #FAF6F0 (Arena — fondo base, nunca blanco puro) |
| `bg.surface` | #FFFFFF (cards/inputs/modales) |
| `bg.subtle` | #F0EAE1 · `bg.muted` #E0D8CC · `bg.inverse` #2A2722 |
| `bg.brand-soft` | #FBF0EB (Terracota 50) · `bg.accent-soft` #FDF6EA (Miel 50) |
| `text.primary` | #2A2722 · `text.secondary` #5A5249 · `text.muted` #7A7064 · `text.inverse` #FFFFFF · `text.brand` #A54E31 |
| `border.default` | #E0D8CC · `border.strong` #C4BAAB · `border.focus` #C2603F |
| Éxito | soft #E7F2EC · base #3C8C5A · strong #256B42 |
| Anticipación/Suscripción | soft #FDF6EA · base #E5A23C · strong #A0681F |
| Urgencia | soft #FBEDDD · base #D98324 · strong #9A5A12 |
| Info | soft #E7F0F4 · base #3B7A9E · strong #255A78 |
| Error | soft #F9E5E3 · base #C0392B · strong #8E2A20 |

**Reglas de color:** un acento por vista (Terracota = acción principal; Miel = anticipación/suscripción). Terracota NO es rojo de oferta (precios rebajados = tachado en secondary + actual en primary). Pino aporta confianza, nunca es botón primario. Texto sobre Miel = Carbón, nunca blanco. Fondo por defecto Arena.

### 3.3 Tipografía
- **Familias:** **Fraunces** (serif, display/emoción) + **Hanken Grotesk** (sans, UI/cuerpo/precios). Cargar de Google Fonts. Fallbacks: `Fraunces, Georgia, serif` / `"Hanken Grotesk", system-ui, sans-serif`.
- **Escala (móvil → desktop · interlínea):**
  | Estilo | Fuente/peso | Tamaño | LH |
  |---|---|---|---|
  | display-xl | Fraunces 600 | 40→60 | 1.05 |
  | display-l | Fraunces 600 | 33→48 | 1.08 |
  | h1 | Fraunces 600 | 28→40 | 1.15 |
  | h2 | Fraunces 500 | 24→32 | 1.2 |
  | h3 | Fraunces 500 | 20→24 | 1.25 |
  | h4 | Hanken 600 | 18→20 | 1.3 |
  | body-l | Hanken 400 | 18 | 1.55 |
  | body-m | Hanken 400 | 16 | 1.55 |
  | body-s | Hanken 400 | 14 | 1.5 |
  | caption | Hanken 500 | 13 | 1.4 |
  | overline | Hanken 600 | 12 · UPPERCASE · +6% tracking | 1.3 |
  | price | Hanken 700 · tabular-nums | 16–24 | 1.2 |
- **Reglas:** Fraunces solo para títulos/emoción (nunca párrafos ni datos). Datos/precios/forms → Hanken con `tabular-nums`. Línea de cuerpo 60–75 caracteres. Énfasis = peso, no cursiva. El **nombre de la mascota** se trata como acento (Fraunces 500, color brand) cuando es héroe.

### 3.4 Espaciado, radios, sombras, grid
- **Espaciado** (base 4px, ritmo 8pt): `0 2 4 8 12 16 20 24 32 40 48 64 80 96 128`. Padding card 24 · gap cards 16–24 · sección 64–96 desktop / 40–48 móvil.
- **Radios:** sm 8 · md 12 · lg 16 · xl 24 · pill 999. Botones pill o md · cards lg · inputs md · sheets/modales xl · imágenes producto lg.
- **Sombras (cálidas, base Carbón, suaves):** xs `0 1 2 rgba(42,39,34,.06)` · sm `0 2 8 .08` · md `0 8 24 .10` · lg `0 16 48 .12`. Cards reposo sm → hover md. Nunca sombras negras/duras.
- **Grid:** contenedor máx **1280px** (contenido ~1200). Márgenes 16 (móvil) / 24 (tablet) / 32 (desktop). Columnas 4→8→12. Gutter 16→24.

### 3.5 Iconografía, foto, ilustración
- **Iconos:** línea, trazo **1.75px** en grid 24px, terminaciones redondeadas (base Lucide rounded). Tamaños 16/20/24/32. Two-tone (relleno `miel.100`) para íconos de anticipación (suscripción, recordatorio, perfil). En el prototipo se pueden usar inline SVG de Lucide o emojis como stand-in (🛒 🔍 🐾 🚚), priorizando SVG en producción.
- **Fotografía:** mascotas reales en hogares reales, luz cálida, foco selectivo, grade cálido. En el prototipo: placeholders cálidos (degradados Arena/Miel/Terracota con emoji de mascota/producto), nunca blanco frío de catálogo.
- **Ilustración:** flat con detalle de línea, formas orgánicas, paleta de marca. Para estados vacíos, onboarding y confirmaciones.

---

## 4. Componentes UI (specs)

| Componente | Spec |
|---|---|
| **Button primary** | `bg terracota.500`, texto blanco, radius pill, padding 12×24; hover `terracota.600` + shadow md + translateY(-1px); active scale .98. |
| **Button secondary** | borde `terracota.500`, texto `terracota.600`, fondo transparente; hover `terracota.50`. |
| **Button ghost** | texto primario; hover `bg.subtle`. |
| **Button subscribe (acento)** | `bg miel.500`, texto Carbón, ícono suscripción; hover `miel.600`. |
| **Input/Select** | `bg.surface`, borde `border.default`, radius md; foco anillo `border.focus` 2px (+ glow `terracota.100`); label caption; estado error usa color error. |
| **Badge/Chip** | radius pill, caption 600. Variantes por estado (suscripción = accent-soft / miel.700; éxito; urgencia; info). |
| **Chip de filtro** | borde default, fondo surface; activo = borde terracota + bg.brand-soft + texto brand. |
| **Card** | `bg.surface`, borde default, radius lg, shadow sm, padding 24; hover shadow md. |
| **Product Card** | media cuadrada (packshot sobre Arena) con badge de suscripción arriba-izq → marca (overline) → nombre (h4) → rating (body-s) → precio (price + tachado) → **bloque despacho honesto** (info) → acciones: [Agregar] (primary) + [◍ Sub] (subscribe). |
| **Pet Selector** | chip con avatar circular + nombre (Fraunces 500). Activo: borde terracota + bg.brand-soft. Vive en el header y es global. |
| **Anticipation Capsule** | bg.brand-soft, radius xl, padding 24; eyebrow (overline "PARA TOBY 🐾") + título (Fraunces) + texto + acciones; entra con slide+fade + un pulso Miel (no loop). |
| **Honest Shipping Block** | ícono info + texto de fecha/costo real, color info; reutilizable en PDP, product card, carrito, checkout; SIEMPRE visible. |
| **Subscription box (PDP)** | borde miel.400, bg.accent-soft, radius lg; muestra ahorro y frecuencia editable. |
| **Toggle** | switch; "on" = Miel. |
| **Cart Drawer** | sheet lateral, radius xl, shadow lg; líneas de producto + barra "agrega $X para envío gratis" + totales + CTA. |
| **Checkout Stepper** | 1 pantalla, pasos numerados (círculo Pino, hechos en verde éxito); resumen sticky siempre visible. |
| **Footer** | fondo Carbón (bg.inverse), enlaces, logo en blanco, columnas. |
| **Bottom nav (móvil)** | fija inferior: Inicio · Comprar · Buscar · Mascotas · Carrito; activo en color brand. |

---

## 5. UX

- **Principios:** mobile-first; navegación por necesidad (especie → necesidad → etapa, **no** por marca); perfil de mascota como núcleo; home y catálogo personalizados; anticipación visible; despacho honesto en la ficha; checkout de 1 pantalla; fricción cero; transparencia ("¿por qué te lo recomendamos?").
- **Lógica de personalización/anticipación (mostrar en el prototipo como contenido estático):**
  - Peso + ración + alimento actual → días restantes → cápsula de recompra ("a Toby le quedan ~5 días").
  - Edad/etapa → sugerir transición de fórmula.
  - Especie + edad + RM → cross-sell farmacia ("¿ya desparasitaste a Toby?").
  - Historial → "Lo de siempre" en 1 clic; bundles "para la manada de Toby".
- **Journeys clave:**
  - **A. Primera compra con suscripción:** PDP → precio + despacho honesto sin login → "Suscríbete y ahorra 15%" → mini-onboarding (¿para qué mascota?) → frecuencia auto-calculada → checkout 1 pantalla → confirmación + se crea perfil de Toby.
  - **B. Recompra anticipada:** recordatorio → 1 clic "Lo de siempre" → confirma/reagenda.
  - **C. Cross-sell farmacia:** desde perfil/home → farmacia filtrada y compatible.
  - **D. Alta/gestión de perfil de mascota:** formulario progresivo y cálido; cada dato desbloquea una mejora visible.

---

## 6. Arquitectura de navegación

```
HOME (personalizado por mascota)
├── Comprar por mascota → Perro · Gato · Otros
├── Alimento → seco · húmedo · medicado · por edad/raza/tamaño · por condición
├── Accesorios → camas · juguetes · platos · paseo · higiene · transporte
├── Farmacia 🔒 → antiparasitarios · suplementos · dental (con disclaimers)
├── Marcas
├── Suscripciones / Mi recompra
└── Ofertas

MI CUENTA → Mis mascotas ⭐ · Mis suscripciones · Pedidos · Direcciones · Pagos · Boletas SII
```
- **Header (desktop):** logo · buscador prominente (centro) · selector de mascota · cuenta · carrito. Debajo: barra de navegación por necesidad. Mega-menú "Comprar" en columnas especie → necesidad → etapa.
- **Móvil:** barra inferior fija (Inicio · Comprar · Buscar · Mascotas · Carrito); menú en sheet.
- **Filtros PLP:** Especie · Etapa · Tamaño/raza · Condición · Marca · Formato/peso · Precio · Suscribible · Despacho rápido.

---

## 7. Páginas que se construirán (6 + soporte)

> Todas con header + footer (desktop) y bottom nav (móvil). Navegables entre sí.

1. **Home (`index.html`)** — saludo personalizado (Fraunces) + **cápsula de anticipación** ("A Toby le quedan ~5 días" con [Reagendar][Ver suscripción]) + accesos rápidos (Lo de siempre · Por mascota · Farmacia · Ofertas) + carrusel "Para la manada de Toby" + bloque educativo + grid de categorías por necesidad. (Variante visitante: hero de marca con foto + propuesta de valor + CTA crear perfil.)
2. **PLP / Listado (`plp.html`)** — breadcrumb + banner "Filtrado para Toby (adulto, 8kg)" + chips de filtro rápido + ordenar + sidebar de filtros (desktop) / sheet (móvil) + grid de product cards (2→3→4 col).
3. **PDP / Ficha (`pdp.html`)** — galería (7 col desktop) + info (5 col): marca (overline) → nombre (h1 Fraunces) → rating → precio → **subscription box** (ahorro + frecuencia editable) → selector "¿para qué mascota?" → **despacho honesto** → CTAs [Agregar]+[Suscribir] (sticky en móvil) → tabs (Descripción/Ingredientes/Opiniones) → cross-sell "Para la manada de Toby".
4. **Perfil de Mascota (`mascota.html`)** — avatar grande + nombre (Fraunces) + especie/edad + tarjetas editables (Peso · Etapa · Esterilización · Condiciones · Alimento actual) + barra de completitud ("lo que sabemos nos deja cuidarlo mejor") + acciones (Ver suscripción · Historial · Recordatorios). Campos vacíos = invitación cálida con su beneficio.
5. **Carrito (`carrito.html`)** — líneas de producto (con badge suscripción) + barra "agrega $X para envío gratis" + totales (subtotal/despacho real/total) + [Ir a pagar] + cross-sell suave. (Puede mostrarse también como drawer.)
6. **Checkout (`checkout.html`)** — 1 pantalla: resumen sticky + pasos (1 Identificación · 2 Despacho con fecha/costo real · 3 Pago Webpay/MercadoPago/Khipu · 4 ¿Convertir en suscripción? toggle con ahorro) + [Pagar] full width + señales de confianza (boleta SII, devoluciones, seguridad).

**Soporte (opcional si alcanza):** confirmación de pedido, resultados de búsqueda (overlay), login/registro con onboarding de mascota.

---

## 8. Reglas de interacción

- **Selector de mascota global:** cambiarlo re-personaliza toda la UI (en el prototipo, puede simularse con un estado visual; el contenido "para Toby" es el caso por defecto).
- **Anticipación:** se ofrece, nunca se impone; siempre editable y con "por qué te lo decimos".
- **Despacho honesto** visible en PDP, product card, carrito y checkout (mismo componente).
- **Suscripción** presentada como decisión natural y ventajosa (ahorro %), nunca como letra chica; frecuencia siempre editable.
- **Un CTA primario por vista** (Terracota). Miel solo para anticipación/suscripción.
- **Precios:** rebaja = precio actual (primary) + anterior tachado (secondary); nunca rojo de oferta.
- **Feedback:** botones con press/hover; agregar al carrito incrementa el contador; estados vacíos con ilustración + CTA; loaders con skeletons cálidos.
- **Transparencia:** "¿por qué te lo recomendamos?" accesible en cada sugerencia.

---

## 9. Principios de responsive

- **Mobile-first** (diseñar móvil primero, escalar a desktop).
- **Breakpoints:** `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.
- **Grid de catálogo:** 2 col (móvil) → 3 (tablet ≥768) → 4 (desktop ≥1024).
- **Navegación:** bottom nav fija en móvil; header con navbar en ≥1024. Buscador visible desde ≥768.
- **PDP:** 1 columna apilada en móvil (CTA sticky abajo) → 2 columnas (7/5) en ≥900.
- **PLP:** filtros en sheet inferior (móvil) → sidebar izq (≥1024).
- **Checkout:** resumen arriba (móvil) → columna sticky lateral (desktop).
- **Áreas táctiles ≥ 44×44px.** Contenedor máx 1280px centrado.

---

## 10. Motion

- **Propósito:** anticipatorio, nunca decorativo (comunica que la marca se adelanta).
- **Duraciones:** micro 150ms · estándar 250ms · overlays 400ms.
- **Easing:** entrada/estándar `cubic-bezier(0.2,0.8,0.2,1)` · salida `cubic-bezier(0.4,0,1,1)`.
- **Microinteracciones:** botón press `scale .98`, hover eleva sombra + translateY(-1px); add-to-cart vuela al carrito + bounce del contador; cápsula de anticipación entra con slide+fade y **un** pulso Miel (no loop); loaders = skeletons con shimmer cálido; éxito = check que se dibuja; selector de mascota = cross-fade + stagger del contenido.
- **Respetar `prefers-reduced-motion`:** desactivar parallax/auto-motion, mantener fades cortos.

---

## 11. Accesibilidad

- **WCAG AA** desde el día 1. Contraste texto normal ≥ 4.5:1, grande ≥ 3:1.
- Texto sobre Miel = Carbón (no blanco).
- **Foco visible** (anillo `border.focus` 2px) en todo elemento interactivo. HTML semántico (`header/nav/main/section/footer`, headings en orden, `button`/`a` correctos, `label` en inputs, `alt` en imágenes).
- No comunicar solo por color (íconos + texto en estados). Áreas táctiles ≥ 44×44. Soporte teclado. `prefers-reduced-motion` respetado.

---

## 12. Requisitos técnicos para el prototipo HTML

- **Tipo:** sitio **estático**, sin build, abrible con doble clic (file://) o cualquier server estático. Prioridad: que funcione offline salvo fuentes.
- **Stack:** HTML5 semántico + CSS3 (sin framework JS obligatorio). JS vanilla mínimo solo para interacciones de demo (toggle suscripción, tabs, abrir/cerrar drawer/sheet, contador de carrito). **No** Tailwind CDN ni dependencias de red (frágil offline).
- **Estructura de archivos (ya iniciada):**
  ```
  prototype/
  ├── index.html        (Home)
  ├── plp.html
  ├── pdp.html
  ├── mascota.html
  ├── carrito.html
  ├── checkout.html
  └── assets/
      ├── styles.css    ← YA CREADO: todos los tokens + componentes de §3 y §4
      └── app.js        (a crear: interacciones de demo)
  ```
- **`assets/styles.css` ya existe** e implementa los tokens (colores, tipografía, espaciado, radios, sombras) y clases de componentes (`.btn`, `.product`, `.capsule`, `.ship`, `.card`, `.chip`, `.header`, `.footer`, `.botnav`, etc.). **Reutilizarlo**, no reinventarlo; extenderlo si falta algo.
- **Fuentes:** Google Fonts vía `<link>` — Fraunces (`wght` 400..600, `opsz`) + Hanken Grotesk (400..700). Fallback a serif/sans si no hay red.
- **Iconos:** inline SVG (Lucide) o emojis como stand-in.
- **Imágenes:** placeholders cálidos por CSS (degradados de marca + emoji); no depender de servicios externos.
- **Contenido:** copy en la voz de Manada y datos demo consistentes (usuario Carlos, perro Toby, adulto 8kg, Ñuñoa). Productos de ejemplo realistas (marcas tipo Royal Canin, formatos en kg, precios CLP con separador de miles).
- **Navegación:** enlaces reales entre las 6 páginas; header/footer/bottom-nav replicados en cada una (sin sistema de includes, duplicar markup es aceptable en estático).
- **Calidad:** responsive real (probar 360px, 768px, 1280px), AA de contraste, foco visible, `prefers-reduced-motion`. Marca aplicada al 100% (nada de estilos por defecto del navegador).

---

### Resumen para arrancar
Construir 6 páginas HTML estáticas navegables (`index/plp/pdp/mascota/carrito/checkout`) reutilizando `prototype/assets/styles.css`, con la marca Manada aplicada, mobile-first, copy en la voz de marca, mostrando personalización y anticipación con la mascota demo "Toby". Sin build, sin dependencias de red (salvo fuentes), AA de accesibilidad, motion anticipatorio sutil. Todo lo necesario está en este documento.
