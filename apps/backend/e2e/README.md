# `apps/backend/e2e/` — Herramientas operativas y conocimiento de terreno

> Lo que sobrevivió de la validación E2E de Flow (Etapa 3, **D73**). Aquí vive **solo lo
> reutilizable**: un script de purga probado y el conocimiento que costó caro obtener.
> El rationale completo está en `ai-context/DECISIONS.md` D70–D74.

## ⚠️ Lo que se eliminó a propósito, y por qué importa

Durante D73 existió un arnés de scripts en Node (`flow-e2e.mjs`, `carrera.mjs`,
`guardia.mjs`, `callbacks.mjs`, `compra-unica.mjs`, `verificar.mjs`, `ordenes.mjs`) que
conducía el flujo real de checkout contra el backend desplegado. **Se borró el 2026-08-05,
por decisión de Carlos**, por dos razones:

1. **Cobraba de verdad y no tenía ninguna comprobación de ambiente.** Funcionó mientras el
   backend apuntaba a Sandbox. El día que `FLOW_API_URL` vuelva a producción, correr
   cualquiera de esos scripts por inercia —o por historial de la terminal— **habría cobrado
   una tarjeta real**.
2. **La mitad eran código muerto que además mentía:** tenían ids de carrito y tokens de una
   sesión concreta *hardcodeados*. Se veían ejecutables y apuntaban a carritos que ya no
   existen.

**Regla que queda:** si algún día se vuelve a necesitar un arnés que mueva dinero, debe
**negarse a ejecutarse** salvo que compruebe que `FLOW_API_URL` apunta a
`sandbox.flow.cl`, y solo saltarse esa comprobación con una bandera explícita. Es la
diferencia entre una herramienta y un arma.

Lo caro de esos scripts no era el código: era el conocimiento. Está abajo.

---

## `purga-total.sql`

Deja la tienda **"como recién lanzada"** —sin clientes, órdenes, carritos, mascotas,
suscripciones ni datos de prueba— **conservando catálogo, inventario y configuración**.

Ejecutado con éxito el **2026-08-05** sobre la BD de producción: 411 filas borradas,
catálogo intacto.

```bash
railway link                 # una vez, desde la raíz del repo
railway connect Postgres     # abre psql
```

Ya dentro de psql (el prompt termina en `=#`):

```
\pset pager off
\i /Users/carlos/manada/apps/backend/e2e/purga-total.sql
```

**Termina en `ROLLBACK` a propósito.** Se corre primero como ensayo, se revisan los
conteos, y solo entonces se cambia la última línea por `COMMIT`. **No usar el editor web
de Railway**: ejecuta cada sentencia por separado y la confirma, así que el `ROLLBACK` no
protegería nada y la guarda de catálogo tampoco funcionaría.

**Dos salvaguardas incorporadas:**

- **Guarda de catálogo:** cuenta productos, variantes, precios, inventario e imágenes antes
  y después. Si algo cambió, lanza excepción y aborta la transacción sola.
- **Tolerancia a tablas ausentes:** el borrado corre en un bucle que omite las tablas que no
  existen en el esquema (`payment_method_token` y `auth_verification_token` no existen en
  este servidor). Sin eso, una sola tabla ausente aborta toda la transacción.

### El detalle que casi cuesta el acceso al Admin

La credencial de Carlos tiene **`user_id` y `customer_id` en la MISMA fila** de
`auth_identity` —se registró como cliente con el correo del admin—. El filtro natural
("borrar lo que tenga `customer_id`") **lo habría dejado fuera de su propia tienda**.

El criterio correcto es el inverso: **conservar todo lo que tenga `user_id`**, y después
quitarle la llave `customer_id` huérfana con `app_metadata - 'customer_id'`.

Antes de tocar esas tablas, **siempre** correr la previsualización:

```sql
select ai.id, pi.entity_id as correo, ai.app_metadata,
       case when ai.app_metadata ? 'user_id' then 'ADMIN — SE CONSERVA'
            when ai.app_metadata ? 'customer_id' then 'cliente — se elimina'
            else 'DESCONOCIDO — revisar' end as destino
  from auth_identity ai
  left join provider_identity pi on pi.auth_identity_id = ai.id
 order by destino;
```

---

## Conocimiento de terreno sobre Flow (medido, no leído)

Nada de esto está en el spec oficial. Todo salió de mover dinero real contra Sandbox.

### Ambiente

- `FLOW_API_URL` = `https://sandbox.flow.cl/api` ↔ `https://www.flow.cl/api`, más
  `FLOW_API_KEY` / `FLOW_SECRET_KEY`. Viven en Railway.
