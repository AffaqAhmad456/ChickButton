-- ChickButton FINAL FULL RESET + Shopify-aligned test catalog
-- WARNING: This script intentionally deletes ALL existing Supabase Auth users and all app data.
-- Run ONCE in Supabase SQL Editor when you want a completely fresh test environment.

begin;

-- 1) Clear all customer activity/catalog data first.
truncate table
  public.order_status_history,
  public.order_items,
  public.orders,
  public.wishlist_items,
  public.cart_items,
  public.carts,
  public.product_categories,
  public.product_variants,
  public.products,
  public.categories,
  public.addresses
restart identity cascade;

-- 2) Remove all existing login accounts. profiles are linked to auth.users with ON DELETE CASCADE.
delete from auth.users;

-- 3) Remove any leftovers from the old admin build.
drop table if exists public.wallet_transactions cascade;
drop policy if exists "admin profile read" on public.profiles;
drop policy if exists "admin catalog all categories" on public.categories;
drop policy if exists "admin catalog all products" on public.products;
drop policy if exists "admin catalog all variants" on public.product_variants;
drop policy if exists "admin catalog all product categories" on public.product_categories;
drop policy if exists "admin orders all" on public.orders;
drop policy if exists "admin order items all" on public.order_items;
drop policy if exists "admin order history all" on public.order_status_history;
drop trigger if exists protect_profile_role_trigger on public.profiles;
drop function if exists public.protect_profile_role();
drop function if exists public.is_admin();

-- 4) Customer-only / guest checkout support.
alter table public.orders alter column user_id drop not null;

drop policy if exists "guest orders insert" on public.orders;
drop policy if exists "guest order items insert" on public.order_items;
drop policy if exists "guest order history insert" on public.order_status_history;
drop function if exists public.is_guest_order(uuid);

create or replace function public.is_guest_order(target_order uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orders
    where id = target_order and user_id is null
  );
$$;
revoke all on function public.is_guest_order(uuid) from public;
grant execute on function public.is_guest_order(uuid) to anon, authenticated;

create policy "guest orders insert"
on public.orders for insert to anon
with check (user_id is null and status = 'confirmed' and payment_status = 'pending');

create policy "guest order items insert"
on public.order_items for insert to anon
with check (public.is_guest_order(order_id));

create policy "guest order history insert"
on public.order_status_history for insert to anon
with check (changed_by is null and public.is_guest_order(order_id));

-- 5) Shopify-aligned category structure.

insert into public.categories (name, slug, image_url) values
  ('BABY · Baby Boys','baby-boys','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85'),
  ('BABY · Baby Girls','baby-girls','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85'),
  ('BABY · Baby Sets','baby-sets','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85'),
  ('BABY · Baby Frocks','baby-frocks','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85'),
  ('BOYS · Sets','boys-sets','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85'),
  ('BOYS · Shirts','boys-shirts','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85'),
  ('BOYS · Pants','boys-pants','https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85'),
  ('BOYS · Formal','boys-formal','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85'),
  ('BOYS · Traditional','boys-traditional','https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85'),
  ('GIRLS · Sets','girls-sets','https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85'),
  ('GIRLS · Shirts','girls-shirts','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85'),
  ('GIRLS · Pants','girls-pants','https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85'),
  ('GIRLS · Frocks','girls-frocks','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85'),
  ('GIRLS · Formal','girls-formal','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85'),
  ('GIRLS · Traditional','girls-traditional','https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85'),
  ('SUMMER','summer','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85'),
  ('WINTER','winter','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85'),
  ('NEW ARRIVALS','new-arrivals','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85'),
  ('SALE','sale','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85');

