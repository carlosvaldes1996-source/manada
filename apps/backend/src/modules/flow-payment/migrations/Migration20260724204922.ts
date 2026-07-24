import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260724204922 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "flow_payment" ("id" text not null, "cart_id" text not null, "commerce_order" text not null, "token" text null, "flow_order" text null, "redirect_url" text null, "amount" integer not null, "currency_code" text not null default 'clp', "status" text check ("status" in ('pending', 'paid', 'rejected', 'canceled')) not null default 'pending', "raw_status" integer null, "order_id" text null, "payment_collection_id" text null, "error" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "flow_payment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_flow_payment_cart_id" ON "flow_payment" ("cart_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_flow_payment_commerce_order" ON "flow_payment" ("commerce_order") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_flow_payment_token" ON "flow_payment" ("token") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_flow_payment_deleted_at" ON "flow_payment" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "flow_payment" cascade;`);
  }

}
