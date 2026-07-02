# UX — Arquitectura de información, journeys, wireframes

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Arquitectura de información, navegación, journeys y wireframes low-fi. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | ✅ Fase 2 completa (IA, journeys, wireframes y prototipo HTML). |
> | **Last Updated** | 2026-06-29 |
> | **Depends On** | BRANDING.md, DESIGN_SYSTEM.md |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ de *IA, journeys y flujos*. Su materialización es FRONTEND_ARCHITECTURE.md + el prototipo. |

> *Estado: ✅ Fase 2 completa. Arquitectura definitiva abajo.* Aplica el sistema visual de DESIGN_SYSTEM.md y prueba el concepto rector: **conoce y se anticipa**.

---

## 1. Principios UX (rectores)
- **Mobile-first** (la mayoría del tráfico CL es móvil).
- **Navegación por necesidad, no por catálogo:** especie → necesidad → etapa de vida (no por marca).
- **Perfil de mascota = núcleo** del producto, no un add-on. Todo se personaliza alrededor de él.
- **Home y catálogo personalizados** según la(s) mascota(s) del usuario.
- **Anticipación visible:** la app siempre muestra "el siguiente paso" antes de que lo pidas (recompra, dosis, etapa).
- **Despacho honesto:** costo y fecha reales en la **ficha**, no recién en el checkout.
- **Checkout de 1 pantalla**, con suscripción como decisión natural en el último paso.
- **Buscador potente:** autocompletar, tolerante a typos, sugerencias por mascota.
- **Fricción cero:** menos pasos, menos campos, defaults inteligentes.

---

## 2. Arquitectura de información (definitiva)

### 2.1 Mapa de navegación
```
HOME (personalizado por mascota)
├── Comprar por mascota → Perro · Gato · Otros (aves, peces, roedores)
├── Alimento → seco · húmedo · medicado · por edad/raza/tamaño · por condición
├── Accesorios → camas · juguetes · platos/comederos · paseo · higiene · transporte
├── Farmacia 🔒 → antiparasitarios · suplementos · cuidado dental (con disclaimers)
├── Marcas (A-Z + destacadas)
├── Suscripciones / Mi recompra
└── Ofertas

MI CUENTA
├── Mis mascotas ⭐ (núcleo del producto)
├── Mis suscripciones (frecuencia, pausa, adelantar/atrasar)
├── Pedidos & seguimiento
├── Direcciones
├── Medios de pago
└── Boletas/facturas (SII)
```

### 2.2 Modelo de navegación
- **Header (desktop):** logo · buscador prominente (centro) · selector de mascota · cuenta · carrito.
- **Mega-menú** disparado por "Comprar": columnas por **especie → necesidad → etapa**, con accesos directos personalizados ("Lo de siempre de Toby").
- **Móvil:** barra inferior fija — Inicio · Comprar · Buscar · Mascotas · Carrito. Menú especie/necesidad en sheet.
- **Buscador:** overlay full con sugerencias, búsquedas recientes, "para {mascota}", y resultados con filtros (especie, edad, marca, precio, suscribible).

### 2.3 Taxonomía de filtros (PLP)
Especie · Etapa (cachorro/adulto/senior) · Tamaño/raza · Condición (esterilizado, sobrepeso, piel sensible, renal…) · Marca · Formato/peso · Precio · Suscribible · Despacho rápido.

---

## 3. Personalización y anticipación (la lógica que materializa el moat)

El **Perfil de Mascota** alimenta todo. Datos mínimos: especie, nombre, foto, fecha nac./edad, raza/tamaño, peso, esterilización, condiciones, alimento actual.

| Dato del perfil | Cómo se anticipa la UI |
|---|---|
| Alimento actual + ración + peso | Calcula consumo → estima días restantes → **nudge de recompra** ("a Toby le quedan ~5 días"). |
| Edad / etapa | Sugiere transición de fórmula (cachorro→adulto→senior) en el momento justo. |
| Especie + edad + RM | Cross-sell farmacia ("¿ya desparasitaste a Toby?"), recordatorios estacionales (pulgas en verano). |
| Historial de compra | "Lo de siempre" en 1 clic; reorden y bundles "para la manada de {nombre}". |
| Condición (ej. renal) | Filtra y prioriza catálogo compatible; oculta lo no apto. |

