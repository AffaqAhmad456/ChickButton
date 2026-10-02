-- ChickButton Shopify Order Migration (Phase 3)
-- Safe/additive. Does not delete users, products, carts, or previous orders.

begin;

alter table public.orders
  add column if not exists shopify_order_id text,
  add column if not exists shopify_order_name text;

create unique index if not exists orders_shopify_order_id_unique
  on public.orders (shopify_order_id)
  where shopify_order_id is not null;

alter table public.order_items
  add column if not exists shopify_product_id text,
  add column if not exists shopify_variant_id text;

-- New Shopify order items reference Shopify variants instead of the legacy
-- Supabase product_variants table, so the old FK column must be nullable.
alter table public.order_items
  alter column product_variant_id drop not null;

alter table public.order_items
  drop constraint if exists order_items_variant_source_check;

alter table public.order_items
  add constraint order_items_variant_source_check
  check (
    product_variant_id is not null
    or shopify_variant_id is not null
  );

commit;
