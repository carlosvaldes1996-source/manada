import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Diagnostica y repara el contador de stock reservado (`inventory_level.reserved_quantity`).
 *
 * ── El problema que resuelve ────────────────────────────────────────────────
 * Al borrar un producto, Medusa falla con:
 *
 *     Cannot remove following inventory item(s) since they have reservations: [iitem_…]
 *
 * Ese mensaje NO comprueba que existan reservas. La validación real
 * (`core-flows/inventory/steps/delete-inventory-items`) es literalmente
 * `reserved_quantity > 0`, y ese campo del inventory_item es **computado**: se
 * agrega desde los `inventory_level`, donde `reserved_quantity` es una columna
 * ALMACENADA que solo se mantiene creando/borrando `reservation_item` **por el
 * módulo de inventario**. El propio módulo lo dice y bloquea escribirla a mano:
 *
 *     // reserved_quantity should solely be handled through creating &
 *     // updating reservation items
 *
 * Consecuencia: cualquier borrado de `reservation_item` por SQL directo —como
 * el de `e2e/purga-total.sql`, que a propósito "NO toca inventory_item ni
 * inventory_level"— deja el contador inflado. Quedan **reservas fantasma**:
 * stock retenido por pedidos que ya no existen, invisible en el Admin.
 *
 * No es solo un estorbo para borrar productos: el stock disponible se calcula
 * `stocked - reserved`, así que un contador inflado hace que la tienda venda
 * menos de lo que tiene (o muestre "agotado" con bodega llena).
 *
 * ── Qué hace ────────────────────────────────────────────────────────────────
 * Compara, por nivel de inventario, el contador almacenado contra la suma real
 * de reservas vivas, y lista las reservas legítimas con su pedido para poder
 * distinguir un fantasma de un pedido pendiente de verdad.
 *
 * Con `--apply` corrige el contador a la verdad. **Nunca borra reservas**: si
 * una reserva viva existe, el stock está retenido por un pedido real y eso se
 * resuelve despachando o cancelando el pedido, no tocando el contador.
 *
 * ── Uso ─────────────────────────────────────────────────────────────────────
 *   npx medusa exec ./src/scripts/fix-inventory-reservations.ts            # diagnóstico
 *   npx medusa exec ./src/scripts/fix-inventory-reservations.ts --apply    # repara
 *
 * En producción corre dentro del contenedor de Railway (mismo patrón que
 * `import-products.ts`, D67), para usar la DATABASE_URL del servicio.
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

/** Descuadre entre el contador almacenado y las reservas vivas de un nivel. */
type Descuadre = {
  level_id: string;
  inventory_item_id: string;
  sku: string | null;
  producto: string | null;
  variante: string | null;
  stocked: number;
  contador: number;
  reservas_vivas: number;
};

const DESCUADRES_SQL = `
  select
    il.id                                as level_id,
    il.inventory_item_id                 as inventory_item_id,
    ii.sku                               as sku,
    p.title                              as producto,
    v.title                              as variante,
    il.stocked_quantity::numeric         as stocked,
    il.reserved_quantity::numeric        as contador,
    coalesce(r.vivas, 0)::numeric        as reservas_vivas
  from inventory_level il
  join inventory_item ii on ii.id = il.inventory_item_id
  left join lateral (
    select sum(ri.quantity) as vivas
      from reservation_item ri
     where ri.inventory_item_id = il.inventory_item_id
       and ri.location_id = il.location_id
       and ri.deleted_at is null
  ) r on true
  left join product_variant_inventory_item pvi
    on pvi.inventory_item_id = il.inventory_item_id and pvi.deleted_at is null
  left join product_variant v on v.id = pvi.variant_id and v.deleted_at is null
  left join product p on p.id = v.product_id
  where il.deleted_at is null
    and il.reserved_quantity <> coalesce(r.vivas, 0)
  order by p.title nulls last, v.title nulls last
`;

