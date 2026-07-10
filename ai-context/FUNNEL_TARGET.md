# FUNNEL DE ADQUISICIÓN — Onboarding → Recomendación → Primera Compra · Target Experience + Plan de bloques

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Visión objetivo (target experience) del embudo de adquisición y primera compra (visitante → cliente) + plan de implementación por bloques. Se vuelve aquí durante el desarrollo del funnel. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Fase de diseño cerrada por Carlos (2026-07-10). Implementación por bloques en chats separados: un bloque, una revisión, un commit. **F1–F3 implementados y aprobados (commit `2972f91`); F4 implementado sobre estado local y aprobado (D32, 2026-07-10)** — la **reconexión al catálogo real de Medusa (O5) queda como pasada de integración SEPARADA** (decisión de Carlos: honra la regla de oro "frontend primero, integración aparte"; ver D32 y el Bloque F4 abajo). **F5 (momento de registro) pendiente** (empieza por decisión de producto, §1.6). |
> | **Depends On** | UX.md, DESIGN_SYSTEM.md, COMPONENT_LIBRARY.md, DECISIONS.md, CURRENT_STATE.md |
> | **Alcance** | **Solo decisiones de experiencia de usuario y producto.** La reconexión del frontend con el backend y con productos reales del catálogo es **integración**, ya considerada y documentada en otros lugares del proyecto; **no** se incluye ni se re-documenta aquí. Tampoco toca el perfil logueado ni la navegación (eso es Pet Experience). |
> | **Relación** | Promueve a diseño resuelto las observaciones de UX del funnel **O1–O4** de `PET_EXPERIENCE_TARGET.md · Parte 3`. (O5 = reconexión de datos, fuera de alcance por ser integración; O6 = perfil logueado, es Pet Experience.) |
> | **Source of Truth** | ✅ de la *experiencia objetivo del funnel* y del *orden de implementación*. |

> **Cómo usar este doc.** La **Parte 1** es el diseño: qué debe sentir y ver el usuario, asumiendo que todo persiste y que el producto recomendado ya existe. La **Parte 2** es el plan operativo: bloques pequeños e independientes, **frontend primero** y **backend después**, cada uno en su propio chat. No implementar todo de una vez: se cierra un bloque, se revisa, se itera, y recién ahí el siguiente. **Regla de oro:** un bloque → validado → un commit.

---

## Tesis de diseño

El funnel no vende un saco de comida: vende la sensación de que **"Manada ya conoce a mi mascota antes de que yo haya comprado nada."** Cada paso debe restar esfuerzo y sumar cuidado. Dos principios rectores, heredados de UX.md y BRANDING:

1. **La fricción se pide donde el valor ya se entregó.** Nunca pedir un dato duro (peso) ni una credencial (contraseña) antes de haber dado algo a cambio.
2. **Asesoría, no venta — y no forzar el cambio de marca.** La recomendación acompaña y explica; las **alternativas son igual de válidas** (no de segunda) y el leal a su marca puede **mantenerla** sin perder el plan. La **anticipación es el corazón** de la propuesta: se *propone* (el sistema ya sabe cuándo se acaba), jamás se cobra como peaje. El concepto rector ("te conoce y se anticipa") se prueba *asesorando*, no empujando.

Jerarquía transversal (DESIGN_SYSTEM §8): **un héroe por vista.** En el onboarding el héroe es la mascota tomando forma; en la recomendación, *su plan*; en el carrito/checkout, *su primer pedido*.

---

# PARTE 1 — Target Experience (el diseño)

## 1.1 Flujo objetivo (de punta a punta)

```
LANDING (visitante)
  "te conoce y se anticipa" · CTA "Crear el perfil de tu mascota" · puerta a tienda sin cuenta
        │
        ▼
ONBOARDING  (conversación · núcleo = 5 pasos, el difícil ahora es blando)
  1. Especie
  2. Nombre                ← gancho emocional; todo se personaliza con "Toby"
  3. Raza / Tamaño         ← buscador premium (lista + Mestizo + "no aparece"→manual)
  4. Etapa                 ← cachorro / adulto / senior
  5. Peso  (estimable)     ← pre-estimado desde raza/tamaño · "No sé" válido · editable
     └ opcionales DESPUÉS del momento mágico: esterilización · salud · alimento actual
        │
        ▼
RECOMENDACIÓN = "El plan de Toby"  (consultiva, no transaccional)
  · 3 razones concretas atadas a su perfil ("por qué te lo decimos")
  · Producto recomendado (badge) + "Ver otras opciones (2)"  ← respalda el claim
  · Valor: ración/día · cuántos días dura · fecha de reposición · $/kg
  · "Avísame para reponer" / suscripción = beneficio opt-in (default compra única)
  · CTA "Sumar al pedido de Toby"  +  secundario "Seguir mirando la tienda"
        │
        ▼
CARRITO  ("El primer pedido de Toby")
  · editable · cross-sell suave · barra "agrega $X para envío gratis" · "Ir a pagar"
        │
        ▼
CHECKOUT (1 pantalla · invitado)
  · dirección · despacho · pago  (dónde se pide el correo/cuenta = decisión abierta, §1.6)
        │
        ▼
CONFIRMACIÓN / BIENVENIDA
```

