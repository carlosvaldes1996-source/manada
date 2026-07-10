# Fotos lifestyle de Manada

El front tiene todos los slots montados y apunta a estos nombres exactos.
Si un archivo falta, el slot degrada a un color de marca de respaldo (no rompe
la página). **Estado: los 15 archivos están colocados.**

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

## Regenerar / re-recortar

Si vuelves a recibir un grid de íconos 2×2 o un composite apilado de banners,
el script `apps/web/scripts/split-fotos.mjs` los recorta (lee de `_raw/`). Para
imágenes individuales basta con guardarlas con el nombre final de las tablas de
arriba (JPG, ancho ~2000px).
