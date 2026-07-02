# DATABASE — Modelo de datos

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Modelo de datos: entidades, relaciones, y el diseño del moat (Perfil de Mascota). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | ⬜ Borrador — se completa en Fase 4. |
> | **Last Updated** | 2026-06-29 |
> | **Depends On** | ARCHITECTURE.md, UX.md (§3 personalización) |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ del *modelo de datos* (cuando madure en Fase 4). |

> *Estado: ⬜ Pendiente (Fase 4). Borrador conceptual abajo.*

## 1. Entidad crítica: PERFIL DE MASCOTA (el moat)
El activo que se compone con el tiempo. Debe diseñarse para enriquecerse con cada interacción.

Campos preliminares:
- `id`, `owner_id`, `nombre`, `especie`, `raza`, `fecha_nacimiento` (→ edad/etapa), `peso`, `condiciones` (alergias, enfermedades), `nivel_actividad`, `preferencias` (sabores, texturas), `comuna`.
- Derivados: etapa de vida (cachorro/adulto/senior), frecuencia de consumo estimada, próximas necesidades anticipadas.

## 2. Entidades core (borrador)
- `usuario` (1—N) `mascota`
- `producto` (variantes, marca, categoría, etapa de vida objetivo)
- `suscripcion` (mascota, producto, frecuencia, próxima_fecha, descuento)
- `orden` / `linea_orden`
- `direccion`
- `boleta` (folio SII)
- `evento_mascota` (timeline: cambios de etapa, recordatorios de salud)

## 3. Principio de diseño
Modelar para **anticipación**: la DB no solo registra compras, sino que permite predecir cuándo se acaba el alimento y qué necesitará la mascota a futuro.

## 4. Pendientes
- Esquema completo + relaciones + índices.
- Modelo del motor de frecuencia de recompra.
- Política de datos/privacidad (Ley 19.628 CL).