## 1.2 Onboarding — orden y ritmo (resuelve O2 · orden)

**Decisión:** raza **antes** que peso, y los pasos de refinamiento **después** del momento mágico.

- **Núcleo obligatorio (5):** Especie → Nombre → Raza/Tamaño → Etapa → Peso. El nombre queda temprano a propósito: convierte "un formulario" en "una conversación sobre Toby" y personaliza cada pregunta siguiente.
- **Opcionales, tras la recomendación** (en el perfil, cada uno con su beneficio): esterilización, condiciones de salud, alimento actual. Hoy la esterilización ocupa un paso obligatorio en pleno clímax; deja de hacerlo.
- **Etapa, no edad exacta:** cachorro/adulto/senior es lo que la recomendación necesita, con menos fricción. La fecha de nacimiento se ofrece como enriquecimiento opcional (desbloquea el deleite de cumpleaños, post-registro).
- **Progreso honesto:** la barra refleja el núcleo corto ("Paso 3 de 5"); los opcionales no inflan la barra.

## 1.3 Selector de raza premium (resuelve O2 · selector)

**Decisión:** reemplazar el texto libre actual por un **combobox con buscador**.

- **Buscador + listado completo** en un sheet, tolerante a acentos. Listas **separadas perro/gato**.
- **Fijados arriba:** *Mestizo/Quiltro* y las razas más comunes de Chile.
- **Al fondo "No aparece / Otra raza"** → recién ahí se habilita el **ingreso manual** (como hoy).
- **La raza alimenta el peso:** elegir una raza reconocida pre-rellena un rango de peso típico; elegir *Mestizo* o *No aparece* dispara la pregunta de **tamaño** (Toy/Pequeño/Mediano/Grande/Gigante) como proxy.
- **Fuente de datos (MVP):** lista curada local de ~40–60 razas top CL por especie, cada una con `{ nombre, tamaño, pesoRangoAdulto }`. Taxonomía completa y origen backend → posterior.
- **Visual:** trigger "Buscar raza…" con lupa; raza elegida como **Chip con ✕** para cambiarla. Atajo útil, no chore.

## 1.4 Peso estimable — "No sé su peso" (resuelve O1)

**Decisión:** el peso pasa a **no bloqueante siempre**, con estimación.

- **Tres fuentes de peso, con confianza declarada** (`weightSource`):
  - `exacto` — el usuario lo sabe o lo pesó.
  - `rango` — eligió un bucket de tamaño (punto medio como valor).
  - `estimado` — derivado de raza + etapa.
- **El paso ofrece 3 caminos:**
  1. Si hay **raza reconocida** → proponemos el peso típico: *"Los Beagle adultos pesan ~10–12 kg. ¿Lo usamos como estimación?"* → [Sí, ~11 kg] · [Sé el peso exacto →] · [Elegir por tamaño].
  2. Si **Mestizo / no aparece / sin raza** → **buckets de tamaño** con ejemplo y silueta (*"Mediano · 10–25 kg, como un Beagle"*).
  3. Siempre disponible: **"Sé su peso exacto"** (input numérico, como hoy) y **"No sé / que lo estimen"**.
- **Gatos:** rango simple (Pequeño <3,5 · Promedio 3,5–5,5 · Grande >5,5), ya que la raza aporta menos.
- **Honestidad del estimado:** cuando `weightSource ≠ exacto`, la ración y la anticipación se muestran con *"estimado"* en tono suave, más un CTA de un toque **"Ajustar peso"** (perfil editable — Bloque 5 de Pet Experience). Guardamos el flag para nudge posterior: *"Confírmanos el peso de Toby y afinamos cuándo reponer."*
- **Por qué gana:** un "no sé" + buena estimación es más completable **y de mejor calidad de dato** que un número inventado que envenena el cálculo del moat.

