import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/**
 * D70 · Etapa 1 (Customers) — ajusta `saved_card` a la realidad de Flow.
 *
 *  - `exp_month` / `exp_year` pasan a NULLABLE: Flow no devuelve la fecha de
 *    vencimiento en NINGÚN servicio (ni el objeto Customer ni `RegisterResult`).
 *    Hasta ahora se escribía `0`/`0` — un dato inventado.
 *  - `gateway` cambia su default de `mercadopago` (pasarela que nunca se integró)
 *    a `flow`, la única real.
 *
 * Escrita a mano a propósito: el módulo no tenía snapshot, así que `db:generate`
 * emitía un `create table if not exists` que sobre una tabla existente es un no-op
 * y habría dejado las columnas como estaban.
 */
export class Migration20260804013704 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "saved_card" alter column "exp_month" drop not null;`);
    this.addSql(`alter table if exists "saved_card" alter column "exp_year" drop not null;`);
    this.addSql(`alter table if exists "saved_card" alter column "gateway" set default 'flow';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "saved_card" alter column "gateway" set default 'mercadopago';`);
    // Reponer el centinela antes de restaurar el NOT NULL (si no, falla con filas nulas).
    this.addSql(`update "saved_card" set "exp_month" = 0 where "exp_month" is null;`);
    this.addSql(`update "saved_card" set "exp_year" = 0 where "exp_year" is null;`);
    this.addSql(`alter table if exists "saved_card" alter column "exp_month" set not null;`);
    this.addSql(`alter table if exists "saved_card" alter column "exp_year" set not null;`);
  }

}
