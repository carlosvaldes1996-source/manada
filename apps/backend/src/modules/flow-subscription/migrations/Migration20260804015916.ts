import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260804015916 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "flow_subscription" drop constraint if exists "flow_subscription_subscription_id_unique";`);
    this.addSql(`alter table if exists "flow_subscription" drop constraint if exists "flow_subscription_flow_subscription_id_unique";`);
    this.addSql(`alter table if exists "flow_plan" drop constraint if exists "flow_plan_plan_id_unique";`);
    this.addSql(`create table if not exists "flow_plan" ("id" text not null, "plan_id" text not null, "amount" integer not null, "currency_code" text not null default 'clp', "interval" integer not null, "interval_count" integer not null, "status" integer not null default 1, "last_synced_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "flow_plan_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_flow_plan_plan_id_unique" ON "flow_plan" ("plan_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_flow_plan_deleted_at" ON "flow_plan" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "flow_subscription" ("id" text not null, "flow_subscription_id" text not null, "flow_plan_id" text not null, "flow_customer_id" text not null, "subscription_id" text null, "status" integer not null default 0, "morose" integer not null default 0, "cancel_at_period_end" integer not null default 0, "period_start" timestamptz null, "period_end" timestamptz null, "next_invoice_date" timestamptz null, "last_synced_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "flow_subscription_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_flow_subscription_flow_subscription_id_unique" ON "flow_subscription" ("flow_subscription_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_flow_subscription_flow_plan_id" ON "flow_subscription" ("flow_plan_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_flow_subscription_flow_customer_id" ON "flow_subscription" ("flow_customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_flow_subscription_subscription_id_unique" ON "flow_subscription" ("subscription_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_flow_subscription_deleted_at" ON "flow_subscription" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "flow_plan" cascade;`);

    this.addSql(`drop table if exists "flow_subscription" cascade;`);
  }

}
