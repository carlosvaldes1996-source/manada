# PROMPTS — Prompts reutilizables e importantes

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Prompts reutilizables (onboarding, cierre de fase, voz de marca, continuación por etapa). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-06 |
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

## 7. (Histórico) Continuar Fase 3 · Etapa 3 — Pantallas en `web/`
> ✅ **Hecha y cerrada** (D17; Polish lote 1 D18). La Fase 3 queda funcionalmente completa;
> el Polish 3.4 restante está ⏸ en pausa (D19). Se conserva como referencia; para
> retomar el Polish cuando existan las fotos, este prompt sigue siendo la base
> (cambiando el objetivo a los ítems de Fase 3.4 de `AUDIT_UI_UX.md`).
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

## Cómo correr / verificar `apps/web/`
```
cd apps/web    # o desde la raíz: pnpm dev / pnpm build / pnpm lint / pnpm typecheck
pnpm dev            # http://localhost:3000 → / · /dev/components (librería) · /dev/tokens
pnpm build          # build de producción (debe quedar verde)
pnpm exec tsc --noEmit
pnpm lint
```

## 8. (Histórico) Iniciar Fase 4 — Arquitectura técnica
> ✅ **Ejecutado en sus dos primeros hitos** (D20 estructura física del repo · D21 stack backend = Medusa.js v2). Se conserva como referencia; para continuar la Fase 4 usa el **prompt #9**.
```
Iniciamos la Fase 4 de Manada: Arquitectura técnica (D19).
Lee primero ai-context/CURRENT_STATE.md, ROADMAP.md (detalle Fase 4),
PROJECT_MASTER.md (visión y modelo de negocio), ARCHITECTURE.md (stack de alto
nivel ya decidido), DATABASE.md y API.md (borradores a completar) y DECISIONS.md
(D2, D5, D17, D19, D20, D21 — no re-litigar). La estructura física ya está (D20):
monorepo pnpm con el frontend en apps/web, apps/backend RESERVADO (sin código
hasta validar stack) y reglas arquitectónicas permanentes en ARCHITECTURE.md §2
(backend solo en apps/backend; comunicación solo vía API.md; contrato primero).
El frontend (Fase 3) ya está: app Next.js funcional en apps/web con datos demo;
NO es objetivo de esta fase tocarlo, solo entender sus contratos (providers
usePet/useCart/SessionProvider en apps/web/src/components/providers, tipos en
apps/web/src/types, motor en apps/web/src/lib).

Objetivo de la fase — arquitectura y validación, NO desarrollo (el MVP es Fase 5):
1. ✅ HECHO (D21): stack backend = Medusa.js v2 en apps/backend, principio
   "e-commerce primero" (no re-litigar). Moat como módulos custom
   (pet-profile/subscription/anticipation); Webpay = payment provider custom.
2. Proveedores Chile: pagos (Webpay Plus/MercadoPago/Khipu), courier
   (Blue Express/Starken/Chilexpress), boleta SII (LibreDTE/Bsale),
   WhatsApp Business API.
3. Modelo de datos → completar DATABASE.md (perfil de mascota + motor de
   anticipación + suscripciones).
4. Contratos API → completar API.md (pensando en cómo se hidratan los
   providers del frontend).

Estrategia antes que código: presenta comparativas con recomendación y espera
mi aprobación en las decisiones estratégicas. Registra cada decisión en
DECISIONS.md con rationale y actualiza ARCHITECTURE.md como fuente de verdad.
```

## 9. (Histórico) Fase 4→5 — MVP-first: modelo de datos mínimo → arrancar backend
> ✅ **Ejecutado (2026-07-06).** Backend **Medusa v2** arrancado en `apps/backend` y **verificado**: seed Chile/CLP + checkout con **pago manual** cerrando una **orden real** ($28.980 CLP). Se conserva como referencia; **para continuar usa el prompt #10.**
```
Continuamos la Fase 4 de Manada. CAMBIO DE FOCO: la arquitectura base YA está
definida y aprobada (monorepo pnpm + Medusa.js v2 + moat como módulos custom).
El objetivo ya NO es seguir refinando la arquitectura.

⚠️ MANDATO MVP-FIRST (rige TODA decisión desde ahora):
Cada decisión se evalúa con un único criterio: ¿acerca o retrasa el lanzamiento
del MVP? Antes de proponer cualquier integración o automatización, asume SIEMPRE
la alternativa manual si permite lanzar más rápido. NO agregues nuevas capas de
arquitectura salvo que sean indispensables para construir el MVP.

Alcance del MVP (lo único que debe funcionar para lanzar):
- El checkout debe funcionar.
- Los pagos deben funcionar.
- Las órdenes deben quedar registradas.
- La dirección de despacho debe almacenarse.
- Los envíos se gestionan MANUALMENTE.
- La emisión tributaria (boleta) se realiza MANUALMENTE.
- NO implementar automatizaciones con courier, SII ni WhatsApp hasta que exista
  tracción.

Objetivo inmediato: definir ÚNICAMENTE el modelo de datos necesario para soportar
ese MVP y comenzar la implementación del backend cuanto antes.

Actúa como Software Architect que DESBLOQUEA implementación, no que sobre-diseña.
Lee primero ai-context/CURRENT_STATE.md, ARCHITECTURE.md (estructura del repo §1,
reglas arquitectónicas §2, stack §3), DATABASE.md y API.md (borradores) y
DECISIONS.md (D19, D20, D21 — no re-litigar).

Ya está decidido y NO se reabre: monorepo pnpm (apps/web = frontend ·
apps/backend = Medusa · packages/shared solo con el primer contrato compartido
aprobado en API.md) y stack backend = Medusa.js v2, con el moat como módulos
custom (pet-profile / subscription / anticipation) y Webpay como payment provider
custom. Principio rector (D21): Manada es E-COMMERCE PRIMERO.

Trabajo de la fase, en orden y RECORTADO a lo mínimo del MVP:
1. Pagos: decidir el proveedor primario (Webpay Plus / MercadoPago / Khipu). Es
   lo único de "proveedores Chile" que bloquea el MVP. Courier, boleta SII y
   WhatsApp quedan como proceso MANUAL; NO diseñar integraciones todavía.
   Verifica precios/condiciones vigentes con búsqueda web, no de memoria.
2. Modelo de datos → DATABASE.md, SOLO lo que el MVP necesita: catálogo / carrito
   / orden (core de Medusa) + dirección de despacho + lo mínimo del perfil de
   mascota y suscripción que el checkout ya usa. Medusa-native (módulos custom +
   module links). El motor de anticipación completo NO entra si no bloquea el
   lanzamiento.
3. Contratos API → API.md, SOLO los que hidratan el checkout real del frontend
   (usePet/useCart/SessionProvider en apps/web/src/components/providers, tipos en
   apps/web/src/types). Al aprobarse el primer contrato compartido nace
   packages/shared.

Registra cada decisión en DECISIONS.md con rationale y actualiza ARCHITECTURE.md
como fuente de verdad. Cierre: con el modelo de datos mínimo + proveedor de pago
definidos, arranca el scaffold de Medusa en apps/backend (implementación del MVP).
```