## 1.5 Recomendación consultiva — "El plan de Toby" (resuelve O3) · convergido 2026-07-10

**Decisión (refinada con Carlos tras usar el flujo real de F1–F3, 2026-07-10):** la pantalla deja de ser "producto + botón de comprar" y pasa a ser **el plan de la mascota** presentado por un **asesor de confianza, no un vendedor de una sola opción**. El smoke reveló que desde el titular *"Listo, ya sabemos qué darle a Toby"* el usuario volvía a sentirse **atrapado en una sola vía** (solo agregar, suscribir, o salir-y-perder-el-journey). Se corrige dando **una salida honesta a cada intención**.

> **Intenciones del usuario en esta pantalla → su salida.** "Lo quiero" → CTA primario. "Sí, y avísame para reponer" → anticipación propuesta. "Este no me convence" → alternativas + puerta de marca. "Quiero seguir mirando" → navegar sin perder el plan. "No decido ahora" → el plan ya vive en su perfil. Las tres del medio son las que hoy no tienen salida.

### Principio 1 — Asesor, no vendedor: no forzar el cambio de marca
La recomendación es *"la que elegiríamos para Toby según lo que nos contaste"*, **no** *"la única que sirve"*. Muchas personas llevan años con una marca y cambiarla es **fricción real**: Manada no la empuja.
- **Recomendada** con badge *"La que elegiríamos para Toby"* + **3 razones** atadas a su perfil (proteína por etapa · croqueta por talla · sin lo que su condición no tolera). Educación real, no una aseveración.
- **Alternativas igual de válidas** (no de segunda): *"Y no es la única buena opción"* → 2–3 cards inline (no PLP, no comparador pesado), cada una con un *"mejor si…"* (premium / conveniente / por condición). Aunque sean 2, matan la sensación de empuje.
- **Puerta de lealtad de marca:** *"¿Ya le compras una marca que le hace bien? Mantengámosla y nos anticipamos igual."* → Manada aporta el plan y la anticipación **aunque el usuario no cambie de producto**. Baja la barrera del leal a su marca y es asesoría de verdad.

### Principio 2 — La anticipación es el corazón, no un opcional (resuelve la duda de suscripción del smoke)
El sistema ya sabe cuánto dura la bolsa, así que **propone** la reposición; **no** pide una frecuencia en frío.
- *"A Toby le durará ~24 días. Te avisamos alrededor del [fecha] para reponer, sin apuros."* El usuario **solo confirma o ajusta** — nunca calcula. Presentada como **propuesta activa y central**, no como un checkbox pasivo.
- **Límite honesto (compatible con D29):** en el MVP es un **recordatorio inteligente**, no un cobro ni un envío recurrente. La reposición puede cumplirse **manual** mientras se valida el modelo; el copy dice *"te avisamos para reponer de un toque"*, **nunca** *"te lo enviamos solo"*. Al encender el moat (post-validación), el mismo bloque gradúa a **auto-envío con cobro recurrente** con la cadencia ya propuesta.

### Principio 3 — Prueba de valor (se queda)
ración/día · cuántos días dura · fecha de reposición · $/kg. Es el "se anticipa" y es diferenciador.
- **Hedge de peso estimado** si `weightSource ≠ exacto` (F3): *"Estimamos con su peso aproximado; ajústalo y afinamos el plan."*

### Principio 4 — El plan no se guarda: ya es de Toby (resuelve "si salgo, pierdo el journey")
Desde que se creó a Toby, Manada la conoce y **su plan vive en su perfil**. **Sin** botón "guardar", **sin** banner persistente.
- **"Sumar al pedido de Toby"** (primario) · **"Seguir viendo la tienda"** (secundario) — el plan sigue en su perfil, reencontrable cuando quiera.
- **Salir (X) deja de mandar a la landing:** cae en la tienda / su perfil, **jamás descartando el journey**.
- **Recuerdo ambiental:** mientras navega, la experiencia recuerda sutilmente el alimento recomendado (dashboard · perfil · *"recomendado para Toby"* al volver a su PDP), **sin banners ni "guardar"**. *(Cruza con Pet Experience: el plan/`current_food` vive en la mascota — ver dependencias del Bloque F4.)*

**Visual:** un héroe ("El plan de Toby"), un acento (Miel = anticipación). Capas: (a) hero con chips de razones; (b) card recomendada con badge; (c) "otras opciones (2)" + puerta de marca; (d) specs de valor; (e) **anticipación propuesta** (central, confirmar/ajustar); (f) acciones sin trampa. La anticipación pesa como **valor central**, no como caja de suscripción.