-- 6) Two test products for every requested category/type.
insert into public.products (title, slug, description, primary_image_url, secondary_image_url, status) values
  ('Mini Sailor Romper','mini-sailor-romper','BABY / Baby Boys testing product before Shopify sync','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85','active'),
  ('Tiny Explorer Set','tiny-explorer-set','BABY / Baby Boys testing product before Shopify sync','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85','active'),
  ('Blossom Baby Dress','blossom-baby-dress','BABY / Baby Girls testing product before Shopify sync','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85','active'),
  ('Peach Petal Romper','peach-petal-romper','BABY / Baby Girls testing product before Shopify sync','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','active'),
  ('Cloud Snuggle Set','cloud-snuggle-set','BABY / Baby Sets testing product before Shopify sync','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','active'),
  ('Teddy Two-Piece','teddy-two-piece','BABY / Baby Sets testing product before Shopify sync','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85','active'),
  ('Rosebud Baby Frock','rosebud-baby-frock','BABY / Baby Frocks testing product before Shopify sync','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','active'),
  ('Lemon Daisy Frock','lemon-daisy-frock','BABY / Baby Frocks testing product before Shopify sync','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85','active'),
  ('Adventure Co-ord','adventure-coord','BOYS / Sets testing product before Shopify sync','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','active'),
  ('Weekend Polo Set','weekend-polo-set','BOYS / Sets testing product before Shopify sync','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85','active'),
  ('Sky Check Shirt','sky-check-shirt','BOYS / Shirts testing product before Shopify sync','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85','active'),
  ('Little Oxford Shirt','little-oxford-shirt','BOYS / Shirts testing product before Shopify sync','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85','active'),
  ('Comfy Chino Pants','comfy-chino-pants','BOYS / Pants testing product before Shopify sync','https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','active'),
  ('Playday Cargo Pants','playday-cargo-pants','BOYS / Pants testing product before Shopify sync','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85','active'),
  ('Junior Blazer Set','junior-blazer-set','BOYS / Formal testing product before Shopify sync','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','active'),
  ('Celebration Waistcoat Set','celebration-waistcoat-set','BOYS / Formal testing product before Shopify sync','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85','active'),
  ('Moonlight Kurta Set','moonlight-kurta-set','BOYS / Traditional testing product before Shopify sync','https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','active'),
  ('Little Prince Shalwar Kameez','little-prince-shalwar-kameez','BOYS / Traditional testing product before Shopify sync','https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85','active'),
  ('Daisy Play Set','daisy-play-set','GIRLS / Sets testing product before Shopify sync','https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85','active'),
  ('Little Linen Co-ord','little-linen-coord','GIRLS / Sets testing product before Shopify sync','https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','active'),
  ('Ruffle Collar Shirt','ruffle-collar-shirt','GIRLS / Shirts testing product before Shopify sync','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85','active'),
  ('Sunshine Tunic Shirt','sunshine-tunic-shirt','GIRLS / Shirts testing product before Shopify sync','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','active'),
  ('Soft Twill Pants','soft-twill-pants','GIRLS / Pants testing product before Shopify sync','https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','active'),
  ('Weekend Wide-Leg Pants','weekend-wide-leg-pants','GIRLS / Pants testing product before Shopify sync','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85','active'),
  ('Sunday Garden Dress','sunday-garden-dress','GIRLS / Frocks testing product before Shopify sync','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','active'),
  ('Storybook Party Frock','storybook-party-frock','GIRLS / Frocks testing product before Shopify sync','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85','active'),
  ('Celebration Tulle Dress','celebration-tulle-dress','GIRLS / Formal testing product before Shopify sync','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85','active'),
  ('Pearl Bow Dress','pearl-bow-dress','GIRLS / Formal testing product before Shopify sync','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','active'),
  ('Noor Embroidered Suit','noor-embroidered-suit','GIRLS / Traditional testing product before Shopify sync','https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','active'),
  ('Rose Kurta Trouser','rose-kurta-trouser','GIRLS / Traditional testing product before Shopify sync','https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85','active'),
  ('Sunny Cotton Set','sunny-cotton-set','SUMMER / Summer testing product before Shopify sync','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85','active'),
  ('Breezy Linen Dress','breezy-linen-dress','SUMMER / Summer testing product before Shopify sync','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','active'),
  ('Cozy Knit Set','cozy-knit-set','WINTER / Winter testing product before Shopify sync','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','active'),
  ('Snowday Hoodie Set','snowday-hoodie-set','WINTER / Winter testing product before Shopify sync','https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85','active'),
  ('Cloud Pocket Set','cloud-pocket-set','NEW ARRIVALS / New Arrivals testing product before Shopify sync','https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85','active'),
  ('Fresh Bloom Co-ord','fresh-bloom-coord','NEW ARRIVALS / New Arrivals testing product before Shopify sync','https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','active'),
  ('Sweetheart Party Dress','sweetheart-party-dress','SALE / Sale testing product before Shopify sync','https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85','active'),
  ('Everyday Denim Set','everyday-denim-set','SALE / Sale testing product before Shopify sync','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85','https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85','active');

