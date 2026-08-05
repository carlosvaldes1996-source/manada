import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260805032924 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "cart_funnel" drop constraint if exists "cart_funnel_cart_id_unique";`);
    this.addSql(`create table if not exists "cart_funnel" ("id" text not null, "cart_id" text not null, "visitor_id" text null, "customer_id" text null, "email" text null, "stage" text check ("stage" in ('active', 'identified', 'checkout_started', 'payment_pending', 'paid')) not null default 'active', "activated_at" timestamptz null, "identified_at" timestamptz null, "checkout_started_at" timestamptz null, "payment_pending_at" timestamptz null, "paid_at" timestamptz null, "last_activity_at" timestamptz not null, "payment_attempts" integer not null default 0, "last_payment_status" text null, "items_count" integer not null default 0, "units_count" integer not null default 0, "subtotal" integer not null default 0, "discount_total" integer not null default 0, "shipping_total" integer not null default 0, "total" integer not null default 0, "currency_code" text not null default 'clp', "has_subscription" boolean not null default false, "promo_codes" text[] null, "order_id" text null, "order_display_id" integer null, "converted_at" timestamptz null, "utm_source" text null, "utm_medium" text null, "utm_campaign" text null, "utm_term" text null, "utm_content" text null, "referrer" text null, "landing_path" text null, "device_type" text null, "pet_species" text null, "pet_stage" text null, "recovery_email_count" integer not null default 0, "recovery_email_at" timestamptz null, "recovered_at" timestamptz null, "context" jsonb null, "projection_version" integer not null default 1, "projected_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "cart_funnel_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cart_funnel_cart_id_unique" ON "cart_funnel" ("cart_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_funnel_visitor_id" ON "cart_funnel" ("visitor_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_funnel_customer_id" ON "cart_funnel" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_funnel_email" ON "cart_funnel" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_funnel_stage" ON "cart_funnel" ("stage") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_funnel_last_activity_at" ON "cart_funnel" ("last_activity_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_funnel_order_id" ON "cart_funnel" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_funnel_utm_source" ON "cart_funnel" ("utm_source") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_funnel_utm_campaign" ON "cart_funnel" ("utm_campaign") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_funnel_deleted_at" ON "cart_funnel" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_funnel_stage_last_activity_at" ON "cart_funnel" ("stage", "last_activity_at") WHERE deleted_at IS NULL;`);

    // ── Índices sobre tablas NATIVAS (D75 · Etapa 1) ─────────────────────────
    // No alteran ninguna tabla del core: solo agregan caminos de acceso que hoy no
    // existen. Se verificó que `cart` no tiene índice por `created_at` ni por
    // `completed_at`, y que los de `cart_line_item` son PARCIALES con
    // `WHERE deleted_at IS NULL` — es decir, la consulta de "productos más
    // abandonados", que necesita justamente las líneas eliminadas, no los usa.
    //
    // Se usa `CREATE INDEX` normal y no `CONCURRENTLY` porque las migraciones de
    // MikroORM corren dentro de una transacción y `CONCURRENTLY` no lo admite. Con
    // el volumen actual de la tienda el bloqueo es de milisegundos; si algún día
    // estas tablas crecen mucho, la creación se hace a mano fuera de la migración.

    // Carritos abandonados por fecha: el acceso más frecuente del backoffice.
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_open_created_at" ON "cart" ("created_at") WHERE completed_at IS NULL AND deleted_at IS NULL;`);
    // Cohortes y conversión por período.
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_completed_at" ON "cart" ("completed_at") WHERE completed_at IS NOT NULL AND deleted_at IS NULL;`);
    // Productos QUITADOS del carrito (el índice que hoy falta: los nativos excluyen
    // las líneas con deleted_at, que son exactamente las que aquí interesan).
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_line_item_removed_product" ON "cart_line_item" ("product_id") WHERE deleted_at IS NOT NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_cart_line_item_removed_product";`);
    this.addSql(`DROP INDEX IF EXISTS "IDX_cart_completed_at";`);
    this.addSql(`DROP INDEX IF EXISTS "IDX_cart_open_created_at";`);
    this.addSql(`drop table if exists "cart_funnel" cascade;`);
  }

}