> **🎯 Propuesta de valor a validar en el MVP:** *"Manada conoce a mi mascota, sabe cuándo necesitará alimento y me ayuda a no quedarme sin stock."* Toda esta pantalla existe para probar esa hipótesis **con honestidad** (recordatorio + reposición de un toque; logística manual si hace falta) **antes** de invertir en el moat recurrente.

> **🔭 Hipótesis futura (post-validación · NO MVP) — "delegar desde el primer flujo":** un gran win potencial sería permitir que, ya en el primer flujo, alguien **deje su tarjeta y quede como usuario recurrente**, delegando de verdad la responsabilidad de no quedarse sin stock. **No se fuerza ahora** ni se construye la suscripción completa antes de tener señales: romper el journey por adelantar el cobro recurrente sería un error. Si los usuarios confirman, vuelven y aceptan una relación recurrente, se evoluciona **naturalmente** hacia cobro automático + auto-envío como moat. Interactúa con **F5** (momento de cuenta/tarjeta) y con el encendido de `SUBSCRIPTIONS_ENABLED`.

## 1.6 Momento de correo/contraseña (O4 · abierto, se decide en su bloque)

**Estado: hipótesis a evaluar, NO decisión cerrada.** El *problema* sí está claro: hoy hay un **muro de registro** entre recomendación y carrito (el invitado es enviado a `/crear-cuenta` antes de ver el carrito), lo que contradice la compra de invitado ya tomada (D17/D26) y es causa #1 de abandono de checkout (~24% Baymard, citado en DECISIONS). Lo que queda **abierto** es *dónde* reubicar la captura de credenciales.

**Por qué no se cierra aquí.** Mover la cuenta cambia cuándo y cómo se construye la relación con el cliente, con implicancias **mucho más amplias que este funnel**: cuenta, personalización, lifecycle y CRM. Antes de decidir hay que sopesar qué se gana/pierde en cada punto (recuperar carrito, guardar el perfil sin cuenta, cuál es el gatillo real de la cuenta) y alinearlo con la estrategia de lifecycle del producto. Se resuelve en el **Bloque F5**, no aquí.

**Alternativas a comparar en F5:**
1. Registro **antes** de la recomendación (≈ actual, con muro).
2. Registro **post-recomendación / pre-carrito** (muro actual, pero enmarcado como "guardar").
3. Registro **valor-primero post-compra** (hipótesis principal): "Agregar" (invitado) → carrito directo; correo simple en checkout para la orden; cuenta ofrecida en `/bienvenida` con correo prellenado (o magic-link). El perfil de mascota vive en sesión guest hasta entonces.
4. **Diferido** con checkout de invitado (que ya existe), sin empujar cuenta.

> Este documento **no** elige entre estas alternativas: las deja planteadas para decidir con Carlos al abrir F5.

## 1.7 Recorrido recomendación → pago

Para una **primera compra**, el recorrido objetivo es **recomendación → carrito → checkout** (no directo a checkout): el carrito ligero permite revisar/ajustar, muestra el cross-sell (sube AOV) y la barra de envío gratis, y da confianza a un primerizo. El salto directo a checkout se reserva para la **recompra de un toque** ("Lo de siempre", el moat post-MVP), donde la intención es inequívoca. Continuidad emocional: tras "Agregar", micro-confirmación (*"Sumamos [producto] al pedido de Toby"*) y el carrito preserva el contexto de la mascota.

> *Nota de alcance:* que "Agregar" opere sobre un producto realmente comprable es un tema de **integración** (conexión del funnel con productos reales del backend), no de UX; está considerado y documentado fuera de este roadmap. Este documento **asume que el producto recomendado ya existe**.

---

# PARTE 2 — Plan de bloques (implementación)

Cada bloque es pequeño, independiente y se implementa en **su propio chat**. **Frontend primero**; la integración backend se agenda como pasada posterior y nunca se mezcla en el mismo bloque. Todos son **decisiones de experiencia**; ninguno incluye la reconexión con datos reales (integración, fuera de alcance).