**Regla UX:** la anticipación se ofrece, nunca se impone. Siempre editable, siempre con "por qué te lo decimos".

---

## 4. Inventario de páginas (Fase 2 → prototipo)
1. **Home** (logueado/personalizado + versión visitante).
2. **PLP** — listado de categoría con filtros.
3. **PDP** — ficha de producto (con despacho honesto + suscripción).
4. **Perfil de Mascota** — alta y edición (núcleo).
5. **Carrito** (drawer + página).
6. **Checkout** (1 pantalla).
7. Soporte: resultados de búsqueda, confirmación de pedido, Mis suscripciones, login/registro con onboarding de mascota.

---

## 5. User journeys clave (detallados)

### A — Primera compra con suscripción (visitante → cliente)
1. Entra por búsqueda/SEO a una **PDP**.
2. Ve precio + **despacho honesto** ("Llega mañana a Ñuñoa · $2.990") sin loguearse.
3. CTA "Agregar" o **"Suscríbete y ahorra 15%"**.
4. Al elegir suscripción → mini-onboarding: "¿Para qué mascota?" (nombre + especie + peso) → **frecuencia auto-calculada** (editable).
5. Carrito → **checkout 1 pantalla** (datos, despacho, pago Webpay).
6. Confirmación + boleta SII + nudge: "Creamos el perfil de {nombre}. Complétalo y cuidamos el resto."
> Objetivo: convertir sin fricción y plantar el perfil de mascota (semilla del moat).

### B — Recompra anticipada (cliente recurrente)
1. Recordatorio proactivo (WhatsApp/email/push): "A Toby le queda ~1 semana de comida."
2. 1 clic → resumen pre-armado ("Lo de siempre") → confirma o reagenda.
3. Despacho agendado. Cero navegación.
> Objetivo: recurrencia sin esfuerzo = LTV.

### C — Cross-sell farmacia (profundizar el cuidado)
1. En Home/perfil: "Perro, 4 años, RM → ¿ya desparasitaste a Toby?".
2. Lleva a Farmacia filtrada y compatible, con disclaimer y dosis por peso.
> Objetivo: ampliar share-of-care, reforzar "te conoce".

### D — Alta/gestión de perfil de mascota (núcleo)
1. Desde onboarding o "Mis mascotas".
2. Formulario progresivo y cálido (no burocrático): foto → básicos → salud (opcional).
3. Cada dato desbloquea una mejora visible ("Con su peso, calculamos su ración ideal").
> Objetivo: que entregar datos se sienta como recibir cuidado, no dar trabajo.

---

## 6. Wireframes — pantallas clave (low-fi specs)

> Lenguaje y tokens: DESIGN_SYSTEM.md. Mobile-first; se describe móvil y nota desktop.

### 6.1 Home (logueado)
```
[ Header: ☰  logo   🔍   🐾Toby▾  🛒 ]
┌─ Saludo personalizado (Fraunces h1) ─────┐
│ "Hola, Carlos 🐾  Cuidemos a Toby."       │
└──────────────────────────────────────────┘
[ CÁPSULA ANTICIPACIÓN (bg.brand-soft) ]
  "A Toby le quedan ~5 días" → [Reagendar][Ver suscripción]
[ Accesos: Lo de siempre · Por mascota · Farmacia · Ofertas ]
[ Carrusel "Para la manada de Toby" → product cards ]
[ Bloque educativo/anticipación: tip estacional ]
[ Categorías por necesidad (grid de íconos) ]
[ Footer ]
```
Visitante: hero de marca (foto real + propuesta de valor) + categorías + prueba social, sin cápsula personalizada (CTA a crear perfil).

