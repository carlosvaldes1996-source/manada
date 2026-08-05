-- ═══════════════════════════════════════════════════════════════════════════
-- PURGA TOTAL DE DATOS TRANSACCIONALES — BD de PRODUCCIÓN (Railway)
--
-- Objetivo: dejar la tienda "como recién lanzada" — sin clientes, órdenes,
-- carritos, mascotas, suscripciones ni datos de las pruebas de Flow — pero con
-- el CATÁLOGO y el INVENTARIO intactos, y el usuario admin de Carlos operativo.
--
-- ⚠️ CORRER EN psql, NO en el editor web de Railway.
--
--      railway connect Postgres
--      \pset pager off
--      \i /Users/carlos/manada/apps/backend/e2e/purga-total.sql
--
-- Termina en ROLLBACK a propósito. Revisa los conteos y, si cuadran, cambia la
-- última línea por COMMIT y vuelve a correrlo entero.
--
-- El borrado va dentro de un bucle que OMITE las tablas que no existen en este
-- esquema (p. ej. `payment_method_token`, que Medusa declara en migraciones
-- pero este servidor no tiene). Sin eso, una sola tabla ausente aborta toda la
-- transacción y obliga a repetir el ensayo.
--
-- ⚠️ SUPERSEDE a `sandbox-limpieza.sql` (eliminado el 2026-08-05): purgaba por
--    ventana de fechas (`created_at >= …`) y sobre una tienda en vivo eso habría
--    alcanzado a clientes reales.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══ GUARDA: foto del catálogo ANTES ═══
CREATE TEMP TABLE _guard AS SELECT
  (select count(*) from product)         as product,
  (select count(*) from product_variant) as variant,
  (select count(*) from price)           as price,
  (select count(*) from inventory_item)  as inv_item,
  (select count(*) from inventory_level) as inv_level,
  (select count(*) from image)           as image;

-- ═══ BORRADO en orden de dependencias (hojas → raíz) ═══
DO $$
DECLARE
  t text;
  n bigint;
  total bigint := 0;
  tablas text[] := ARRAY[
    -- 1. ENLACES entre módulos (sin FK: si quedan, apuntan a filas borradas)
    'order_promotion', 'order_fulfillment', 'order_payment_collection',
    'order_cart', 'return_fulfillment', 'cart_promotion',
    'cart_payment_collection', 'customer_account_holder',
    'customer_customer_pet_pet', 'customer_customer_subscription_subscription',
    'pet_pet_subscription_subscription',

    -- 2. ÓRDENES
    'order_change_action', 'order_change',
    'return_item', 'return',
    'order_claim_item_image', 'order_claim_item', 'order_claim',
    'order_exchange_item', 'order_exchange',
    'order_credit_line', 'order_shipping',
    'order_shipping_method_adjustment', 'order_shipping_method_tax_line',
    'order_shipping_method',
    'order_line_item_adjustment', 'order_line_item_tax_line',
    'order_item', 'order_line_item',
    'order_summary', 'order_transaction',
    'order', 'order_address',

    -- 3. CARRITOS
    'cart_line_item_adjustment', 'cart_line_item_tax_line', 'cart_line_item',
    'cart_shipping_method_adjustment', 'cart_shipping_method_tax_line',
    'cart_shipping_method', 'credit_line',
    'cart', 'cart_address',

    -- 4. PAGOS  (se CONSERVAN payment_provider y refund_reason)
    'capture', 'refund', 'payment', 'payment_session',
    'payment_collection_payment_providers', 'payment_collection',
    'account_holder', 'payment_method_token',

    -- 5. DESPACHOS  (se CONSERVAN shipping_option*, shipping_profile,
    --    fulfillment_set, fulfillment_provider, service_zone, geo_zone)
    'fulfillment_label', 'fulfillment_item', 'fulfillment',
    'fulfillment_address',

    -- 6. RESERVAS de stock  (NO se tocan inventory_item ni inventory_level)
    'reservation_item',

    -- 7. MÓDULOS PROPIOS DE MANADA
    'subscription_charge', 'subscription', 'pet',
    'flow_payment', 'flow_customer', 'flow_subscription', 'flow_plan',
    'saved_card',

    -- 8. CLIENTES  (se conserva customer_group)
    'customer_group_customer', 'customer_address', 'customer',

    -- 9. VARIOS  (se conserva notification_provider)
    'notification', 'workflow_execution',

    -- 10. TOKENS efímeros de auth
    'auth_password_reset_token', 'auth_verification_token', 'auth_verification'
  ];
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
        JOIN pg_namespace ns ON ns.oid = c.relnamespace
       WHERE c.relname = t AND ns.nspname = 'public' AND c.relkind = 'r'
    ) THEN
      RAISE NOTICE 'omitida (no existe en este esquema): %', t;
      CONTINUE;
    END IF;
    EXECUTE format('DELETE FROM %I', t);
    GET DIAGNOSTICS n = ROW_COUNT;
    total := total + n;
    IF n > 0 THEN
      RAISE NOTICE '  % → % filas', t, n;
    END IF;
  END LOOP;
  RAISE NOTICE 'TOTAL borrado: % filas', total;
