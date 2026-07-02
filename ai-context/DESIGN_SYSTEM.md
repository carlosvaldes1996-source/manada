# DESIGN SYSTEM — Manada · Brand & Visual Design System

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Sistema visual: dirección, paleta, tipografía, iconografía, grid, motion, tokens y specs de componentes base. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | ✅ Fase 1 confirmada (D9·D10·D11). Tokens implementados en `web/` (D13). |
> | **Last Updated** | 2026-06-29 |
> | **Depends On** | BRANDING.md |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ de *tokens y reglas visuales*. La implementación viva está en `web/src/app/globals.css`. |

> *Estado: ✅ Fase 1 confirmada (D9·D10·D11, 2026-06-27).* Documento operativo: listo para construir el producto.
> Concepto rector que todo esto debe probar: **"Manada te conoce como nadie y se anticipa a lo que tu mascota necesita."**

---

## 1. Dirección visual — ✅ CONFIRMADA (D9)

**Principio raíz:** lo visual debe *probar* que Manada conoce y se anticipa. Verse cálido es copiable; la diferenciación está en que el diseño se sienta **atento, personal y un paso adelante**.

### Traducción de los pilares de marca a lo visual
| Pilar | Sensación | Manifestación visual |
|---|---|---|
| 🧠 Conocimiento (moat) | "me tienen fichado, para bien" | Datos de tu mascota como protagonistas (perfil, foto real, nombre). Precisión, orden, claridad. |
| ⚡ Anticipación (producto) | "se adelantó por mí" | Motion sutil y proactivo, badges "le quedan ~5 días", micro-animaciones que guían. |
| 💛 Amor (marca) | "lo hizo alguien que quiere a los animales" | Foto real de mascotas, calidez cromática, formas orgánicas, mucho aire. |

### Atributos (regla de oro)
Cálido pero preciso · Personal, no genérico · Anticipatorio · Premium-accesible · Distintivo en CL (huir del rojo genérico).

### Do / Don't
- ✅ Foto real · aire generoso · esquinas suaves · jerarquía clara · el nombre de la mascota como héroe.
- ❌ Stock frío · rojo saturado de retail · sobrecarga promocional · íconos infantiles · estética "de catálogo".

---

## 2. Logo y sistema de marca — ✅ (D10)

**Tipo:** imagotipo = **logotipo** ("Manada", serif cálido base Fraunces, peso 500-600) + **isotipo** "huella-manada".

**Isotipo "huella-manada":** huella cuyos 4 dedos/almohadillas son **siluetas agrupadas** (perro + gato + dos miembros) → doble lectura: huella (mascota) + grupo (pertenencia). Espacio negativo trabajado, almohadilla central orgánica, geometría limpia y cálida.

**Versiones (sistema):**
1. Lockup horizontal (isotipo + palabra) — header/web principal.
2. Lockup apilado — formatos verticales, packaging.
3. Isotipo solo — app icon, favicon, avatar de redes.
4. Monocromo positivo/negativo + una tinta — boleta, bordado, fondos.

**Reglas de uso:**
- Área de resguardo = altura de la "M" alrededor del lockup.
- Tamaño mínimo isotipo ~24 px (favicon) sin perder doble lectura; logotipo mínimo ~96 px de ancho.
- Color por defecto: isotipo en Terracota o Carbón sobre Arena; versión negativa (Arena/blanco) sobre Carbón/Pino.
- ❌ No deformar, rotar, contornear, aplicar sombra dura ni degradados ruidosos al logo.

> Ejecución vector (bocetos → digitalización) pendiente; concepto y spec cerrados.

---

## 3. Paleta de color — ✅ (D11)

Sistema con escalas 50–900. Token = `color.{familia}.{paso}`. La marca es **cálida y terrosa**; el rojo retail genérico queda explícitamente fuera.

### 3.1 Marca

**Terracota — primario / acción** (`color.terracota.*`) — botones primarios, links de acción, marca.
| 50 | 100 | 200 | 300 | 400 | **500** | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `#FBF0EB` | `#F5DAD0` | `#EBB6A4` | `#E0917A` | `#D1755A` | `#C2603F` | `#A54E31` | `#843E27` | `#632F1E` | `#421F14` |