-- 7) Every displayed size has a real active variant with stock.
insert into public.product_variants
(product_id, sku, title, size, color, price, compare_at_price, inventory_quantity, image_url, is_active)
values
  ((select id from public.products where slug='mini-sailor-romper'),'CB-01-01','0–3M','0–3M','Blue',2450,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='mini-sailor-romper'),'CB-01-02','3–6M','3–6M','Blue',2450,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='mini-sailor-romper'),'CB-01-03','6–12M','6–12M','Blue',2450,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='tiny-explorer-set'),'CB-02-01','3–6M','3–6M','Beige',2950,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='tiny-explorer-set'),'CB-02-02','6–12M','6–12M','Beige',2950,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='tiny-explorer-set'),'CB-02-03','12–18M','12–18M','Beige',2950,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='blossom-baby-dress'),'CB-03-01','0–3M','0–3M','Pink',2750,null,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='blossom-baby-dress'),'CB-03-02','3–6M','3–6M','Pink',2750,null,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='blossom-baby-dress'),'CB-03-03','6–12M','6–12M','Pink',2750,null,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='peach-petal-romper'),'CB-04-01','3–6M','3–6M','Orange',2550,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='peach-petal-romper'),'CB-04-02','6–12M','6–12M','Orange',2550,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='peach-petal-romper'),'CB-04-03','12–18M','12–18M','Orange',2550,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='cloud-snuggle-set'),'CB-05-01','0–3M','0–3M','Blue',3250,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='cloud-snuggle-set'),'CB-05-02','3–6M','3–6M','Blue',3250,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='cloud-snuggle-set'),'CB-05-03','6–12M','6–12M','Blue',3250,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='teddy-two-piece'),'CB-06-01','3–6M','3–6M','Beige',3150,null,50,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='teddy-two-piece'),'CB-06-02','6–12M','6–12M','Beige',3150,null,50,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='teddy-two-piece'),'CB-06-03','12–18M','12–18M','Beige',3150,null,50,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='rosebud-baby-frock'),'CB-07-01','3–6M','3–6M','Pink',3350,null,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='rosebud-baby-frock'),'CB-07-02','6–12M','6–12M','Pink',3350,null,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='rosebud-baby-frock'),'CB-07-03','12–18M','12–18M','Pink',3350,null,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='lemon-daisy-frock'),'CB-08-01','3–6M','3–6M','Yellow',3450,null,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='lemon-daisy-frock'),'CB-08-02','6–12M','6–12M','Yellow',3450,null,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='lemon-daisy-frock'),'CB-08-03','12–18M','12–18M','Yellow',3450,null,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='adventure-coord'),'CB-09-01','3–4Y','3–4Y','Blue',3950,null,50,'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='adventure-coord'),'CB-09-02','4–5Y','4–5Y','Blue',3950,null,50,'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='adventure-coord'),'CB-09-03','6–7Y','6–7Y','Blue',3950,null,50,'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='weekend-polo-set'),'CB-10-01','3–4Y','3–4Y','Green',3650,null,50,'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='weekend-polo-set'),'CB-10-02','4–5Y','4–5Y','Green',3650,null,50,'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='weekend-polo-set'),'CB-10-03','6–7Y','6–7Y','Green',3650,null,50,'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sky-check-shirt'),'CB-11-01','3–4Y','3–4Y','Blue',2250,null,50,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sky-check-shirt'),'CB-11-02','4–5Y','4–5Y','Blue',2250,null,50,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sky-check-shirt'),'CB-11-03','6–7Y','6–7Y','Blue',2250,null,50,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='little-oxford-shirt'),'CB-12-01','3–4Y','3–4Y','Grey',2450,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='little-oxford-shirt'),'CB-12-02','4–5Y','4–5Y','Grey',2450,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='little-oxford-shirt'),'CB-12-03','6–7Y','6–7Y','Grey',2450,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='comfy-chino-pants'),'CB-13-01','3–4Y','3–4Y','Beige',2650,null,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='comfy-chino-pants'),'CB-13-02','4–5Y','4–5Y','Beige',2650,null,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='comfy-chino-pants'),'CB-13-03','6–7Y','6–7Y','Beige',2650,null,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='playday-cargo-pants'),'CB-14-01','3–4Y','3–4Y','Green',2850,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='playday-cargo-pants'),'CB-14-02','4–5Y','4–5Y','Green',2850,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='playday-cargo-pants'),'CB-14-03','6–7Y','6–7Y','Green',2850,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='junior-blazer-set'),'CB-15-01','6–7Y','6–7Y','Grey',6850,null,50,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='junior-blazer-set'),'CB-15-02','8–9Y','8–9Y','Grey',6850,null,50,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='junior-blazer-set'),'CB-15-03','10–11Y','10–11Y','Grey',6850,null,50,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='celebration-waistcoat-set'),'CB-16-01','6–7Y','6–7Y','Blue',6250,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='celebration-waistcoat-set'),'CB-16-02','8–9Y','8–9Y','Blue',6250,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='celebration-waistcoat-set'),'CB-16-03','10–11Y','10–11Y','Blue',6250,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='moonlight-kurta-set'),'CB-17-01','3–4Y','3–4Y','Blue',5250,null,50,'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='moonlight-kurta-set'),'CB-17-02','4–5Y','4–5Y','Blue',5250,null,50,'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='moonlight-kurta-set'),'CB-17-03','6–7Y','6–7Y','Blue',5250,null,50,'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='little-prince-shalwar-kameez'),'CB-18-01','3–4Y','3–4Y','Beige',4950,null,50,'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='little-prince-shalwar-kameez'),'CB-18-02','4–5Y','4–5Y','Beige',4950,null,50,'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='little-prince-shalwar-kameez'),'CB-18-03','6–7Y','6–7Y','Beige',4950,null,50,'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='daisy-play-set'),'CB-19-01','3–4Y','3–4Y','Green',3650,4100,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='daisy-play-set'),'CB-19-02','4–5Y','4–5Y','Green',3650,4100,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='daisy-play-set'),'CB-19-03','6–7Y','6–7Y','Green',3650,4100,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='little-linen-coord'),'CB-20-01','3–4Y','3–4Y','Beige',5150,null,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='little-linen-coord'),'CB-20-02','4–5Y','4–5Y','Beige',5150,null,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='little-linen-coord'),'CB-20-03','6–7Y','6–7Y','Beige',5150,null,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='ruffle-collar-shirt'),'CB-21-01','3–4Y','3–4Y','Pink',2350,null,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='ruffle-collar-shirt'),'CB-21-02','4–5Y','4–5Y','Pink',2350,null,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='ruffle-collar-shirt'),'CB-21-03','6–7Y','6–7Y','Pink',2350,null,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sunshine-tunic-shirt'),'CB-22-01','3–4Y','3–4Y','Yellow',2450,null,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sunshine-tunic-shirt'),'CB-22-02','4–5Y','4–5Y','Yellow',2450,null,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sunshine-tunic-shirt'),'CB-22-03','6–7Y','6–7Y','Yellow',2450,null,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='soft-twill-pants'),'CB-23-01','3–4Y','3–4Y','Beige',2550,null,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='soft-twill-pants'),'CB-23-02','4–5Y','4–5Y','Beige',2550,null,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='soft-twill-pants'),'CB-23-03','6–7Y','6–7Y','Beige',2550,null,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='weekend-wide-leg-pants'),'CB-24-01','6–7Y','6–7Y','Purple',2750,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='weekend-wide-leg-pants'),'CB-24-02','8–9Y','8–9Y','Purple',2750,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='weekend-wide-leg-pants'),'CB-24-03','10–11Y','10–11Y','Purple',2750,null,50,'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sunday-garden-dress'),'CB-25-01','3–4Y','3–4Y','Pink',4450,5200,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sunday-garden-dress'),'CB-25-02','4–5Y','4–5Y','Pink',4450,5200,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sunday-garden-dress'),'CB-25-03','5–6Y','5–6Y','Pink',4450,5200,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='storybook-party-frock'),'CB-26-01','3–4Y','3–4Y','Pink',5450,6100,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='storybook-party-frock'),'CB-26-02','4–5Y','4–5Y','Pink',5450,6100,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='storybook-party-frock'),'CB-26-03','5–6Y','5–6Y','Pink',5450,6100,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='celebration-tulle-dress'),'CB-27-01','6–7Y','6–7Y','Pink',5950,6900,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='celebration-tulle-dress'),'CB-27-02','8–9Y','8–9Y','Pink',5950,6900,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='celebration-tulle-dress'),'CB-27-03','10–11Y','10–11Y','Pink',5950,6900,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='pearl-bow-dress'),'CB-28-01','6–7Y','6–7Y','Beige',6250,null,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='pearl-bow-dress'),'CB-28-02','8–9Y','8–9Y','Beige',6250,null,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='pearl-bow-dress'),'CB-28-03','10–11Y','10–11Y','Beige',6250,null,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='noor-embroidered-suit'),'CB-29-01','3–4Y','3–4Y','Green',5350,null,50,'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='noor-embroidered-suit'),'CB-29-02','4–5Y','4–5Y','Green',5350,null,50,'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='noor-embroidered-suit'),'CB-29-03','6–7Y','6–7Y','Green',5350,null,50,'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='rose-kurta-trouser'),'CB-30-01','3–4Y','3–4Y','Pink',5150,null,50,'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='rose-kurta-trouser'),'CB-30-02','4–5Y','4–5Y','Pink',5150,null,50,'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='rose-kurta-trouser'),'CB-30-03','6–7Y','6–7Y','Pink',5150,null,50,'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sunny-cotton-set'),'CB-31-01','3–4Y','3–4Y','Yellow',3350,null,50,'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sunny-cotton-set'),'CB-31-02','4–5Y','4–5Y','Yellow',3350,null,50,'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sunny-cotton-set'),'CB-31-03','6–7Y','6–7Y','Yellow',3350,null,50,'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='breezy-linen-dress'),'CB-32-01','3–4Y','3–4Y','Beige',4250,null,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='breezy-linen-dress'),'CB-32-02','4–5Y','4–5Y','Beige',4250,null,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='breezy-linen-dress'),'CB-32-03','6–7Y','6–7Y','Beige',4250,null,50,'https://images.unsplash.com/photo-1519238360530-d9c7b1f8003c?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='cozy-knit-set'),'CB-33-01','3–4Y','3–4Y','Beige',4550,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='cozy-knit-set'),'CB-33-02','4–5Y','4–5Y','Beige',4550,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='cozy-knit-set'),'CB-33-03','6–7Y','6–7Y','Beige',4550,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='snowday-hoodie-set'),'CB-34-01','6–7Y','6–7Y','Blue',4750,null,50,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='snowday-hoodie-set'),'CB-34-02','8–9Y','8–9Y','Blue',4750,null,50,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='snowday-hoodie-set'),'CB-34-03','10–11Y','10–11Y','Blue',4750,null,50,'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='cloud-pocket-set'),'CB-35-01','2–3Y','2–3Y','Blue',3950,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='cloud-pocket-set'),'CB-35-02','3–4Y','3–4Y','Blue',3950,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='cloud-pocket-set'),'CB-35-03','4–5Y','4–5Y','Blue',3950,null,50,'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='fresh-bloom-coord'),'CB-36-01','3–4Y','3–4Y','Pink',4150,null,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='fresh-bloom-coord'),'CB-36-02','4–5Y','4–5Y','Pink',4150,null,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='fresh-bloom-coord'),'CB-36-03','6–7Y','6–7Y','Pink',4150,null,50,'https://images.unsplash.com/photo-1607453998774-d533f65dac99?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sweetheart-party-dress'),'CB-37-01','3–4Y','3–4Y','Pink',3990,5250,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sweetheart-party-dress'),'CB-37-02','4–5Y','4–5Y','Pink',3990,5250,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='sweetheart-party-dress'),'CB-37-03','6–7Y','6–7Y','Pink',3990,5250,50,'https://images.unsplash.com/photo-1560506840-ec148e82a604?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='everyday-denim-set'),'CB-38-01','3–4Y','3–4Y','Blue',3290,4150,50,'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='everyday-denim-set'),'CB-38-02','4–5Y','4–5Y','Blue',3290,4150,50,'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85',true),
  ((select id from public.products where slug='everyday-denim-set'),'CB-38-03','6–7Y','6–7Y','Blue',3290,4150,50,'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=760&q=85',true);

