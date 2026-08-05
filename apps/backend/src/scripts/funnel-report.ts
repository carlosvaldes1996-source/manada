import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Reporte del funnel de compra (D75 · Etapa 0) — responde las preguntas de negocio
 * que antes eran invisibles, **sin depender de la proyección**: todas estas
 * consultas corren sobre tablas NATIVAS de Medusa que ya llevan meses acumulando
 * datos en producción.
 *
 * Por qué existe aparte del módulo `cart_funnel`: es la prueba de que el problema
 * era 70 % de acceso y 30 % de datos. Se puede correr HOY, es de solo lectura, no
 * necesita despliegue de nada y sirve para dimensionar el problema antes de
 * construir encima. También queda como contraste independiente para verificar que
 * la proyección no miente.
 *
 * Los tres hechos verificados que lo hacen posible:
 *  · El carrito se crea PEREZOSAMENTE, en el primer add-to-cart → carrito con
 *    líneas ≡ hubo intención de compra real.
 *  · Quitar una línea es SOFT DELETE → el histórico de productos sacados del
 *    carrito ya está en la base.
 *  · El carrito NUNCA se borra (Medusa no tiene TTL ni job de purga).
 *
 * Uso:
 *   npx medusa exec ./src/scripts/funnel-report.ts
 *   FUNNEL_REPORT_DAYS=90 npx medusa exec ./src/scripts/funnel-report.ts
 */