**Pino — secundario / confianza-estructura** (`color.pino.*`) — headers de sección, estados informativos sobrios, superficies de confianza, footer.
| 50 | 100 | 200 | 300 | 400 | **500** | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `#ECF3F1` | `#CFE0DB` | `#9FC1B7` | `#6FA293` | `#4A7E6F` | `#2F5D50` | `#264B41` | `#1D3933` | `#142824` | `#0B1614` |

**Miel — acento / anticipación** (`color.miel.*`) — highlights, badges de suscripción y de "anticipación", destacados, estados activos. Es el color con el que la marca "se adelanta".
| 50 | 100 | 200 | 300 | 400 | **500** | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `#FDF6EA` | `#FBEACB` | `#F6D596` | `#EFBE61` | `#EAAE47` | `#E5A23C` | `#C9852A` | `#A0681F` | `#774D18` | `#4E3210` |

### 3.2 Neutros cálidos (`color.neutral.*`) — texto, bordes, superficies grises
| 0 | 50 (Arena) | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 (Carbón) | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| `#FFFFFF` | `#FAF6F0` | `#F0EAE1` | `#E0D8CC` | `#C4BAAB` | `#9E9486` | `#7A7064` | `#5A5249` | `#403A33` | `#2A2722` | `#1A1814` |

