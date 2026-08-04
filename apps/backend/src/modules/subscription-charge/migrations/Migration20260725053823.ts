import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260725053823 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "subscription_charge" ("id" text not null, "subscription_id" text not null, "period_key" text not null, "commerce_order" text not null, "flow_order" text null, "amount" integer not null, "currency_code" text not null default 'clp', "status" text check ("status" in ('pending', 'paid', 'rejected', 'failed')) not null default 'pending', "raw_status" integer null, "order_id" text null, "attempt" integer not null default 1, "error" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "subscription_charge_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_charge_subscription_id" ON "subscription_charge" ("subscription_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_charge_period_key" ON "subscription_charge" ("period_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_charge_commerce_order" ON "subscription_charge" ("commerce_order") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_charge_deleted_at" ON "subscription_charge" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "subscription_charge" cascade;`);
  }

}
