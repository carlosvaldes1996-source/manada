import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Reporte de correos con customer INVITADO **y** REGISTRADO a la vez (API.md §17.6, D82).
 *
 * De dónde sale el problema: el índice de Medusa es
 * `UNIQUE (email, has_account) WHERE deleted_at IS NULL` —no `UNIQUE (email)`—, así que
 * cada correo admite exactamente dos filas. Hasta D82 el registro nativo creaba la
 * segunda cuando ya existía un invitado, y todo lo que colgaba del invitado (orden,
 * suscripción, mascotas, direcciones, tarjeta) quedaba invisible para la cuenta nueva,
 * porque el storefront se scopea por `auth_context.actor_id`.
 *
 * Consecuencia secundaria y más traicionera: mientras las dos filas coexisten,
 * `findOrCreateCustomerStep` hace `listCustomers({ email })` **sin `order`** y toma
 * `[customer]` → a qué fila se engancha el próximo carrito de ese correo NO está
 * garantizado. D82 elimina la causa (ya no se crean pares nuevos); este script mide
 * la deuda que quedó de antes.
 *
 * ⚠️ SOLO REPORTA. No fusiona ni reasigna nada, a propósito: mover filas entre dos
 * `customer_id` es justo lo que §17.1 prohíbe —`flow_customer` tiene UNIQUE por
 * `customer_id` y `customer_account_holder` tiene PK `(customer_id, account_holder_id)`,
 * así que una fusión puede colisionar— y además tocaría datos de pago. Qué hacer con
 * cada par es una decisión de negocio, caso a caso.
 *
 * Uso:
 *   npx medusa exec ./src/scripts/report-duplicate-customers.ts
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

export default async function reportDuplicateCustomers({ container }: ExecArgs) {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as Knexish;
  const out: string[] = [];
  const section = (title: string, rows: Record<string, unknown>[]) => {
    out.push(`\n── ${title} ${"─".repeat(Math.max(0, 66 - title.length))}`);
    out.push(table(rows));
  };

  // 1 · Los pares. Se muestra qué cuelga del invitado, que es exactamente lo que la
  //     cuenta registrada NO está viendo hoy.
  const pairs = await pg.raw(`
    with dup as (
      select email
      from customer
      where deleted_at is null
      group by email
      having count(*) filter (where has_account) > 0
         and count(*) filter (where not has_account) > 0
    )
    select
      c.email,
      max(c.id) filter (where not c.has_account)                       as invitado,
      max(c.id) filter (where c.has_account)                           as registrado,
      (select count(*) from "order" o
        where o.customer_id = max(c.id) filter (where not c.has_account)
          and o.deleted_at is null)                                    as ordenes_invitado,
      (select count(*) from customer_customer_subscription_subscription s
        where s.customer_id = max(c.id) filter (where not c.has_account)
          and s.deleted_at is null)                                    as suscrip_invitado,
      (select count(*) from customer_customer_pet_pet p
        where p.customer_id = max(c.id) filter (where not c.has_account)
          and p.deleted_at is null)                                    as mascotas_invitado,
      (select count(*) from saved_card sc
        where sc.customer_id = max(c.id) filter (where not c.has_account)
          and sc.deleted_at is null)                                   as tarjetas_invitado
    from customer c
    join dup on dup.email = c.email
    where c.deleted_at is null
    group by c.email
    order by ordenes_invitado desc, c.email;
  `);
  section("PARES invitado + registrado (mismo correo)", pairs.rows);

  // 2 · Resumen. `pares_con_orden` es el subconjunto que de verdad duele: hay una
  //     compra pagada que su dueño no ve en "Mis pedidos".
  const summary = await pg.raw(`
    with dup as (
      select email,
             max(id) filter (where not has_account) as guest_id
      from customer
      where deleted_at is null
      group by email
      having count(*) filter (where has_account) > 0
         and count(*) filter (where not has_account) > 0
    )
    select
      (select count(*) from dup)                                      as pares,
      (select count(*) from dup
        where exists (select 1 from "order" o
                      where o.customer_id = dup.guest_id
                        and o.deleted_at is null))                    as pares_con_orden,
      (select count(*) from customer
        where deleted_at is null and not has_account)                 as invitados_totales,
      (select count(*) from customer
        where deleted_at is null and has_account)                     as cuentas_totales;
  `);
  section("RESUMEN", summary.rows);

  out.push(
    "\n   Nota: este reporte no corrige nada (§17.6). D82 impide que se creen pares",
    "   nuevos; lo de arriba es deuda anterior y se resuelve caso a caso.\n",
  );

  console.log(out.join("\n"));
}
