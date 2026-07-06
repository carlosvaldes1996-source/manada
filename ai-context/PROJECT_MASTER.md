# 🐾 PROJECT MASTER — Manada

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Documento maestro: visión, estrategia y resumen de decisiones del proyecto. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-05 |
> | **Depends On** | DECISIONS.md (fuente), CURRENT_STATE.md, ROADMAP.md |
> | **Supersedes** | `history/PROJECT_MASTER_v0.md` |
> | **Source of Truth** | ✅ de la *visión y estrategia*. El detalle vive en los archivos temáticos. |

> **Documento maestro. Solo decisiones.** Fuente única de verdad del proyecto.
> Crece con cada fase hasta cubrir todo el proyecto. Para detalle de trabajo en curso, ver los archivos temáticos de `/ai-context`.
>
> *Estado: Fases 0–2 ✅ COMPLETAS. **Fase 3 (Frontend) funcionalmente completa** — Etapas 1–3 ✅ (D13/D15/D16/D17) + Polish lote 1 ✅ (D18); el **Polish 3.4 restante ⏸ en pausa** hasta tener fotos (U090). **Fase activa: 4 — Arquitectura técnica (D19)**: validar stack backend, proveedores CL, modelo de datos y API. Ver `CURRENT_STATE.md` y prompt #8 de `PROMPTS.md`.*

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
- **Técnica (decidida a alto nivel):** frontend Next.js (App Router) + TypeScript; backend e-commerce headless (Medusa.js, a validar); PostgreSQL; buscador Meilisearch/Algolia; pagos Webpay/MercadoPago/Khipu; despacho Blue Express/Starken/Chilexpress; boleta SII (LibreDTE/Bsale). Detalle en ARCHITECTURE.md.

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
- **Implementación:** Tailwind v4 CSS-first (`@theme`) + Radix UI re-estilizado a la marca. Tokens vivos en `web/src/app/globals.css` (D13); copia original en `prototype/assets/styles.css`.

## 14. Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (re-estilizado).
- **Backend:** Medusa.js (a validar) con módulo de suscripciones custom.
- **Infra:** Vercel (front) + Railway/Fly (backend) + Cloudflare CDN.
- **Analytics:** GA4 + eventos e-commerce + PostHog/Hotjar.

## 15. Base de datos

⬜ Pendiente (Fase 4). Entidad crítica = **Perfil de Mascota** (el moat). Borrador en DATABASE.md.

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

## 17. Pendientes

Ver `TODO.md`. Estado: Fases 0–2 cerradas; Fase 3 Etapas 1–3 ✅ (pantallas + embudo de activación + revisión visual, D16/D17). **Inmediato:** **Etapa 4 — Polish (Fase 3.4)** según los ítems Fase 3.4 de `AUDIT_UI_UX.md` (+ diferidos U003/U009/U010/U028/U029/U066); los ítems fotográficos dependen de **U090 (fotografía real)**. **Operativos (no bloquean):** registrar `tumanada.cl` + handles, verificar marca en INAPI, vectorizar logo. *(Las fuentes Fraunces/Hanken ya se cargan vía `next/font` en `web/`.)*

## 18. Roadmap

Ver `ROADMAP.md`.
```
✅ Fase 0.1 Estrategia negocio  ✅ Fase 0.2 Benchmarking  ✅ Fase 0.3 Estrategia marca
✅ Fase 1 Identidad de marca    ✅ Fase 2 UX    🔄 Fase 3 Frontend/Design System
⬜ Fase 4 Arquitectura técnica  ⬜ Fase 5 MVP
```

## 19. Prompts importantes

Ver `PROMPTS.md` (incluye prompt de onboarding y prompts reutilizables).
