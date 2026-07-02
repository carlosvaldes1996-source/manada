# PROMPTS — Prompts reutilizables e importantes

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Prompts reutilizables (onboarding, cierre de fase, voz de marca, continuación por etapa). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-06-29 |
> | **Depends On** | — |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ de *prompts operativos*. |

> Prompts clave del proyecto para reutilizar en chats nuevos.

## 1. Onboarding de un chat nuevo
```
Lee toda la carpeta /ai-context de este proyecto. Es la fuente oficial de verdad.
Empieza por PROJECT_MASTER.md y CURRENT_STATE.md, entiende el contexto completo
y dame un resumen del estado antes de proponer nada. Luego continuamos desde
donde indica CURRENT_STATE.md.
```

## 2. Cerrar una fase (mantenimiento de documentación)
```
Cerramos esta fase. Actualiza /ai-context: PROJECT_MASTER.md, CURRENT_STATE.md,
DECISIONS.md (con rationale), ROADMAP.md, TODO.md y el archivo temático
correspondiente. No elimines información anterior; archiva lo necesario en history/.
```

## 3. Tono de marca (para generar copy)
```
Escribe en la voz de Manada: cálida + experta, tuteo chileno, beneficio antes
que característica, frases cortas, habla de la mascota por su nombre. Concepto
rector: "te conocemos como nadie y nos anticipamos a lo que tu mascota necesita".
```

## 4. Rol de trabajo (consultora)
```
Actúa como una agencia de diseño y desarrollo de e-commerce de clase mundial.
Estrategia antes que estética. No avances a diseño visual sin posicionamiento cerrado.
```

## 5. (Histórico) Desarrollo del prototipo HTML
> ✅ **Hecho.** El prototipo vive en `/prototype`. El brief se archivó en `history/03-fase-2-prototype-brief.md`. Se conserva por referencia.
```
Vamos a construir el prototipo HTML estático de Manada. Lee
ai-context/history/03-fase-2-prototype-brief.md: es autocontenido y tiene TODO lo necesario
(marca, sistema visual, componentes, UX, navegación, páginas, interacción,
responsive, motion, accesibilidad y requisitos técnicos). Reutiliza
prototype/assets/styles.css (ya tiene los tokens). Construye las 6 páginas
navegables: index, plp, pdp, mascota, carrito, checkout. Mobile-first,
sin build, sin dependencias de red salvo fuentes, AA de accesibilidad,
con la mascota demo "Toby". No hace falta leer otros archivos.
```

## 6. (Histórico) Continuar Fase 3 · Etapa 2 — Component Library
> ✅ **Hecha y verificada** (D15). La librería de ~70 componentes vive en
> `web/src/components/{ui,layout,commerce,pet}`, documentada en `COMPONENT_LIBRARY.md`
> y con styleguide en `/dev/components`. Se conserva como referencia; para continuar
> usa el prompt #7.

## 7. Continuar Fase 3 · Etapa 3 — Pantallas en `web/` (chat nuevo) ← ACTUAL
```
Continuamos el frontend de Manada (Fase 3) en la carpeta web/.
Lee primero ai-context/CURRENT_STATE.md, COMPONENT_LIBRARY.md (catálogo de
componentes + cuándo usar cada uno), FRONTEND_ARCHITECTURE.md (§6 mapeo páginas→
componentes, §9 estado) y AUDIT_UI_UX.md (la tabla Fase 3.3 = lo que hay que
aplicar al ensamblar pantallas). Decisiones relevantes: D13 (fundaciones),
D15 (component library). Las Etapas 1 y 2 YA están hechas y verificadas.

Antes de tocar código en web/: lee web/AGENTS.md y los docs de Next 16 en
node_modules/next/dist/docs (este Next tiene cambios de ruptura). Stack: Next 16
App Router + React 19 + TS estricto + Tailwind v4 (CSS-first, tokens en
src/app/globals.css con @theme, SIN tailwind.config.ts) + Radix UI + framer-motion
+ lucide-react.

Construye la Etapa 3 — PANTALLAS, ensamblando EXCLUSIVAMENTE con los componentes
ya existentes (importa desde @/components/{ui,layout,commerce,pet}; envuelve en
AppShell; usa usePet()/useCart()/useToast() y los datos demo de lib/demo-data.ts).
Si falta una pieza, agrégala primero a la librería (token → componente → página) y
documenta, nunca markup suelto. Orden: Home → Categoría (PLP) → Producto (PDP) →
Carrito → Checkout → Mi Cuenta/Mascotas. Aplica los ítems de Fase 3.3 de
AUDIT_UI_UX.md (p. ej. U040 coherencia de fechas, U041 doble identidad de la home,
U042 free-shipping real, U043 PLP no oculta catálogo, U045 jerarquía a suscripción).
El prototipo /prototype es referencia de copy/voz, NO réplica 1:1 (ver D14).
Verifica con pnpm build + tsc + lint. Al terminar: actualiza la documentación y
ESPERA aprobación antes de la Etapa 4 (Polish, Fase 3.4).
```

## Cómo correr / verificar `web/`
```
cd web
pnpm dev            # http://localhost:3000 → / · /dev/components (librería) · /dev/tokens
pnpm build          # build de producción (debe quedar verde)
pnpm exec tsc --noEmit
pnpm lint
```

## Pendiente
- Agregar prompt de backend (Fase 4) cuando se inicie.
