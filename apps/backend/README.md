# apps/backend — espacio RESERVADO (D20)

> **Estado: ⬜ reservado, sin código.** Esta carpeta existe para fijar la
> arquitectura física del proyecto (D20): el backend de Manada vivirá aquí y
> **solo aquí** — nunca dentro de `apps/web` (ni `web/src/app/api`, ni
> `web/server`, ni variantes).

## Qué va a vivir aquí

La aplicación backend independiente de Manada: **Medusa.js v2 (decidido, D21)** —
core commerce + Admin — extendido con módulos custom `pet-profile` (el moat, D5),
`subscription` (recipe oficial) y `anticipation`, más las integraciones Chile
(Webpay como payment provider custom, courier, boleta SII, WhatsApp Business API).

## Qué falta antes de escribir código

1. ~~Validar el stack~~ → ✅ **Medusa.js v2** (D21; la versión exacta se fija al scaffold).
2. **Proveedores Chile** elegidos (pagos/courier/boleta/WhatsApp) → `ai-context/ARCHITECTURE.md §4`.
3. **Modelo de datos** aprobado → `ai-context/DATABASE.md`.
4. **Contratos API** aprobados → `ai-context/API.md`.

El scaffold de la app elegida se genera **en Fase 5 (MVP)**, dentro de esta
carpeta, con su propio `package.json` (workspace `apps/*`).

## Reglas (resumen de ARCHITECTURE.md § Reglas arquitectónicas)

- `apps/web` nunca contiene lógica de negocio ni acceso directo a la base de datos.
- La comunicación entre `apps/web` y `apps/backend` es **solo** vía la API
  documentada en `ai-context/API.md`.
- Todo contrato nuevo se define primero en `API.md` antes de implementarse.

## Estructura reservada

```
apps/backend/
├── README.md   ← este archivo
├── docs/       ← documentación operativa propia del backend (cuando exista)
└── src/        ← código fuente (vacío hasta Fase 5)
```