### 🔹 Bloque F1 — Reordenar onboarding + opcionales al final (resuelve O2 · orden)
- **UX/UI (frontend):** nuevo orden Especie → Nombre → Raza/Tamaño → Etapa → Peso; mover esterilización/salud/alimento a post-recomendación; barra de progreso sobre el núcleo corto.
- **Modificar:** `comenzar/onboarding-wizard.tsx` (`STEP_IDS`, gating, preview vivo), `FunnelShell` (totalSteps).
- **Dependencias:** ninguna (frontend puro). Habilita F2/F3.
- **Resultado:** momentum correcto; el dato que reduce fricción (raza) llega antes del punto de fricción (peso).

### 🔹 Bloque F2 — Selector de raza premium (resuelve O2 · selector)
- **UX/UI (frontend):** combobox con buscador + lista curada CL (perro/gato) + Mestizo fijado + "No aparece"→manual; raza elegida como Chip.
- **Crear:** data local de razas `{ nombre, especie, tamaño, pesoRangoAdulto }`; componente `BreedCombobox` (reusa primitivas Radix del stack).
- **Modificar:** paso "raza" del wizard.
- **Dependencias:** F1 (orden). Alimenta F3 (estimación de peso).
- **Resultado:** menos esfuerzo, dato estructurado (habilita estimación de peso y tips por raza = profundiza el moat), sensación premium.

### 🔹 Bloque F3 — Peso estimable "No sé su peso" (resuelve O1)
- **UX/UI (frontend):** paso de peso con 3 caminos (estimar por raza · bucket de tamaño · exacto); `weightSource`; hedge "estimado" en ración/anticipación + CTA "Ajustar peso".
- **Modificar:** paso "peso" del wizard; `lib/anticipation`/`lib/recommend` (aceptar peso estimado y confianza); tabla raza→peso (de F2).
- **Dependencias:** F2 (raza) para estimar; buckets de tamaño son independientes.
- **Resultado:** se elimina el único gate duro del onboarding sin perder señal para recomendar.

### 🔹 Bloque F4 — Recomendación consultiva "El plan de {mascota}" (resuelve O3) · ✅ implementado 2026-07-10 (D32, frontend sobre estado local)
- **UX/UI (frontend):** la fuente de verdad del diseño es **§1.5** (léela completa). En síntesis: hero *"El plan de Toby"*; recomendada con badge *"la que elegiríamos"* + 3 razones; **alternativas igual de válidas** (2–3 inline con *"mejor si…"*) + **puerta de lealtad de marca** (*"mantén tu marca y nos anticipamos igual"*); specs de valor + hedge de peso estimado (F3); **anticipación central y PROPUESTA** (confirmar/ajustar, no opt-in en frío) respetando el **límite honesto de D29** (recordatorio, no cobro/envío recurrente); **salidas sin trampa** (sumar · seguir viendo la tienda · Salir que **NO** vuelve a la landing); **el plan no se guarda: vive en el perfil** + recuerdo ambiental.
- **✅ Implementado (D32):** `lib/recommend.ts` (top-N + `foodReasons`/`alternativeAngle`/`pricePerKg`/`STAGE_LABEL`; alternativas etapa-apropiadas; `recommendFood`=`ranked[0]`) y `comenzar/recomendacion/recommendation-view.tsx` (hero "El plan de {mascota}", recomendada con badge + 3 razones, **alternativas con swap-del-plan**, puerta de marca, **anticipación central Confirmar/Ajustar** con copy honesto D29, salidas a `/categoria/todo` y `/cuenta/mascotas` —nunca `/`—). `tsc`+`eslint`+`build` verdes; smoke de boot ✅. **Se quitó `SubscriptionBox`/`useSubscription`** del funnel (muertos con `SUBSCRIPTIONS_ENABLED=false`); la anticipación NO reutiliza `AnticipationCapsule` (esa cápsula es para el perfil logueado / Pet Experience) sino un subcomponente propio de propuesta.
- **Dependencias:**
  - **F3** (calidad del plan) ✅.
  - **✅ O5 / catálogo real — HECHO (2026-07-10, D33):** `lib/recommend` pasó a lógica pura (recibe `products` del caller) y `/comenzar/recomendacion` es un server component que hidrata `listProducts()` (Store API, patrón D23). El producto recomendado tiene **`variantId` real → "Sumar al pedido" llena el carrito real** (muere el artefacto "carrito vacío" de D32). `/bienvenida` también se reconectó: su cápsula se deriva del alimento **realmente asignado** (`currentFoodId` + `petFoodAnticipation`), no de una recomendación re-derivada.
  - **Pet Experience:** con B6 commiteado (`assignFood`, seam único), **el funnel SÍ escribe la asignación al sumar** — `addToOrder()` llama `assignFood()` (la misma API que la PDP; coordinado, no duplicado, D33). El "recuerdo ambiental" completo (PDP *"recomendado para Toby"*, etc.) sigue siendo de Pet Experience B3/B6.
  - **F5:** las salidas y *"Salir no descarta el journey"* se alinean con el momento de cuenta/tarjeta, incl. la **hipótesis futura de tarjeta-en-archivo** (§1.5). En F4 el CTA primario de invitado sigue enrutando a `/crear-cuenta` (el muro que F5 decidirá reubicar).