- **Nada de `localhost`:** Flow necesita alcanzar `urlReturn` por una URL pública. Se prueba
  **contra el backend desplegado**, lo que además elimina la clase entera de "funcionaba en
  mi máquina".
- ⚠️ **Todo lo que escriben las pruebas cae en la BD de producción.** Por eso existe
  `purga-total.sql`.

### Los dos rails se distinguen por la URL

| Flujo | URL a la que Flow redirige |
|---|---|
| Suscripción (tokenización, rail Customers) | `sandbox.flow.cl/app/customer/disclaimer.php?token=…` |
| Compra única (`payment/create`) | `sandbox.flow.cl/app/web/pay.php?token=…` |

Sirve para verificar por qué camino va un checkout **sin llegar a pagar**.

### Tarjeta de prueba

Sandbox delega en **Transbank Oneclick** (`webpay3gint.transbank.cl`):
Visa `4051 8856 0044 6623` · CVV `123` · vencimiento futuro → RUT `11.111.111-1` · clave `123`.

### Límites y comportamientos medidos

- **Cuota diaria de transacciones, POR CLIENTE** (no por comercio): tras ~6 cargos contra el
  mismo cliente, `400 The customer id: N has exceeded the daily transaction quota`.
  Comprobado que es por cliente: un cliente nuevo cobró sin problema mientras otro seguía
  bloqueado. **Falta confirmar con soporte si rige en Producción y con qué número.**
- **`payment/getStatusByCommerceId` responde `400 "Transaction not found"`** ante una
  referencia que Flow no conoce. El spec no lo documenta.
- **Flow NO deduplica `customer/charge` por `commerceOrder`**: dos cargos aceptados con el
  mismo id y `flowOrder` distintos. El `commerceOrder` es **trazabilidad, no un candado** —
  la única protección contra el doble cobro es la nuestra (lock + ledger + verificación).
- **Flow guarda UNA tarjeta por cliente**: registrar reemplaza.
- **Flow no devuelve fecha de vencimiento** de la tarjeta en ningún servicio.

---

## Cómo probar una renovación a mano

El botón **"Cobrar ahora"** vive en `…/app/subscriptions` y **no** está gateado por
`SUBSCRIPTION_CHARGES_ENABLED` (ese flag solo apaga el barrido automático). Solo se habilita
si la suscripción está vencida, tiene tarjeta y está `active` o `past_due`.

Para forzar que una suscripción quede vencida:

```sql
update subscription
   set next_delivery_date = '2026-07-20 12:00:00+00',
       status = 'active', failed_charge_count = 0,
       last_charge_error = null, next_charge_attempt_at = null
 where id = 'sub_…';
```

**Tres cosas que hay que saber o se lee un falso verde:**

1. **Usar `+00` y mediodía.** El `period_key` del ledger es la fecha en **UTC**; fijar el
   instante explícitamente evita que el editor lo interprete en otra zona.
2. **Elegir un período virgen.** Si ya existe una fila en `subscription_charge` con ese
   `period_key` en estado `paid`, el motor devuelve `already_done`: avanza la cadencia **sin
   cobrar**. Se ve como éxito y no lo es. Comprobar antes:
   `select period_key, status from subscription_charge where subscription_id = 'sub_…';`
3. **Un solo clic.** Leer el desenlace antes de volver a pulsar.

### Desenlaces del motor

| Desenlace | Significa |
|---|---|
| `renewed` | Cobró, creó la orden y avanzó la cadencia |
| `deferred` | No se pudo cobrar **ni saber si se cobró** (problema de Flow o nuestro). No penaliza al cliente, no manda correo |
| `failed` | Rechazo real de Flow (estado 3/4) → dunning |
| `already_done` / `recovered` / `order_resumed` | La idempotencia actuando: el período ya estaba cobrado |
| `paid_order_pending` | Cobró pero la orden falló. **Mirar de inmediato** |
| `skipped` | No correspondía cobrar |

Los logs de Railway lo dicen textual:
`[cobro] Disparo MANUAL desde el Admin para sub_…: outcome=…`

---

## Estado del cobro recurrente (2026-08-05)

`SUBSCRIPTION_CHARGES_ENABLED` **ausente** → el barrido automático está apagado. Por
decisión de producto, las renovaciones se ejecutan **a mano desde el Admin** hasta que haya
tracción real. Lo que falta antes de encenderlo está en `ai-context/TODO.md` Frente 1b.