## 10. Continuar Fase 5 — Conectar el frontend al backend (chat nuevo) ← ACTUAL
```
Continuamos el MVP de Manada (Fase 5, MVP-first — D22). Actúa como full-stack
que DESBLOQUEA lanzamiento, no que sobre-diseña.

Lee primero ai-context/CURRENT_STATE.md, DECISIONS.md (D20, D21, D22 — no
re-litigar), ARCHITECTURE.md (§1 estructura, §2 reglas, §3 stack) y
apps/backend/DEV.md (cómo correr el backend). Regla de oro (D22): cada decisión
se evalúa por ¿acerca o retrasa el lanzamiento? Alternativa manual por defecto;
sin nuevas capas salvo indispensables.

Estado (ya hecho y verificado, NO rehacer):
- Backend Medusa v2 en apps/backend (starter bare, integrado al workspace pnpm;
  NO el template DTC). BD local `medusa_manada`, migraciones + admin
  (admin@tumanada.cl) + seed Chile (apps/backend/src/scripts/seed.ts): tienda
  CLP, región Chile, despacho manual (Estándar $3.990/Express $5.990), pago
  MANUAL `pp_system_default` (transferencia), sales channel "Manada Web" +
  publishable key (1↔1), 6 productos alineados con
  apps/web/src/lib/data/catalog.ts.
- Checkout verificado por Store API punta a punta → orden real registrada.
- Arranque: `createdb medusa_manada` (si falta) → `pnpm install` →
  `pnpm migrate:backend` → `pnpm seed:backend` → `pnpm dev:backend`
  (http://localhost:9000, Admin en /app). Publishable key:
  `psql -d medusa_manada -tAc "select token from api_key where type='publishable';"`

Decisión de pago vigente (Carlos): el pago Webpay NO se integra todavía; el MVP
usa el pago MANUAL (`pp_system_default`) como método real y funcional. La
integración de Webpay se hará después (fast-follow), no ahora.

Objetivo de esta fase: que TODO el resto quede funcional = conectar apps/web
(hoy con datos demo) al backend real, por etapas verificables. Antes de tocar
código en apps/web lee apps/web/AGENTS.md y los docs de Next 16 en
apps/web/node_modules/next/dist/docs (Next 16 tiene cambios de ruptura). Respeta
la Component Library (~70 componentes) y el tipo Product de apps/web/src/types:
mapea datos de Medusa a los tipos/contratos ya existentes; no reescribas los
componentes. Providers a re-cablear: cart-provider, session-provider, pet-provider
en apps/web/src/components/providers.

Etapas (verificar cada una con pnpm build + prueba real contra el backend, y
esperar revisión entre etapas):
1. Fundación: SDK Medusa (@medusajs/js-sdk) en apps/web + apps/web/.env.local
   (NEXT_PUBLIC_MEDUSA_BACKEND_URL + publishable key) + capa de datos lib/medusa/
   que mapea producto Medusa → tipo Product.
2. Catálogo: home/PLP (categoria/[slug]) y PDP (producto/[slug]) leyendo
   productos reales por la Store API.
3. Carrito: cart-provider sobre carritos de Medusa (crear/agregar/quitar/totales
   CLP).
4. Checkout: pantalla /checkout sobre el flujo real (dirección → despacho →
   pago MANUAL → orden). Fulfillment y boleta se gestionan a mano en el Admin.
5. Cuenta/sesión: session-provider sobre auth de cliente de Medusa (registro
   valor-primero post-compra incluido).

El moat (perfil/suscripción/anticipación como módulos custom) es POSTERIOR al
MVP transaccional (D21/D22): no lo construyas en esta fase salvo lo mínimo que el
checkout ya usa. Registra decisiones en DECISIONS.md y mantén CURRENT_STATE.md al
día.
```