export default async function fixInventoryReservations({ container, args }: ExecArgs) {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as Knexish;
  const apply = (args ?? []).includes("--apply") || process.env.RESERVATIONS_APPLY === "true";

  const out: string[] = [];
  const section = (title: string) =>
    out.push(`\n── ${title} ${"─".repeat(Math.max(0, 66 - title.length))}`);

  // 1 · Reservas vivas, con el pedido que las sostiene. Una reserva con pedido
  //     es stock legítimamente retenido; una reserva sin pedido (o un contador
  //     sin reserva, más abajo) es basura de una purga.
  const vivas = await pg.raw(`
    select
      ri.id                                   as reserva,
      ri.inventory_item_id                    as inventory_item,
      ri.quantity::numeric                    as cantidad,
      coalesce(li.title, '—')                 as linea,
      coalesce(o.display_id::text, 'SIN PEDIDO') as pedido,
      coalesce(o.status::text, '—')           as estado,
      to_char(ri.created_at, 'YYYY-MM-DD')    as creada
    from reservation_item ri
    left join order_line_item li on li.id = ri.line_item_id
    left join order_item oi on oi.item_id = ri.line_item_id and oi.deleted_at is null
    left join "order" o on o.id = oi.order_id
    where ri.deleted_at is null
    order by ri.created_at
  `);

  section("Reservas VIVAS (filas reales en reservation_item)");
  out.push(table(vivas.rows));

  // 2 · El descuadre: contador almacenado ≠ suma de reservas vivas.
  const { rows } = await pg.raw(DESCUADRES_SQL);
  const descuadres = rows as unknown as Descuadre[];

  section("DESCUADRES contador vs. realidad");
  out.push(
    table(
      descuadres.map((d) => ({
        producto: d.producto ?? "(sin producto)",
        variante: d.variante ?? "—",
        sku: d.sku ?? "—",
        inventory_item: d.inventory_item_id,
        stocked: d.stocked,
        contador: d.contador,
        reservas_vivas: d.reservas_vivas,
        diagnostico:
          Number(d.reservas_vivas) === 0
            ? "FANTASMA — retiene stock sin razón"
            : "parcial — contador no cuadra con sus reservas",
      })),
    ),
  );

  if (descuadres.length === 0) {
    out.push("\n✅ Sin descuadres. Si el borrado de un producto sigue fallando,");
    out.push("   la reserva es REAL: mira la tabla de arriba y despacha o cancela ese pedido.");
    console.log(out.join("\n"));
    return;
  }

  if (!apply) {
    section("Siguiente paso");
    out.push("   Ensayo: no se modificó nada.");
    out.push("   Para corregir los contadores a la verdad, vuelve a correr con --apply:");
    out.push("     npx medusa exec ./src/scripts/fix-inventory-reservations.ts --apply");
    console.log(out.join("\n"));
    return;
  }

  // 3 · Reparación: el contador pasa a valer exactamente la suma de reservas
  //     vivas. Se escriben las DOS columnas porque `reserved_quantity` es un
  //     bigNumber de Medusa: la numérica y el espejo `raw_` (jsonb). Dejar el
  //     espejo desincronizado es sembrar el mismo bug en otra capa.
  section("REPARANDO");
  for (const d of descuadres) {
    const verdad = Number(d.reservas_vivas);
    await pg.raw(
      `update inventory_level
          set reserved_quantity = ?,
              raw_reserved_quantity = jsonb_build_object('value', ?::text, 'precision', 20),
              updated_at = now()
        where id = ?`,
      [verdad, String(verdad), d.level_id],
    );
    out.push(
      `   ${d.producto ?? d.inventory_item_id} · ${d.variante ?? "—"}: ${d.contador} → ${verdad}`,
    );
  }

  // 4 · Verificación: se vuelve a preguntar lo mismo. Si algo quedó fuera, sale acá.
  const post = await pg.raw(DESCUADRES_SQL);
  section("VERIFICACIÓN");
  if (post.rows.length === 0) {
    out.push(`   ✅ ${descuadres.length} nivel(es) corregido(s). Cero descuadres.`);
    out.push("   Los productos afectados ya se pueden borrar desde el Admin.");
  } else {
    out.push(`   ⚠️ Quedan ${post.rows.length} descuadre(s):`);
    out.push(table(post.rows));
  }

  console.log(out.join("\n"));
}