-- 8) Link every product to its Shopify-aligned test category.
insert into public.product_categories (product_id, category_id) values
  ((select id from public.products where slug='mini-sailor-romper'),(select id from public.categories where slug='baby-boys')),
  ((select id from public.products where slug='tiny-explorer-set'),(select id from public.categories where slug='baby-boys')),
  ((select id from public.products where slug='blossom-baby-dress'),(select id from public.categories where slug='baby-girls')),
  ((select id from public.products where slug='peach-petal-romper'),(select id from public.categories where slug='baby-girls')),
  ((select id from public.products where slug='cloud-snuggle-set'),(select id from public.categories where slug='baby-sets')),
  ((select id from public.products where slug='teddy-two-piece'),(select id from public.categories where slug='baby-sets')),
  ((select id from public.products where slug='rosebud-baby-frock'),(select id from public.categories where slug='baby-frocks')),
  ((select id from public.products where slug='lemon-daisy-frock'),(select id from public.categories where slug='baby-frocks')),
  ((select id from public.products where slug='adventure-coord'),(select id from public.categories where slug='boys-sets')),
  ((select id from public.products where slug='weekend-polo-set'),(select id from public.categories where slug='boys-sets')),
  ((select id from public.products where slug='sky-check-shirt'),(select id from public.categories where slug='boys-shirts')),
  ((select id from public.products where slug='little-oxford-shirt'),(select id from public.categories where slug='boys-shirts')),
  ((select id from public.products where slug='comfy-chino-pants'),(select id from public.categories where slug='boys-pants')),
  ((select id from public.products where slug='playday-cargo-pants'),(select id from public.categories where slug='boys-pants')),
  ((select id from public.products where slug='junior-blazer-set'),(select id from public.categories where slug='boys-formal')),
  ((select id from public.products where slug='celebration-waistcoat-set'),(select id from public.categories where slug='boys-formal')),
  ((select id from public.products where slug='moonlight-kurta-set'),(select id from public.categories where slug='boys-traditional')),
  ((select id from public.products where slug='little-prince-shalwar-kameez'),(select id from public.categories where slug='boys-traditional')),
  ((select id from public.products where slug='daisy-play-set'),(select id from public.categories where slug='girls-sets')),
  ((select id from public.products where slug='little-linen-coord'),(select id from public.categories where slug='girls-sets')),
  ((select id from public.products where slug='ruffle-collar-shirt'),(select id from public.categories where slug='girls-shirts')),
  ((select id from public.products where slug='sunshine-tunic-shirt'),(select id from public.categories where slug='girls-shirts')),
  ((select id from public.products where slug='soft-twill-pants'),(select id from public.categories where slug='girls-pants')),
  ((select id from public.products where slug='weekend-wide-leg-pants'),(select id from public.categories where slug='girls-pants')),
  ((select id from public.products where slug='sunday-garden-dress'),(select id from public.categories where slug='girls-frocks')),
  ((select id from public.products where slug='storybook-party-frock'),(select id from public.categories where slug='girls-frocks')),
  ((select id from public.products where slug='celebration-tulle-dress'),(select id from public.categories where slug='girls-formal')),
  ((select id from public.products where slug='pearl-bow-dress'),(select id from public.categories where slug='girls-formal')),
  ((select id from public.products where slug='noor-embroidered-suit'),(select id from public.categories where slug='girls-traditional')),
  ((select id from public.products where slug='rose-kurta-trouser'),(select id from public.categories where slug='girls-traditional')),
  ((select id from public.products where slug='sunny-cotton-set'),(select id from public.categories where slug='summer')),
  ((select id from public.products where slug='breezy-linen-dress'),(select id from public.categories where slug='summer')),
  ((select id from public.products where slug='cozy-knit-set'),(select id from public.categories where slug='winter')),
  ((select id from public.products where slug='snowday-hoodie-set'),(select id from public.categories where slug='winter')),
  ((select id from public.products where slug='cloud-pocket-set'),(select id from public.categories where slug='new-arrivals')),
  ((select id from public.products where slug='fresh-bloom-coord'),(select id from public.categories where slug='new-arrivals')),
  ((select id from public.products where slug='sweetheart-party-dress'),(select id from public.categories where slug='sale')),
  ((select id from public.products where slug='everyday-denim-set'),(select id from public.categories where slug='sale'));

commit;

-- Verification: users should be 0, and every product should have stocked variants.
select 'auth_users' as item, count(*)::text as value from auth.users
union all
select 'products', count(*)::text from public.products
union all
select 'variants', count(*)::text from public.product_variants
union all
select 'categories', count(*)::text from public.categories;

select p.slug, pv.size, pv.inventory_quantity
from public.products p
join public.product_variants pv on pv.product_id = p.id
where pv.inventory_quantity <= 0
order by p.slug, pv.size;
