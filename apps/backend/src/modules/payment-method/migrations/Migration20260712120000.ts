import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260712120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "saved_card" ("id" text not null, "customer_id" text not null, "gateway" text not null default 'mercadopago', "gateway_customer_id" text null, "gateway_card_id" text null, "brand" text not null, "last4" text not null, "exp_month" integer not null, "exp_year" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "saved_card_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_saved_card_customer_id" ON "saved_card" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_saved_card_deleted_at" ON "saved_card" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "saved_card" cascade;`);
  }

}
