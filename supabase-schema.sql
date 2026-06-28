-- Frever Wishlist Supabase schema

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text default 'member',
  created_at timestamp with time zone default now()
);

create table if not exists public.registries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade,
  invite_code text unique not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.registry_members (
  id uuid primary key default gen_random_uuid(),
  registry_id uuid references public.registries(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member',
  created_at timestamp with time zone default now(),
  unique(registry_id, user_id)
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  registry_id uuid references public.registries(id) on delete cascade,
  title text not null,
  person_name text not null,
  occasion text,
  wishlist_code text unique not null,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists public.wishlist_members (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid references public.wishlists(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  can_view boolean default true,
  can_edit boolean default false,
  created_at timestamp with time zone default now(),
  unique(wishlist_id, user_id)
);

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid references public.wishlists(id) on delete cascade,
  name text not null,
  image_url text,
  cost numeric(10,2),
  quantity integer default 1,
  priority text default 'N/A',
  status text default 'Available',
  notes text,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists public.gift_links (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid references public.gifts(id) on delete cascade,
  retailer text,
  url text not null,
  price numeric(10,2),
  created_at timestamp with time zone default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid references public.gifts(id) on delete cascade,
  buyer_id uuid references public.profiles(id) on delete cascade,
  quantity integer default 1,
  price numeric(10,2),
  purchased_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
alter table public.registries enable row level security;
alter table public.registry_members enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_members enable row level security;
alter table public.gifts enable row level security;
alter table public.gift_links enable row level security;
alter table public.purchases enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

drop policy if exists "Logged in users can view registries" on public.registries;
create policy "Logged in users can view registries"
on public.registries for select
using (auth.uid() is not null);

drop policy if exists "Logged in users can create registries" on public.registries;
create policy "Logged in users can create registries"
on public.registries for insert
with check (auth.uid() = owner_id);

drop policy if exists "Logged in users can view registry members" on public.registry_members;
create policy "Logged in users can view registry members"
on public.registry_members for select
using (auth.uid() is not null);

drop policy if exists "Logged in users can join registries" on public.registry_members;
create policy "Logged in users can join registries"
on public.registry_members for insert
with check (auth.uid() = user_id);

drop policy if exists "Logged in users can view wishlists" on public.wishlists;
create policy "Logged in users can view wishlists"
on public.wishlists for select
using (auth.uid() is not null);

drop policy if exists "Logged in users can create wishlists" on public.wishlists;
create policy "Logged in users can create wishlists"
on public.wishlists for insert
with check (auth.uid() = created_by);

drop policy if exists "Logged in users can view wishlist members" on public.wishlist_members;
create policy "Logged in users can view wishlist members"
on public.wishlist_members for select
using (auth.uid() is not null);

drop policy if exists "Logged in users can add wishlist access" on public.wishlist_members;
create policy "Logged in users can add wishlist access"
on public.wishlist_members for insert
with check (auth.uid() = user_id);

drop policy if exists "Logged in users can view gifts" on public.gifts;
create policy "Logged in users can view gifts"
on public.gifts for select
using (auth.uid() is not null);

drop policy if exists "Logged in users can create gifts" on public.gifts;
create policy "Logged in users can create gifts"
on public.gifts for insert
with check (auth.uid() = created_by);

drop policy if exists "Logged in users can update gifts" on public.gifts;
create policy "Logged in users can update gifts"
on public.gifts for update
using (auth.uid() is not null);

drop policy if exists "Logged in users can view gift links" on public.gift_links;
create policy "Logged in users can view gift links"
on public.gift_links for select
using (auth.uid() is not null);

drop policy if exists "Logged in users can add gift links" on public.gift_links;
create policy "Logged in users can add gift links"
on public.gift_links for insert
with check (auth.uid() is not null);

drop policy if exists "Users can view own purchases" on public.purchases;
create policy "Users can view own purchases"
on public.purchases for select
using (auth.uid() = buyer_id);

drop policy if exists "Users can add own purchases" on public.purchases;
create policy "Users can add own purchases"
on public.purchases for insert
with check (auth.uid() = buyer_id);
