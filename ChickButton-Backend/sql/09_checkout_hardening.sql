-- ChickButton Shopify checkout hardening
-- Safe/additive migration. Run once after 08_shopify_order_migration.sql.

alter table public.orders
  add column if not exists checkout_key text;

create unique index if not exists orders_checkout_key_unique
  on public.orders (checkout_key)
  where checkout_key is not null;