### 6.2 PLP (listado)
```
[ Header ] [ Breadcrumb: Perro › Alimento › Seco ]
[ Chips de filtro rápido: Etapa · Suscribible · <$30k ]  [ Ordenar ▾ ]
[ grid 2 col móvil / 4 desktop ]
  ┌ Product Card (ver DESIGN_SYSTEM §12.1) ┐ × N
[ Filtros: sheet inferior móvil / sidebar izq desktop ]
[ Paginación o scroll infinito ]
```
Personalización: banner superior "Filtrado para Toby (adulto, 8kg)" con toggle.

### 6.3 PDP (ficha)
```
[ Galería (foto producto) ]            (desktop: 7 col)
Marca (overline) · Nombre (h1 Fraunces) · ★4.8 (212)
$24.990  ($29.990 tachado)            (price tabular)
┌ Cápsula suscripción (Miel) ───────────┐
│ ◍ Suscríbete y ahorra 15% · cada 4 sem │ (frecuencia editable)
└────────────────────────────────────────┘
[ Selector "¿Para qué mascota?" → Toby / + Nueva ]
┌ DESPACHO HONESTO (info) ──────────────┐
│ 🚚 Llega mañana a Ñuñoa · $2.990       │
└────────────────────────────────────────┘
[ Agregar (Primary) ]  [ Suscribir (Miel) ]   ← sticky móvil
[ Tabs: Descripción · Ingredientes · Opiniones ]
[ Cross-sell "Para la manada de Toby" ]
```

### 6.4 Perfil de Mascota (núcleo)
```
[ Avatar grande + nombre (Fraunces) + especie/edad ]
[ Tarjetas de datos editables: Peso · Etapa · Esterilización · Condiciones · Alimento actual ]
[ "Lo que sabemos nos deja cuidarlo mejor" → barra de completitud ]
[ Acciones: Ver suscripción · Historial · Recordatorios ]
[ Cada campo vacío = invitación cálida con su beneficio ]
```

### 6.5 Carrito (drawer)
```
[ Sheet lateral, radius.xl ]
  Ítem(s): foto · nombre · cantidad · precio · (badge suscripción)
  "Agrega $X para despacho gratis" (progreso)
  Subtotal · Despacho (estimado real) · Total
  [ Ir a pagar (Primary) ]
  Cross-sell suave: "A Toby también le sirve…"
```

### 6.6 Checkout (1 pantalla)
```
[ Resumen siempre visible (sticky lateral desktop / arriba móvil) ]
1) Identificación (email / login / invitado)
2) Despacho: dirección + fecha/franja real + costo
3) Pago: Webpay · MercadoPago · Khipu
4) ¿Convertir en suscripción? (toggle con ahorro) ← decisión natural
[ Pagar (Primary, full width) ]
Confianza: boleta SII, devoluciones, seguridad.
```

---

## 7. Patrones de interacción transversales
- **Selector de mascota global** en header: cambia la personalización de toda la app (cross-fade, §10 motion).
- **Nudges de anticipación** consistentes (cápsula Miel) en Home, PDP, perfil y post-compra.
- **Estados vacíos** con ilustración + CTA (DESIGN_SYSTEM §7).
- **Despacho honesto** como componente reutilizable (PDP, PLP card, carrito, checkout).
- **"Por qué te lo recomendamos"** accesible en cada sugerencia (transparencia = confianza).

---

## 8. Métricas UX a instrumentar (para Fase 4/8)
Conversión por PDP, tasa de creación de perfil de mascota, % pedidos con suscripción, recurrencia/retención, uso de nudges de recompra, completitud de perfil. (GA4 + PostHog, ver PROJECT_MASTER §14.)

---

## 9. Pendientes (Fase 2) — ✅ cerrada
- [ ] Validar IA con card-sorting ligero (opcional, no bloquea).
- [x] **Entregable: prototipo HTML estático** con la marca aplicada (home, PLP, PDP, perfil de mascota, carrito, checkout) → `/prototype`.
- [x] Handoff de wireframes → sistema de componentes (Fase 3): FRONTEND_ARCHITECTURE.md + COMPONENT_LIBRARY.md.
