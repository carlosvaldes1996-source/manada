# Fotos lifestyle de Manada

El front tiene todos los slots montados y apunta a estos nombres exactos.
Si un archivo falta, el slot degrada a un color de marca de respaldo (no rompe
la página). **Estado: los archivos lifestyle están colocados; ver "Pendientes"
más abajo (packshots de producto = el hueco crítico).**

Todas las fotos son generadas con IA (ChatGPT), optimizadas a JPG (calidad 82,
mozjpeg) al ancho útil de cada slot. Fuentes originales en el scratchpad de la
sesión; si hay que regenerarlas, ver los prompts en el chat.

## Fotos individuales

| Archivo               | Dónde se usa                                   | Contenido |
|-----------------------|------------------------------------------------|-----------|
| `hero.jpg`            | Home · hero (con tarjeta de anticipación flotante) | Mujer + golden retriever en el living, espacio negativo a la derecha |
| `promesa-noche.jpg`   | Home · sección oscura "La promesa"             | Perro durmiendo de noche junto a su plato lleno |
| `como-funciona.jpg`   | Home · banda de "Cómo funciona"                | Persona fotografiando a su gato al atardecer |
| `login-manana.jpg`    | `/ingresar` · panel lateral                    | Mujer en pijama alimentando a su gato ("Hola de nuevo") |
| `nosotros-hogar.jpg`  | `/nosotros` · "Por qué existimos"              | Perro comiendo su alimento en casa |
| `nosotros-peso.jpg`   | `/nosotros` · "Cómo lo hacemos"                | Persona registrando el peso de su gato con el teléfono |

## Banners de categoría (`/categoria/[slug]`)

Uno por categoría; se eligen por slug en `category-view.tsx` (`BANNER_BY_SLUG`).

| Archivo               | Categoría   | Contenido |
|-----------------------|-------------|-----------|
| `cat-alimento.jpg`    | alimento    | Golden retriever comiendo de su bol en una cocina cálida |
| `cat-perro.jpg`       | perro       | Border collie corriendo en el parque al atardecer |
| `cat-gato.jpg`        | gato        | Gato naranja sentado en la ventana con luz cálida |
| `cat-farmacia.jpg`    | farmacia    | Veterinaria auscultando a un perro |
| `cat-accesorios.jpg`  | accesorios  | Correa, pechera de cuero y juguetes sobre lino |
| `cat-higiene.jpg`     | higiene     | Perro envuelto en toalla tras el baño |

## Íconos de categoría (Home · "Todo en un lugar")

Grid de 4; se arman por slug en el componente compartido `CategoryTiles`
(`components/commerce/category-tiles.tsx` → `icono-${c.slug}.jpg`), usado tanto
por la landing anónima como por el dashboard con sesión.
Se recortaron de un grid 2×2 generado por IA.

| Archivo                 | Categoría   | Contenido |
|-------------------------|-------------|-----------|
| `icono-alimento.jpg`    | alimento    | Plato de croquetas |
| `icono-accesorios.jpg`  | accesorios  | Pelota de juguete + correa de cuero |
| `icono-farmacia.jpg`    | farmacia    | Aplicación de pipeta antiparasitaria a un gato |
| `icono-higiene.jpg`     | higiene     | Cachorro en el baño con espuma |

## 📋 Pendientes (inventario Product Completion Pass · 2026-07-12)

Huecos fotográficos que suben percepción de calidad, en orden de impacto.
Regla: cada foto tiene un propósito; nada "porque sí".

### P1 · Packshots de producto — CRÍTICO (el mayor hueco visual de la app)

- **Pantalla:** TODAS las superficies comerciales — vitrina de la landing, PLP,
  PDP (galería), carrito, rieles ("Lo de siempre", cross-sell), historial de
  pedidos. Hoy los 6 productos reales muestran **emoji placeholder**.
- **Ubicación:** NO va en esta carpeta — se sube como `thumbnail`/`images` de
  cada producto en el **Admin de Medusa** (el front ya lo consume solo:
  `map-product.ts` prefiere thumbnail → images → emoji).