END $$;

-- ═══ CREDENCIALES — el punto delicado ═══
-- La credencial de Carlos tiene user_id Y customer_id en la MISMA fila (se
-- registró como cliente con el correo del admin). Por eso el filtro conserva
-- todo lo que tenga `user_id`, en vez de borrar lo que tenga `customer_id`:
-- ese criterio le habría borrado el acceso al Admin.
DELETE FROM provider_identity
 WHERE auth_identity_id IN (
   SELECT id FROM auth_identity WHERE NOT (app_metadata ? 'user_id')
 );
DELETE FROM auth_identity WHERE NOT (app_metadata ? 'user_id');

-- Su cliente sí se borró arriba → se le quita la llave para que no quede
-- apuntando a un cliente inexistente (rompería el login del storefront).
UPDATE auth_identity
   SET app_metadata = app_metadata - 'customer_id'
 WHERE app_metadata ? 'user_id';

-- ═══ GUARDA: aborta sola si el catálogo cambió ═══
DO $$
DECLARE g _guard%ROWTYPE; p int; v int; pr int; ii int; il int; im int;
BEGIN
  SELECT * INTO g FROM _guard;
  SELECT count(*) INTO p  FROM product;
  SELECT count(*) INTO v  FROM product_variant;
  SELECT count(*) INTO pr FROM price;
  SELECT count(*) INTO ii FROM inventory_item;
  SELECT count(*) INTO il FROM inventory_level;
  SELECT count(*) INTO im FROM image;
  IF (p,v,pr,ii,il,im) IS DISTINCT FROM
     (g.product,g.variant,g.price,g.inv_item,g.inv_level,g.image) THEN
    RAISE EXCEPTION 'CATALOGO ALTERADO: antes=(%,%,%,%,%,%) ahora=(%,%,%,%,%,%)',
      g.product,g.variant,g.price,g.inv_item,g.inv_level,g.image,p,v,pr,ii,il,im;
  END IF;
  RAISE NOTICE 'Catalogo intacto: % productos, % variantes, % precios, % niveles de inventario',
    p, v, pr, il;
END $$;

-- ═══ Verificación final ═══
SELECT 'admin'          as t, count(*) FROM auth_identity WHERE app_metadata ? 'user_id'
UNION ALL SELECT 'credenciales', count(*) FROM auth_identity
UNION ALL SELECT 'clientes',      count(*) FROM customer
UNION ALL SELECT 'ordenes',       count(*) FROM "order"
UNION ALL SELECT 'carritos',      count(*) FROM cart
UNION ALL SELECT 'mascotas',      count(*) FROM pet
UNION ALL SELECT 'suscripciones', count(*) FROM subscription
UNION ALL SELECT 'flow_customer', count(*) FROM flow_customer
UNION ALL SELECT 'reservas',      count(*) FROM reservation_item
UNION ALL SELECT 'productos',     count(*) FROM product
UNION ALL SELECT 'inventario',    count(*) FROM inventory_level;

ROLLBACK;  -- ← cambiar por COMMIT solo si todo cuadra
-- Ejecutado con COMMIT el 2026-08-05: 411 filas borradas, catálogo intacto
-- (158 productos / 282 variantes / 288 precios / 282 niveles), admin operativo.
