import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260723192242 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "subscription" ("id" text not null, "variant_id" text not null, "product_id" text not null, "quantity" integer not null default 1, "frequency_weeks" integer not null, "next_delivery_date" timestamptz not null, "status" text check ("status" in ('active', 'paused', 'cancelled')) not null default 'active', "agreed_unit_price" integer not null, "currency_code" text not null default 'clp', "shipping_address" jsonb null, "payment_method_id" text null, "source_order_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "subscription_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_deleted_at" ON "subscription" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "subscription" cascade;`);
  }

}
