-- ============================================================================
-- Swipd — схема Supabase (Postgres) + RLS + Storage
-- Запуск: Supabase Dashboard → SQL Editor → вставить целиком → Run.
-- Идемпотентно настолько, насколько возможно (IF NOT EXISTS / OR REPLACE).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
do $$ begin
  create type user_role as enum ('buyer','seller');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('Оформлен','В пути','Доставлен','Отменён');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_kind as enum ('image','video');
exception when duplicate_object then null; end $$;

-- ---------- PROFILES (1:1 с auth.users) ----------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default 'Гость',
  username    text unique,
  avatar_url  text,
  role        user_role not null default 'buyer',
  created_at  timestamptz not null default now()
);

-- автосоздание профиля при регистрации
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'name','Гость'),
          '@' || split_part(new.email,'@',1))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- STORES (магазины продавцов) ----------
create table if not exists stores (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  name       text not null,
  slug       text unique not null,
  tagline    text,
  cover_url  text,
  verified   boolean not null default false,
  status     text not null default 'active',   -- active | hidden | banned
  created_at timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  title       text not null,
  price       integer not null check (price >= 0),
  old_price   integer check (old_price >= 0),
  category    text not null,
  description text,
  details     jsonb not null default '[]',
  sizes       text[] not null default '{}',
  colors      jsonb not null default '[]',      -- [{name,hex}]
  style_tags  text[] not null default '{}',
  in_stock    boolean not null default true,
  rating      numeric(2,1) not null default 5.0,
  created_at  timestamptz not null default now()
);
create index if not exists products_store_idx on products(store_id);
create index if not exists products_category_idx on products(category);

-- ---------- PRODUCT MEDIA (фото/видео) ----------
create table if not exists product_media (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  kind       media_kind not null default 'image',
  url        text,                 -- для фото (Storage public url)
  poster_url text,                 -- постер для видео
  stream_uid text,                 -- id видео в Cloudflare Stream
  sort       integer not null default 0
);
create index if not exists media_product_idx on product_media(product_id);

-- ---------- ADDRESSES ----------
create table if not exists addresses (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references profiles(id) on delete cascade,
  label     text not null default 'Дом',
  city      text not null,
  street    text not null,
  recipient text not null,
  phone     text
);

-- ---------- ORDERS ----------
create table if not exists orders (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid not null references profiles(id) on delete set null,
  store_id   uuid references stores(id) on delete set null,
  status     order_status not null default 'Оформлен',
  total      integer not null default 0,
  customer   jsonb,                 -- {name,phone,city,address}
  delivery   text,
  payment    text,
  created_at timestamptz not null default now()
);
create index if not exists orders_buyer_idx on orders(buyer_id);
create index if not exists orders_store_idx on orders(store_id);

create table if not exists order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  size       text, color text, qty integer not null default 1,
  price      integer not null default 0
);

-- ---------- REVIEWS ----------
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  text       text,
  photo_url  text,
  created_at timestamptz not null default now()
);

-- ---------- FOLLOWS (подписки на магазины) ----------
create table if not exists follows (
  user_id  uuid not null references profiles(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  primary key (user_id, store_id)
);

-- ============================================================================
-- RLS — Row Level Security
-- ============================================================================
alter table profiles      enable row level security;
alter table stores        enable row level security;
alter table products      enable row level security;
alter table product_media enable row level security;
alter table addresses     enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;
alter table reviews       enable row level security;
alter table follows       enable row level security;

-- helper: владелец магазина по продукту
create or replace function owns_store(p_store uuid)
returns boolean language sql stable as $$
  select exists(select 1 from stores s where s.id = p_store and s.owner_id = auth.uid());
$$;

-- PROFILES: читать всем (публичные витрины), менять только своё
drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles for select using (true);
drop policy if exists profiles_write on profiles;
create policy profiles_write on profiles for update using (id = auth.uid());

-- STORES: читать активные всем; CRUD — владелец
drop policy if exists stores_read on stores;
create policy stores_read on stores for select using (status = 'active' or owner_id = auth.uid());
drop policy if exists stores_cud on stores;
create policy stores_cud on stores for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- PRODUCTS: читать всем; CRUD — владелец магазина
drop policy if exists products_read on products;
create policy products_read on products for select using (true);
drop policy if exists products_cud on products;
create policy products_cud on products for all using (owns_store(store_id)) with check (owns_store(store_id));

-- PRODUCT_MEDIA: читать всем; CRUD — владелец магазина товара
drop policy if exists media_read on product_media;
create policy media_read on product_media for select using (true);
drop policy if exists media_cud on product_media;
create policy media_cud on product_media for all
  using (exists(select 1 from products p where p.id = product_id and owns_store(p.store_id)))
  with check (exists(select 1 from products p where p.id = product_id and owns_store(p.store_id)));

-- ADDRESSES: только свои
drop policy if exists addr_all on addresses;
create policy addr_all on addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ORDERS: покупатель видит свои, продавец — заказы своего магазина
drop policy if exists orders_read on orders;
create policy orders_read on orders for select using (buyer_id = auth.uid() or owns_store(store_id));
drop policy if exists orders_insert on orders;
create policy orders_insert on orders for insert with check (buyer_id = auth.uid());
drop policy if exists orders_update on orders;
create policy orders_update on orders for update using (buyer_id = auth.uid() or owns_store(store_id));

-- ORDER_ITEMS: по доступу к заказу
drop policy if exists oi_all on order_items;
create policy oi_all on order_items for all
  using (exists(select 1 from orders o where o.id = order_id and (o.buyer_id = auth.uid() or owns_store(o.store_id))))
  with check (exists(select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid()));

-- REVIEWS: читать всем; писать — автор
drop policy if exists reviews_read on reviews;
create policy reviews_read on reviews for select using (true);
drop policy if exists reviews_write on reviews;
create policy reviews_write on reviews for all using (author_id = auth.uid()) with check (author_id = auth.uid());

-- FOLLOWS: только свои подписки
drop policy if exists follows_all on follows;
create policy follows_all on follows for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- STORAGE buckets (фото товаров / обложки магазинов)
-- ============================================================================
insert into storage.buckets (id, name, public) values ('product-media','product-media', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('store-media','store-media', true)
  on conflict (id) do nothing;

-- читать публично, загружать — авторизованным (путь начинается с их uid)
drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects for select
  using (bucket_id in ('product-media','store-media'));

drop policy if exists media_auth_write on storage.objects;
create policy media_auth_write on storage.objects for insert to authenticated
  with check (bucket_id in ('product-media','store-media')
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists media_auth_modify on storage.objects;
create policy media_auth_modify on storage.objects for update to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists media_auth_delete on storage.objects;
create policy media_auth_delete on storage.objects for delete to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
