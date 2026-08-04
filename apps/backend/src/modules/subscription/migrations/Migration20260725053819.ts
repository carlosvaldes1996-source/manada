import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260725053819 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "subscription" drop constraint if exists "subscription_status_check";`);

    this.addSql(`alter table if exists "subscription" add column if not exists "last_charged_at" timestamptz null, add column if not exists "failed_charge_count" integer not null default 0, add column if not exists "last_charge_error" text null, add column if not exists "next_charge_attempt_at" timestamptz null;`);
    this.addSql(`alter table if exists "subscription" add constraint "subscription_status_check" check("status" in ('active', 'paused', 'cancelled', 'past_due', 'unpaid'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "subscription" drop constraint if exists "subscription_status_check";`);

    this.addSql(`alter table if exists "subscription" drop column if exists "last_charged_at", drop column if exists "failed_charge_count", drop column if exists "last_charge_error", drop column if exists "next_charge_attempt_at";`);

    this.addSql(`alter table if exists "subscription" add constraint "subscription_status_check" check("status" in ('active', 'paused', 'cancelled'));`);
  }

}