type Knexish = {
  raw: (sql: string, bindings?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};

function table(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "   (sin datos)";
  const cols = Object.keys(rows[0]);
  const widths = cols.map((c) =>
    Math.max(c.length, ...rows.map((r) => String(r[c] ?? "—").length)),
  );
  const line = (cells: string[]) =>
    "   " + cells.map((cell, i) => cell.padEnd(widths[i])).join("  │  ");
  return [
    line(cols),
    "   " + widths.map((w) => "─".repeat(w)).join("──┼──"),
    ...rows.map((r) => line(cols.map((c) => String(r[c] ?? "—")))),
  ].join("\n");
}

export default async function funnelReport({ container }: ExecArgs) {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as Knexish;
  const days = Number(process.env.FUNNEL_REPORT_DAYS ?? 30) || 30;
  const since = `now() - interval '${days} days'`;

  const out: string[] = [];
  const section = (title: string, rows: Record<string, unknown>[]) => {
    out.push(`\n── ${title} ${"─".repeat(Math.max(0, 66 - title.length))}`);
    out.push(table(rows));
  };

  // 1 · Embudo completo. `activated` (carritos con al menos una línea alguna vez,
  //     incluidas las eliminadas) es la métrica honesta de "agregó al carrito":
  //     un carrito puede existir con 0 líneas porque el frontend lo crea en una
  //     petición y agrega la línea en la siguiente.
  const funnel = await pg.raw(`
    with c as (
      select
        ca.id,
        ca.email,
        ca.customer_id,
        ca.completed_at,
        exists (select 1 from cart_line_item li where li.cart_id = ca.id) as has_items,
        exists (select 1 from cart_shipping_method sm where sm.cart_id = ca.id) as has_shipping,
        exists (select 1 from flow_payment fp where fp.cart_id = ca.id) as has_payment
      from cart ca
      where ca.created_at >= ${since} and ca.deleted_at is null
    )
    select
      count(*) filter (where has_items)                             as "1_agregó_al_carrito",
      count(*) filter (where has_items and email is not null)       as "2_llegó_al_checkout",
      count(*) filter (where has_items and has_shipping)            as "3_eligió_despacho",
      count(*) filter (where has_items and has_payment)             as "4_llegó_a_pagar",
      count(*) filter (where completed_at is not null)              as "5_compró",
      round(100.0 * count(*) filter (where completed_at is not null)
            / nullif(count(*) filter (where has_items), 0), 1)      as "conversión_%"
    from c;
  `);
  section(`EMBUDO · últimos ${days} días`, funnel.rows);

  // 2 · Dónde se pierde la gente. Responde "¿qué % del abandono ocurre antes del
  //     checkout vs durante el checkout?" — la partición es exhaustiva.
  const dropoff = await pg.raw(`
    with c as (
      select
        ca.id, ca.email, ca.completed_at,
        exists (select 1 from cart_line_item li where li.cart_id = ca.id) as has_items,
        exists (select 1 from cart_shipping_method sm where sm.cart_id = ca.id) as has_shipping,
        exists (select 1 from flow_payment fp where fp.cart_id = ca.id) as has_payment
      from cart ca
      where ca.created_at >= ${since} and ca.deleted_at is null
    )
    select
      case
        when completed_at is not null then 'compró'
        when has_payment              then 'abandonó EN la pasarela de pago'
        when has_shipping             then 'abandonó tras elegir despacho'
        when email is not null        then 'abandonó en el formulario de checkout'
        else                               'abandonó ANTES del checkout'
      end as momento,
      count(*) as carritos,
      round(100.0 * count(*) / sum(count(*)) over (), 1) as "%"
    from c
    where has_items
    group by 1
    order by carritos desc;
  `);
  section("DÓNDE SE PIERDE LA GENTE", dropoff.rows);

  // 3 · Productos más abandonados. Distingue dos cosas que no son lo mismo:
  //     lo que quedó dentro de un carrito muerto vs lo que la persona SACÓ
  //     activamente. Esto último solo se puede saber porque el borrado es suave.
  const products = await pg.raw(`
    select
      li.product_title as producto,
      count(*) filter (where li.deleted_at is null)     as "abandonado_en_carrito",
      count(*) filter (where li.deleted_at is not null) as "quitado_por_el_cliente",
      count(*)                                          as total
    from cart_line_item li
    join cart ca on ca.id = li.cart_id
    where ca.completed_at is null
      and ca.deleted_at is null
      and ca.created_at >= ${since}
    group by 1
    order by total desc
    limit 15;
  `);
  section("PRODUCTOS MÁS ABANDONADOS", products.rows);

  // 4 · Cuánto vive un carrito antes de morir. `cart.updated_at` NO sirve
  //     (add-to-cart no toca la fila `cart`), así que la actividad se deriva del
  //     máximo de los timestamps de las líneas, incluido el `deleted_at`.
  const lifespan = await pg.raw(`
    with act as (
      select
        ca.id,
        ca.created_at,
        greatest(
          ca.updated_at,
          coalesce(max(greatest(li.created_at, li.updated_at, li.deleted_at)), ca.updated_at)
        ) as last_activity
      from cart ca
      left join cart_line_item li on li.cart_id = ca.id
      where ca.completed_at is null
        and ca.deleted_at is null
        and ca.created_at >= ${since}
        and exists (select 1 from cart_line_item l2 where l2.cart_id = ca.id)
      group by ca.id, ca.created_at, ca.updated_at
    )
    select
      count(*) as carritos_abandonados,
      round(avg(extract(epoch from (last_activity - created_at)) / 60)::numeric, 1) as "vida_media_min",
      round((percentile_cont(0.5) within group (
        order by extract(epoch from (last_activity - created_at)) / 60))::numeric, 1) as "mediana_min",
      count(*) filter (where last_activity < now() - interval '24 hours') as "muertos_>24h"
    from act;
  `);
  section("PERMANENCIA ANTES DEL ABANDONO", lifespan.rows);

  // 5 · Quién estuvo a punto de comprar. Autenticado e invitado-con-email son
  //     recuperables HOY; el invitado anónimo es lo único que exige `visitor_id`.
  const identity = await pg.raw(`
    with c as (
      select ca.id, ca.email, ca.customer_id, ca.completed_at,
        exists (select 1 from cart_line_item li where li.cart_id = ca.id) as has_items
      from cart ca
      where ca.created_at >= ${since} and ca.deleted_at is null
    )
    select
      case
        when customer_id is not null then 'cliente con cuenta'
        when email is not null       then 'invitado con email (contactable)'
        else                              'invitado anónimo (necesita visitor_id)'
      end as identidad,
      count(*) as carritos_abandonados
    from c
    where has_items and completed_at is null
    group by 1
    order by carritos_abandonados desc;
  `);
  section("A QUIÉN PODEMOS CONTACTAR", identity.rows);

  // 6 · Intentos de pago fallidos: la señal más fuerte de intención de compra.
  const payments = await pg.raw(`
    select
      fp.status as estado,
      count(*) as intentos,
      count(distinct fp.cart_id) as carritos,
      to_char(sum(fp.amount), 'FM999G999G999') as monto_total
    from flow_payment fp
    where fp.created_at >= ${since} and fp.deleted_at is null
    group by 1
    order by intentos desc;
  `);
  section("INTENTOS DE PAGO", payments.rows);

  console.log(
    [
      "",
      "═".repeat(72),
      `  MANADA · REPORTE DEL FUNNEL DE COMPRA — últimos ${days} días`,
      "  Fuente: tablas nativas de Medusa (sin depender de la proyección).",
      "═".repeat(72),
      ...out,
      "",
    ].join("\n"),
  );
}
