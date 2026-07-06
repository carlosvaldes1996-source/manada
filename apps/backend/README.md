# apps/backend — espacio RESERVADO (D20)

> **Estado: ⬜ reservado, sin código.** Esta carpeta existe para fijar la
> arquitectura física del proyecto (D20): el backend de Manada vivirá aquí y
> **solo aquí** — nunca dentro de `apps/web` (ni `web/src/app/api`, ni
> `web/server`, ni variantes).

## Qué va a vivir aquí

La aplicación backend independiente de Manada: e-commerce headless +
módulo de suscripciones custom + motor de anticipación (el moat, D5) +
integraciones Chile (Webpay, courier, boleta SII, WhatsApp Business API).

## Qué falta antes de escribir código

1. **Validar el stack** (Fase 4, punto 1): Medusa.js vs alternativas
   (Vendure / Saleor / custom Next + Postgres/Supabase). Ver `ai-context/ARCHITECTURE.md`.
2. **Modelo de datos** aprobado → `ai-context/DATABASE.md`.
3. **Contratos API** aprobados → `ai-context/API.md`.

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