### 3.3 Fondos y superficies (semánticos)
| Token | Valor | Uso |
|---|---|---|
| `bg.canvas` | `neutral.50` (#FAF6F0 Arena) | Fondo base de toda la app. |
| `bg.surface` | `#FFFFFF` | Cards, modales, inputs. |
| `bg.subtle` | `neutral.100` (#F0EAE1) | Secciones alternas, hovers de fila. |
| `bg.muted` | `neutral.200` (#E0D8CC) | Skeletons, divisores rellenos. |
| `bg.inverse` | `neutral.800` (#2A2722) | Footer, banners de alto contraste. |
| `bg.brand-soft` | `terracota.50` | Zonas de marca suaves (hero, promos cálidas). |
| `bg.accent-soft` | `miel.50` | Cápsulas de suscripción/anticipación. |

### 3.4 Texto y borde
| Token | Valor | Uso |
|---|---|---|
| `text.primary` | `neutral.800` | Cuerpo y títulos. |
| `text.secondary` | `neutral.600` | Texto de apoyo, metadatos. |
| `text.muted` | `neutral.500` | Placeholders, captions. |
| `text.inverse` | `neutral.0` | Sobre fondos oscuros/marca. |
| `text.brand` | `terracota.600` | Links y énfasis de acción. |
| `border.default` | `neutral.200` | Bordes de card/input. |
| `border.strong` | `neutral.300` | Hover/active de inputs. |
| `border.focus` | `terracota.500` | Anillo de foco (a11y). |

### 3.5 Estados semánticos (cada uno con `soft`/`base`/`strong`)
| Estado | soft (fondo) | base | strong (texto) | Uso |
|---|---|---|---|---|
| Éxito | `#E7F2EC` | `#3C8C5A` | `#256B42` | Pago ok, stock, confirmaciones. |
| Anticipación/Suscripción | `miel.50` | `miel.500` | `miel.700` | "Suscríbete y ahorra", "le quedan ~5 días". |
| Urgencia | `#FBEDDD` | `#D98324` | `#9A5A12` | Stock bajo, "llega justo a tiempo". |
| Info | `#E7F0F4` | `#3B7A9E` | `#255A78` | Tips, despacho, ayuda. |
| Error | `#F9E5E3` | `#C0392B` | `#8E2A20` | Validaciones, fallos de pago. |

### 3.6 Reglas de uso de color
- **Un acento por vista:** Terracota manda la acción principal; Miel resalta la anticipación/suscripción. No competir ambos por la misma jerarquía.
- **Terracota ≠ rojo de oferta.** No usar Terracota saturado para descuentos masivos; los precios rebajados usan `text.secondary` tachado + precio actual en `text.primary`.
- **Pino aporta confianza**, no acción: nunca botón primario.
- **Contraste:** todo texto cumple WCAG AA (ver §13). Texto sobre Miel siempre Carbón, nunca blanco.
- Fondo por defecto siempre **Arena**, no blanco puro (calidez).

---

## 4. Sistema tipográfico — ✅ (D11)

**Familias:** **Fraunces** (serif cálido, variable) = display/emoción/lo humano · **Hanken Grotesk** (sans humanista) = UI, cuerpo, datos y **precios** (precisión). Fallbacks: `Fraunces, Georgia, serif` / `"Hanken Grotesk", system-ui, sans-serif`.

### 4.1 Escala (base 16px · móvil → desktop)
| Token | Fuente | Peso | Tamaño (móvil → desktop) | Interlínea | Uso |
|---|---|---|---|---|---|
| `display-xl` | Fraunces | 600 | 40 → 60 | 1.05 | Hero principal. |
| `display-l` | Fraunces | 600 | 33 → 48 | 1.08 | Hero secundario, portadas. |
| `h1` | Fraunces | 600 | 28 → 40 | 1.15 | Título de página. |
| `h2` | Fraunces | 500 | 24 → 32 | 1.2 | Sección. |
| `h3` | Fraunces | 500 | 20 → 24 | 1.25 | Subsección, nombre de producto destacado. |
| `h4` | Hanken | 600 | 18 → 20 | 1.3 | Títulos de card, labels fuertes. |
| `body-l` | Hanken | 400 | 18 | 1.55 | Texto introductorio. |
| `body-m` | Hanken | 400 | 16 | 1.55 | Cuerpo por defecto. |
| `body-s` | Hanken | 400 | 14 | 1.5 | Metadatos, ayuda. |
| `caption` | Hanken | 500 | 13 | 1.4 | Etiquetas, fechas. |
| `overline` | Hanken | 600 | 12 | 1.3 · +6% tracking · UPPERCASE | Eyebrows, categorías. |
| `price` | Hanken | 700 | 16–24 · tabular-nums | 1.2 | Precios (cifras tabulares alineadas). |

### 4.2 Reglas tipográficas
- **Fraunces solo para títulos/emoción**; nunca para párrafos largos ni datos.
- **Datos, precios, formularios y tablas → Hanken** con `font-variant-numeric: tabular-nums`.
- Largo de línea de cuerpo: 60–75 caracteres.
- Énfasis = peso (500/600), no cursiva (salvo guiños cálidos en Fraunces).
- El **nombre de la mascota** se trata como acento: Fraunces 500, `text.brand` cuando sea héroe.

---

## 5. Iconografía — ✅ (D11)

- **Estilo:** línea, humanista-geométrico (gemelo de Hanken). Trazo **1.75 px** sobre grid de **24 px**, terminaciones y uniones **redondeadas**. Base: **Lucide re-estilizado** (rounded) + set custom para mascota/categoría.
- **Tamaños:** 16 / 20 / 24 (base) / 32. Mantener grosor óptico al escalar.
- **Two-tone para anticipación:** íconos clave (suscripción, recordatorio, perfil de mascota) admiten relleno suave en `miel.100` bajo el trazo → señal visual del pilar Anticipación.
- **Categorías** (perro, gato, otros, farmacia, accesorios) = set custom coherente con el lenguaje del isotipo (siluetas simples, cálidas).
- ❌ No mezclar estilos (relleno sólido + línea), no íconos caricaturescos, no emojis en UI de producto (sí en copy/notificaciones con moderación: 🐾🐶🐱).

---

## 6. Dirección fotográfica — ✅ (D11)

**Principio:** mascotas **reales** en hogares **reales** de Chile. La foto es la principal prueba de Amor.

- **Sujeto:** mascotas reales, a la **altura de sus ojos**, momentos candid (no posados de estudio). Personas presentes como vínculo (manos, regazo), rostro humano secundario.
- **Luz:** natural, cálida, hora dorada / luz de ventana. Sombras suaves.
- **Profundidad:** foco selectivo (sujeto nítido, fondo difuso) → intimidad y premium.
- **Color/treatment:** grade cálido alineado a Arena/Terracota; blancos cremosos, negros marrones (no puros). Saturación contenida.
- **Composición:** aire alrededor del sujeto, regla de tercios, espacio negativo para texto en heroes.
- **Diversidad:** distintas especies, razas, tamaños, edades y hogares chilenos (depto/casa, distintos NSE).
- ❌ Stock genérico frío · fondos blancos de catálogo · imágenes tristes de refugio · HDR saturado · mascotas con ropa ridícula.
- **Producto (packshots):** sobre Arena o superficie cálida, sombra suave, mismo encuadre y escala consistente en todo el catálogo.

---

## 7. Sistema de ilustración — ✅ (D11)

- **Rol:** apoyar, no decorar. Estados vacíos, onboarding, educación (tips de anticipación), confirmaciones, error/404.
- **Estilo:** flat con detalle de línea, **formas orgánicas** que dialogan con el isotipo (curvas de la huella/silueta). Paleta limitada a marca (Terracota/Pino/Miel/Arena) + neutros.
- **Construcción:** geométrica-orgánica, sin contornos pesados, texturas mínimas (grano sutil opcional).
- **Tono:** cálido y optimista, nunca infantil ni cliché.
- ❌ No usar ilustración donde haya foto real disponible del producto/mascota; no mezclar 3D realista.

---

## 8. Principios de composición visual — ✅ (D11)

1. **Aire primero.** El whitespace comunica calma y premium. Densidad solo donde aporta (listados).
2. **Una jerarquía clara por vista.** Un héroe, un CTA primario, un acento.
3. **La mascota/el dato es el protagonista**, no el chrome de la UI.
4. **Asimetría estable:** layouts vivos pero apoyados en un grid y una baseline firmes.
5. **Bloques redondeados y agrupación por cercanía**; tarjetas como unidad base.
6. **Honestidad visible:** información sensible (despacho, stock, precio total) nunca escondida ni en letra chica.

---

## 9. Grid, espaciado y tokens de layout — ✅ (D11)

### 9.1 Espaciado (base 4 px · ritmo 8 pt) — `space.*`
`0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`
Uso por defecto: padding de card 24 · gap entre cards 16–24 · sección vertical 64–96 desktop / 40–48 móvil.

### 9.2 Radios — `radius.*`
| sm | md | lg | xl | pill | full |
|---|---|---|---|---|---|
| 8 | 12 | 16 | 24 | 999 | círculo |
Botones: `pill` (acción) o `md`. Cards: `lg`. Inputs: `md`. Modales/sheets: `xl`. Imágenes de producto: `lg`.

### 9.3 Sombras (cálidas, base Carbón, suaves) — `shadow.*`
| xs | sm | md | lg |
|---|---|---|---|
| `0 1 2 rgba(42,39,34,.06)` | `0 2 8 rgba(42,39,34,.08)` | `0 8 24 rgba(42,39,34,.10)` | `0 16 48 rgba(42,39,34,.12)` |
Cards reposo `sm`, hover `md`; dropdowns/popovers `md`; modales `lg`. Nunca sombras duras/negras.

### 9.4 Grid y breakpoints
- **Contenedor máx:** 1280 px (contenido 1200). Márgenes: 16 (móvil) / 24 (tablet) / 32+ (desktop).
- **Columnas:** 4 (móvil) · 8 (tablet) · 12 (desktop). Gutter 16 → 24.
- **Breakpoints:** `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.
- **Mobile-first** siempre. Grilla de catálogo: 2 cols móvil → 3 tablet → 4 desktop.

---

## 10. Motion y microinteracciones — ✅ (D11)

**Principio:** el motion es **anticipatorio y con propósito**, nunca decorativo. Comunica que la marca se adelanta.

- **Duraciones:** micro 150 ms · estándar 250 ms · grandes/overlays 400 ms.
- **Easing:** entrada/estándar `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease-out suave) · salida `cubic-bezier(0.4, 0, 1, 1)`.
- **Respeto a `prefers-reduced-motion`:** desactivar parallax/auto-motion, mantener fades cortos.

**Microinteracciones clave:**
- Botón: press `scale .98`, hover eleva sombra `sm→md` + leve `translateY(-1px)`.
- Add-to-cart: el producto "vuela" al carrito (250 ms) + contador con pequeño bounce.
- **Anticipación proactiva:** la cápsula "A {nombre} le quedan ~5 días" entra sola con slide+fade suave y un único pulso en Miel (no loop).
- Loaders: skeletons en `bg.muted` con shimmer cálido; nada de spinners fríos donde haya layout.
- Éxito: check que se dibuja (draw) en verde éxito.
- Selector de mascota: transición de avatar con cross-fade; el contenido se re-personaliza con stagger suave.

---

## 11. Componentes base (specs) — ✅ (D11)

Tokens aplicados. Librería: **shadcn/ui re-estilizado** sobre Tailwind.

- **Button**
  - *Primary:* `bg terracota.500` / texto `neutral.0` / `radius.pill` / padding `12×24` / hover `terracota.600` + `shadow.md`.
  - *Secondary:* borde `terracota.500`, texto `terracota.600`, fondo transparente.
  - *Ghost:* texto `text.primary`, hover `bg.subtle`.
  - *Subscribe (acento):* `bg miel.500`, texto `neutral.800`, ícono suscripción two-tone.
- **Input/Select:** `bg.surface`, borde `border.default`, `radius.md`, foco anillo `border.focus` 2px; label `caption`; error con `estado error`.
- **Card:** `bg.surface`, `radius.lg`, `shadow.sm`, padding 24, hover `shadow.md`.
- **Badge/Chip:** `radius.pill`, `caption` 600. Variantes por estado semántico (suscripción = `accent-soft`/`miel.700`).
- **Product Card:** ver §12.
- **Pet Selector:** chip con avatar circular + nombre (Fraunces 500). Activo: borde `terracota.500` + `bg.brand-soft`.
- **Honest Shipping Block:** ícono info + texto claro de fecha/costo real (`info` semántico). Siempre visible en ficha.
- **Checkout Stepper:** 1 pantalla, progreso en Pino; resumen siempre visible.
- **Cart Drawer:** sheet lateral `radius.xl` (lado), `shadow.lg`.
- **Subscription Nudge:** banner/cápsula `accent-soft`, ícono two-tone, CTA Subscribe (ver motion §10).

---

## 12. Ejemplos de aplicación sobre la UI del e-commerce — ✅ (D11)

### 12.1 Product Card (unidad central del catálogo)
```
┌───────────────────────────┐  card: bg.surface · radius.lg · shadow.sm
│   [ packshot sobre Arena ] │  imagen radius.lg, escala consistente
│  ◍ Suscríbete y ahorra 15% │  badge miel (accent-soft) arriba-izq
│                            │
│  Royal Canin               │  overline · text.secondary (marca)
│  Adulto Razas Pequeñas 3kg │  h4 Hanken 600 · text.primary
│  ★ 4.8 (212)               │  body-s · text.secondary
│                            │
│  $24.990   $29.990         │  price Hanken 700 + tachado secondary
│  🚚 Llega mañana a Ñuñoa    │  honest shipping · info, SIEMPRE visible
│  ┌──────────┐  ┌────────┐  │
│  │ Agregar  │  │  ◍ Sub │  │  Primary (Terracota pill) + Subscribe (Miel)
│  └──────────┘  └────────┘  │
└───────────────────────────┘
```

### 12.2 Home — bloque de anticipación (logueado, con mascota)
```
bg.brand-soft, radius.xl, padding 24
  Eyebrow (overline): PARA TOBY 🐾
  H2 (Fraunces): "A Toby le quedan ~5 días de comida"
  body-m: "¿La reagendamos para que no le falte?"
  [ Reagendar entrega ] (Primary)   [ Ver suscripción ] (Secondary)
  → la cápsula entra con slide+fade y un pulso Miel (motion §10)
```

### 12.3 Ficha de producto
Layout 2 col desktop (galería 7 / info 5). Info: marca (overline) → nombre (h1 Fraunces) → precio (price) → selector suscripción (cápsula Miel con ahorro) → **bloque de despacho honesto** → CTA primario sticky en móvil. Tabs: Descripción · Ingredientes · Opiniones. Cross-sell "Para la manada de {nombre}".

### 12.4 Header / navegación
Logo (lockup) izq · buscador central prominente (`bg.subtle`, icon 24) · selector de mascota + carrito der. Mega-menú por **especie → necesidad → etapa** (no por marca). Fondo Arena, borde inferior `border.default`.

### 12.5 Estados
- **Vacío** (carrito/búsqueda): ilustración §7 + copy cálido + CTA.
- **Loading:** skeletons cálidos.
- **Éxito de compra:** check animado + resumen + nudge a suscripción.

---

## 13. Accesibilidad — ✅
WCAG **AA** desde el día 1. Texto normal ≥ 4.5:1, grande ≥ 3:1. Texto sobre Miel = Carbón (no blanco). Foco visible (`border.focus` 2px) en todo elemento interactivo. Áreas táctiles ≥ 44×44. `prefers-reduced-motion` respetado. No comunicar solo por color (íconos + texto en estados).

---

## 14. Pendientes
- [ ] Ejecutar logo en vector (bocetos → digitalización) según BRANDING.md §7.
- [ ] Implementar tokens como tema Tailwind + CSS vars y librería shadcn re-estilizada (Fase 3).
- [ ] Licenciar/auto-hospedar Fraunces y Hanken Grotesk (ambas open source — Google Fonts / GitHub).
- [ ] Banco fotográfico inicial bajo la dirección §6.
