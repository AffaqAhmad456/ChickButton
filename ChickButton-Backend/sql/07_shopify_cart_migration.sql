-- ChickButton Shopify Cart Migration (Phase 2A)
-- Safe/additive migration. It does NOT delete products, users, orders, or carts.
-- Run once in Supabase SQL Editor before testing signed-in Shopify cart items.

begin;

alter table public.cart_items
  add column if not exists shopify_product_id text,
  add column if not exists shopify_variant_id text,
  add column if not exists product_handle text,
  add column if not exists selected_size text;

-- Old cart rows still use product_variant_id. Shopify rows use shopify_variant_id,
-- so the legacy FK column must be nullable during the transition.
alter table public.cart_items
  alter column product_variant_id drop not null;

-- Prevent duplicate Shopify variants inside the same persisted cart.
create unique index if not exists cart_items_cart_shopify_variant_unique
  on public.cart_items (cart_id, shopify_variant_id)
  where shopify_variant_id is not null;

-- Every cart row must point to either the old Supabase variant or a Shopify variant.
alter table public.cart_items
  drop constraint if exists cart_items_variant_source_check;

alter table public.cart_items
  add constraint cart_items_variant_source_check
  check (
    product_variant_id is not null
    or shopify_variant_id is not null
  );

commit;
