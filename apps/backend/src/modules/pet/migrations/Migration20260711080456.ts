import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260711080456 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "pet" ("id" text not null, "customer_id" text not null, "name" text not null, "species" text check ("species" in ('perro', 'gato', 'otro')) not null, "stage" text check ("stage" in ('cachorro', 'adulto', 'senior')) not null, "weight_kg" real null, "weight_source" text check ("weight_source" in ('exacto', 'rango', 'estimado')) null, "breed" text null, "neutered" boolean null, "conditions" text[] null, "avatar_url" text null, "current_food_id" text null, "food_assigned_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pet_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pet_customer_id" ON "pet" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pet_deleted_at" ON "pet" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "pet" cascade;`);
  }

}
