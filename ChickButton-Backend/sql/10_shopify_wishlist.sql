-- Additive storage for customer wishlists backed by Shopify product identity.
-- Apply to Supabase before deploying the updated wishlist API.
-- Legacy public.wishlist_items and public.products are left untouched.

begin;

create table if not exists public.shopify_wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  shopify_product_id text not null check (shopify_product_id ~ '^gid://shopify/Product/[0-9]+$'),
  product_handle text not null check (length(product_handle) between 1 and 255 and product_handle = btrim(product_handle)),
  created_at timestamptz not null default now(),
  constraint shopify_wishlist_items_pkey primary key (user_id, shopify_product_id)
);

create index if not exists shopify_wishlist_items_user_created_idx
  on public.shopify_wishlist_items (user_id, created_at);

create index if not exists shopify_wishlist_items_user_handle_idx
  on public.shopify_wishlist_items (user_id, product_handle);

alter table public.shopify_wishlist_items enable row level security;
revoke all on public.shopify_wishlist_items from public, anon, authenticated;
grant select, insert, delete on public.shopify_wishlist_items to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'shopify_wishlist_items' and policyname = 'shopify wishlist own select'
  ) then
    create policy "shopify wishlist own select"
      on public.shopify_wishlist_items for select to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'shopify_wishlist_items' and policyname = 'shopify wishlist own insert'
  ) then
    create policy "shopify wishlist own insert"
      on public.shopify_wishlist_items for insert to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'shopify_wishlist_items' and policyname = 'shopify wishlist own delete'
  ) then
    create policy "shopify wishlist own delete"
      on public.shopify_wishlist_items for delete to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$$;

commit;
