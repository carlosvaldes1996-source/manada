import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260804013649 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "flow_customer" drop constraint if exists "flow_customer_flow_customer_id_unique";`);
    this.addSql(`alter table if exists "flow_customer" drop constraint if exists "flow_customer_customer_id_unique";`);
    this.addSql(`create table if not exists "flow_customer" ("id" text not null, "customer_id" text not null, "flow_customer_id" text not null, "status" text not null default '1', "pay_mode" text null, "register_date" timestamptz null, "last_synced_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "flow_customer_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_flow_customer_customer_id_unique" ON "flow_customer" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_flow_customer_flow_customer_id_unique" ON "flow_customer" ("flow_customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_flow_customer_deleted_at" ON "flow_customer" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "flow_customer" cascade;`);
  }

}