- **Objetivo:** que la tienda deje de verse prototipo donde ocurre la compra.
- **Cómo producirlos (por integridad de marca, NO todos son IA):**
  - **Marcas reales (Hill's k/d · Acana Puppy · Royal Canin Razas Pequeñas ·
    Pro Plan Adulto · NexGard 4–10 kg):** usar el packshot **oficial** del
    fabricante/distribuidor (press kit o imagen del proveedor). Generarlos con
    IA inventaría el diseño del envase de una marca ajena — no hacerlo.
  - **Marca propia (Manada — Cama Ortopédica Acolchada):** sí es generable.
    Prompt: *"Product packshot photography of a plush orthopedic dog bed,
    oatmeal-beige quilted fabric with terracotta piping, photographed on a warm
    off-white seamless background (#FAF7F2), soft diffused studio light from the
    left, gentle drop shadow, slightly elevated 3/4 angle, square 1:1, no
    props, no text, editorial e-commerce style, photorealistic."*
- **Especificación común:** cuadrado ≥1200×1200, fondo neutro cálido
  consistente entre todos (los packshots conviven en grillas), JPG q82.

### P2 · Banner de `/categoria/todo` — la puerta principal de la tienda

- **Pantalla / ubicación:** PLP "Todo el catálogo" (destino de "Explorar la
  tienda"). Único slug de entrada frecuente **sin** banner (`BANNER_BY_SLUG`).
- **Archivo:** `cat-todo.jpg` (+ entrada `todo: "cat-todo.jpg"` en
  `category-view.tsx`).
- **Objetivo/emoción:** abundancia ordenada, "aquí está todo lo suyo";
  tranquilidad doméstica, no supermercado.
- **Composición/orientación:** panorámica 21:6 (recorte desde 16:9, sujeto
  alto). Estante o despensa de casa cálida con productos de mascota ordenados
  (sacos, juguetes, frascos sin marca legible); un perro y un gato conviviendo
  en el borde de cuadro; luz de mañana lateral; paleta terracota/miel/crema.
- **Prompt:** *"Warm editorial lifestyle photo, wide panoramic crop: a cozy
  Chilean home pantry shelf neatly stocked with unbranded pet supplies (kraft
  food bags, jars of treats, folded leash, toys), a golden dog and an orange
  tabby cat sitting together at the side looking up expectantly, soft morning
  side light, terracotta and honey color palette, shallow depth of field,
  photorealistic, no visible brand logos, no text, 16:9."*

### P3 · `/bienvenida` — celebración con rostro (opcional, deleite)

- **Pantalla/ubicación:** hero de la bienvenida post-compra (hoy: 🎉 sobre
  círculo). Con B4, la mascota real ya aparece en el pill de perfil — el slot
  de foto genérica es **opcional**; si se hace:
- **Objetivo/emoción:** cerrar el loop "tu pedido va en camino" con alegría.
- **Reutilización:** puede reutilizar `promesa-noche.jpg` girada a positivo…
  no: mejor dedicada. Composición: perro recibiendo una caja de cartón en la
  puerta de casa, cola en movimiento, dueño en cuadro parcial; 4:3.
- **Prompt:** *"Joyful lifestyle photo: a happy medium-sized dog greeting a
  cardboard delivery box at a warm home entryway, owner's hands partially in
  frame opening the box, golden hour light, terracotta and cream tones,
  candid, photorealistic, no logos, 4:3."*

### Diferido (no hacer aún)

- Banners de `ofertas`/`marcas`/etapas (`cachorro`/`adulto`/`senior`): rutas de
  cola larga; esperar tráfico real post-lanzamiento.
- Fotos para estados vacíos: el estándar del DS (§7/§12.5) es emoji cálido —
  consistente y suficiente.

## Regenerar / re-recortar

Si vuelves a recibir un grid de íconos 2×2 o un composite apilado de banners,
el script `apps/web/scripts/split-fotos.mjs` los recorta (lee de `_raw/`). Para
imágenes individuales basta con guardarlas con el nombre final de las tablas de
arriba (JPG, ancho ~2000px).
