# TODO — Pendientes y decisiones abiertas

> **📋 Metadata**
> | Campo | Valor |
> |---|---|
> | **Purpose** | Detalle táctico de pendientes, por frente. Lo hecho no se re-narra aquí: vive en `DECISIONS.md` (D#). |
> | **Owner** | Carlos (fundador) · Claude |
> | **Status** | 🟢 Vivo |
> | **Last Updated** | 2026-07-11 |
> | **Depends On** | CURRENT_STATE.md (frentes), ROADMAP.md (fases), AUDIT_UI_UX.md (backlog fino de FE) |
> | **Supersedes** | — |
> | **Source of Truth** | ✅ del *detalle táctico de pendientes*. El backlog UI/UX fino vive en AUDIT_UI_UX.md. |

> ✅ **Hecho hasta hoy (no re-abrir):** Fases 0–4 cerradas (D1–D21) · flujo propio del MVP cerrado y endurecido (D22–D29) · funnel F1–F4 sobre catálogo real (D32/D33) · perfil de mascota persistido con edición real y separación comprar≠definir (D34–D39). Cronología y rationale: `DECISIONS.md`.

## 🔴 Frente 1 — Infraestructura de producción (bloquea el lanzamiento)

> 🚧 Etapa 1 (Railway backend) hecha en disco, **sin commitear**; D30 reservada. Punto exacto de continuación y decisiones de la sesión: `CURRENT_STATE.md §WIP`.

- [ ] `railway login` (Carlos) → `railway init` (proyecto `manada`).
- [ ] Provisionar **PostgreSQL** (`railway add`) → `railway up` → gate `/health` → 200.
- [ ] **Redis** gestionado (los módulos ya están condicionados a `REDIS_URL`).
- [ ] **Secrets de producción fuertes** (`JWT_SECRET`/`COOKIE_SECRET`; el fallback `"supersecret"` ya se eliminó en el WIP).
- [ ] **CORS** (`STORE_CORS`/`ADMIN_CORS`/`AUTH_CORS`) apuntando al dominio del frontend.
- [ ] Migraciones + seed de prod + publishable key de prod.
- [ ] Env vars en Vercel (`NEXT_PUBLIC_MEDUSA_BACKEND_URL` + `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, D27) → redeploy.
- [ ] Smoke punta a punta en la URL de Vercel (catálogo · carrito · checkout → orden real).
- [ ] Decidir rama `production` dedicada vs `main`=prod (D27 §3) → conectar dominio `tumanada.cl`.
- [ ] Al validar cada etapa: **documentar D30 + actualizar `DEPLOYMENT.md` + commit/push** (mandato del WIP).

## 🟠 Frente 2 — Terceros (post-infra, pre/post-lanzamiento)

- [ ] **Mercado Pago Checkout Pro** (fast-follow tras infra live con pago manual): provider module + webhook + habilitar en región + redirect/confirmación. Decidido: Checkout Pro redirect; "construir todo, credenciales de prueba después" (D24).
- [ ] **Email transaccional**: entrega real del enlace de recuperación (hoy subscriber → log, D26) + confirmaciones de orden/datos de transferencia.

## 🟡 Frente 3 — Producto (en paralelo, por bloques; un bloque → validado → un commit)

- [ ] **Funnel F5 — momento de registro:** empieza por **decisión de producto** con Carlos (dónde vive la captura de cuenta; alternativas en `FUNNEL_TARGET.md §1.6`). No implementar antes de decidir.
- [ ] **Pet Experience B4 — foto de la mascota:** directivas vinculantes de Carlos en `PET_EXPERIENCE_TARGET.md` B4 (foto faltante obvia · sin storage temporal · consistencia ante todo).
- [ ] **Pet Experience B7 — restyle `/cuenta` + estados vacíos** (después de B4).
- [ ] Menor diferido: multi-selección "mismo alimento para dos mascotas" (`PET_EXPERIENCE_TARGET.md §1.3`).

## ⏸ En pausa — Polish 3.4 (se retoma cuando existan fotos)

- [ ] **Lote 2 no-fotográfico:** U086 (vuelo al carrito) · U100 (home con un clímax) · U096/U097 (confianza) · U094 (cumpleaños) · U095 (tono salud) · U098/U099 (acento/texturas) · U104 (urgencia) · **U003** (color suscripción — decisión de marca pendiente).
- [ ] **Track fotográfico** (U080/U081/U082/U084/U091/U092), bloqueado por assets: política IA vs fotografía real (**U090, sin decidir**); fotos IA de ChatGPT por probar; existe shot list por pantalla como brief candidato.

## ⬜ Post-tracción (Fases 6–7 — no tocar ahora)

- [ ] **Suscripción recurrente** (el moat transaccional; recipe oficial de Medusa) + encendido de `SUBSCRIPTIONS_ENABLED` + hipótesis tarjeta-en-archivo (`FUNNEL_TARGET.md §1.5`).
- [ ] Motor de anticipación completo (recordatorios proactivos).
- [ ] Webpay (payment provider custom, sujeto a afiliación Transbank) · courier (Blue Express/Starken/Chilexpress) · boleta SII (LibreDTE/Bsale) · WhatsApp Business API.

## 🟢 Operativos de marca (no bloquean)

- [ ] Registrar `tumanada.cl` + handles (@manada / @somosmanada / @tumanada).
- [ ] Verificar marca "Manada" en INAPI.
- [ ] Ejecutar logo en vector (spec en `BRANDING.md §7`).
- [ ] Benchmarking visual fino de DrPet y Chewy (quedó bloqueado por scraping).

> **Backlog vivo de UI/UX:** ítem a ítem en `AUDIT_UI_UX.md` (columna *estado*).
