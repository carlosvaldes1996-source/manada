# RECOMMENDATION_ENGINE — Motor de recomendación nutricional (MVP)

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Dueño único de cómo Manada decide qué alimento recomendar, cuánto debe comer y por qué. Documenta reglas y fórmulas para poder defenderlas frente a clientes, veterinarios e inversionistas. |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-12 |
> | **Depends On** | FUNNEL_TARGET.md (F4), PET_EXPERIENCE_TARGET.md (B6/B8), API.md, DATABASE.md |
> | **Source of Truth** | ✅ del *motor de recomendación y el cálculo nutricional*. La decisión y su rationale viven en DECISIONS.md D43. |

## 0. Principios

- **100 % determinístico y sin IA.** Cada número es reproducible y auditable. La IA no decide nada (podría, más adelante, solo *redactar* una explicación ya calculada).
- **El mismo hecho decide el ranking y sostiene la razón** que ve el dueño. Nada se afirma sin verificarlo (`lib/recommend.ts`, predicados compartidos).
- **Degradación honesta.** Si falta un dato (peso, densidad calórica), el motor entrega lo que puede y lo dice; nunca inventa.

Ubicación del código (puro, en `apps/web`, sin fuente de datos propia — corre sobre el catálogo real de la Store API, O5):
`lib/anticipation.ts` (nutrición) · `lib/recommend.ts` (gate + ranking + razones) · `lib/medusa/map-product.ts` (metadata) · `src/scripts/seed.ts` (datos).

## 1. Datos de entrada

| Dato | Origen | Uso |
|---|---|---|
| Especie | onboarding / perfil | puerta dura + factor MER |
| Etapa (cachorro/adulto/senior) | onboarding / perfil | puerta dura + factor MER + score |
| Peso (kg) + confianza | onboarding (exacto/rango/estimado) | RER/MER; si es estimado, todo se muestra con "~" |
| Esterilización | perfil | modificador MER (−0.2 en adulto/senior) |
| Condiciones de salud | perfil (chips curados, D38) | puerta de contraindicación + score + razón |
| Objetivo de peso | **aún no capturado** (default `mantener`) | modificador MER — soportado, pendiente de UI (§6) |

## 2. Cálculo nutricional (RER/MER — NRC 2006 / WSAVA)

```
RER (kcal/día) = 70 × peso_kg^0.75
MER (kcal/día) = RER × k
ración (g/día) = MER × 1000 / kcal_per_kg   (densidad del alimento)
```

**Factor k** (`MER_BASE` + modificadores aditivos, editable en un solo lugar):

| Especie | Cachorro | Adulto | Senior |
|---|---|---|---|
| Perro | 2.5 | 1.8 | 1.4 |
| Gato | 2.5 | 1.4 | 1.2 |

Modificadores (solo adulto/senior): esterilizado `−0.2` · objetivo bajar `−0.4` / subir `+0.2`. `k` se acota a `[0.8, 5.0]`.

**Ejemplo defendible** — perro 20 kg, adulto, esterilizado, alimento 3.700 kcal/kg:
RER ≈ 662 kcal → k = 1.6 → MER ≈ 1.059 kcal/día → **286 g/día**.
(El modelo plano anterior daba 360 g/día: sobrealimentaba ~26 %.)

Sin producto elegido (onboarding/preview) se usa una densidad de referencia `REFERENCE_KCAL_PER_KG = 3500` y se rotula como estimación. La duración del saco (`estimateRunOut`) se deriva de esta ración → la fecha de recompra deja de ser arbitraria.

## 3. Selección de productos

**Puertas duras (`isEligibleFood`) — reglas obligatorias, excluyen:**
categoría = `alimento` · especie coincide · etapa apropiada (universal o incluye la suya) · **no contraindicado** para ninguna condición de la mascota (`not_for`).
→ Garantía MVP: **nunca se recomienda un alimento incompatible** (antes la etapa era un score blando saltable).

**Score de preferencia (`RANKING_WEIGHTS`) — solo sobre los elegibles:**

| Criterio | Peso |
|---|---|
| Etapa declarada (no universal) | 3 |
| Formulado para su condición (`suitable_conditions`) | 3 |
| En stock | 2 |
| Valoración editorial (desempate) | 1 |

Recomendada = mayor score. Alternativas = siguientes elegibles en stock. Cambiar los pesos ajusta todo el ranking sin tocar lógica.

## 4. Explicación (verificada)

`foodReasons` deriva las razones de los predicados que el motor ejecutó:
1. **Etapa** — "Formulado para {especie} {etapa}" o "Apto para todas las etapas".
2. **Condición** — solo si `suitable_conditions` incluye una condición de la mascota. *(Se eliminó la antigua frase "sin los ingredientes que su condición no tolera": afirmaba seguridad que el código no verificaba.)*
3. **Ración** — cálculo RER/MER real ("~X g/día · Y kcal") o, sin densidad, el requerimiento en kcal; sin peso, invita a completarlo.

## 5. Persistencia

Solo se persiste el **vínculo** mascota→alimento: `current_food_id` + `food_assigned_at` (módulo `pet`, D34/B6). La ración, el plan y las razones se **recalculan en vivo** desde perfil + catálogo; no se guarda un snapshot de la recomendación (ver §6).

## 6. Trabajo futuro (no en este MVP)

- **Objetivo de peso / condición corporal** en el perfil (el motor ya lo soporta; falta captura + persistencia).
- **Score:** `sizeMatch` (fórmula small/large-breed vs tamaño), `weightManagement`, y **valor por 1.000 kcal** (mejor que $/kg porque la densidad varía).
- **Snapshot auditable** de cada recomendación (qué se recomendó y por qué, con fecha) para trazabilidad e iteración.
- **Metadata:** poblar `suitable_conditions` / `not_for` en más productos desde el Admin.
- **Actividad** como modificador MER.

## 7. Metadata de catálogo (mínima)

En `product.metadata` (Admin de Medusa, sin tocar código):

| Clave | Tipo | Nivel | Habilita |
|---|---|---|---|
| `kcal_per_kg` | number | **Obligatorio en alimento** | ración real (RER/MER ÷ densidad) |
| `suitable_conditions` | lista (vocab `PET_CONDITIONS`) | Recomendado | score + razón verificada |
| `not_for` | lista (mismo vocab) | Recomendado | puerta de contraindicación |

Si la bolsa trae kcal/taza, se normaliza a kcal/kg al cargar. Ausencia de `kcal_per_kg` → densidad de referencia (degradación honesta, nunca error).