- **Resultado:** percepción *"me asesoran, respetan mi marca y se anticipan"* en vez de *"me venden una sola opción"*; valida la **propuesta de valor central del MVP**.

### 🔹 Bloque F5 — Momento de registro (O4 · empieza por DECIDIR, no por implementar)
- **Primero: decisión de producto.** Este bloque arranca eligiendo *dónde* pedir correo/contraseña entre las alternativas de §1.6. Tiene implicancias más allá del funnel (cuenta, personalización, lifecycle, CRM), así que **no se implementa hasta acordar la ubicación con Carlos**.
- **UX/UI (frontend), según la decisión:** p. ej. quitar el muro recomendación→registro (guest "Agregar" → carrito); correo como campo simple en checkout; cuenta ofrecida en `/bienvenida`.
- **A sopesar aquí (viene de F4, §1.5):** el principio *"ninguna salida descarta el journey"* (que **Salir deje de volver a la landing**) y la **hipótesis futura de tarjeta-en-archivo / usuario recurrente desde el primer flujo** — gran win potencial, pero **no se fuerza en el MVP**: primero se valida la propuesta de valor central, después se evoluciona al cobro recurrente como moat.
- **Modificar (candidatos):** `recommendation-view.tsx` (navegación del CTA), checkout (campo correo + microcopy), `bienvenida`, `use-auth-actions`/orden del embudo.
- **Dependencias:** independiente. Alinea con D17/D26 (compra de invitado).
- **Resultado:** funnel coherente con la estrategia de cuenta/lifecycle que se defina.

---

## Resumen de dependencias

```
F1 (orden) ─► F2 (raza) ─► F3 (peso estimable) ─► F4 (recomendación consultiva)
F5 (registro) · independiente — empieza por una decisión de producto (§1.6)
```

## Priorización sugerida (a validar con Carlos)

1. **F1 · Reordenar onboarding** — más pequeño, fija el esqueleto.
2. **F2 · Selector de raza premium** — alimenta la estimación de peso.
3. **F3 · Peso estimable** — completa el rediseño del onboarding.
4. **F4 · Recomendación consultiva** — el mayor salto de experiencia.
5. **F5 · Momento de registro** — empieza por decisión de producto; independiente.

> Todos los bloques son **frontend / decisiones de experiencia**. La conexión del funnel con productos reales del backend es integración y vive fuera de este roadmap (ya considerada en el proyecto). F5 arranca por una decisión de producto antes de tocar código.

## Notas de integración (posterior · fuera del diseño de UX)

Cada bloque es **frontend / experiencia**; su integración se agenda aparte y nunca se mezcla en el mismo bloque. Downstream natural de estas decisiones (a coordinar con el resto del proyecto, **no** a diseñar aquí):

- **Persistencia del perfil de mascota** (módulo `pet-profile`, compartido con Pet Experience): el onboarding guarda la mascota real en el cliente.
- **Tabla raza→peso** curada, idealmente en backend/metadata (hoy local en el front para MVP).
- **Anticipación → suscripción real (post-validación · moat):** el **recordatorio propuesto** del F4 (MVP: reposición de un toque, logística que puede ser **manual** mientras se valida) gradúa a **auto-envío con cobro recurrente** usando la cadencia ya propuesta; habilita la **hipótesis de tarjeta-en-archivo desde el primer flujo** (§1.5). No antes de tener señales de que el usuario quiere delegar. Nunca prometer auto-envío en el copy del MVP.
- **Recuerdo ambiental del plan:** persistir el alimento recomendado en la mascota (`current_food`) para reflejarlo en dashboard/perfil/PDP; es el puente natural con **Pet Experience** (no re-diseñar aquí).
- **Correo/cuenta:** según la decisión de registro que se tome en F5.

> **Regla de oro (repetida):** en cada bloque, primero cerramos y revisamos el **frontend** contra el estado local; la integración se agenda como pasada posterior. Un bloque → validado → un commit.
