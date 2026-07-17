import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260717033907 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`drop index if exists "IDX_pet_customer_id";`);
    this.addSql(`alter table if exists "pet" drop column if exists "customer_id";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "pet" add column if not exists "customer_id" text not null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pet_customer_id" ON "pet" ("customer_id") WHERE deleted_at IS NULL;`);
  }

}
