-- Frever Wishlist v2 schema
-- Safe to run over your current simplified schema.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text default 'member',
  created_at timestamp with time zone default now()
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  person_name text not null,
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
  gift_url text,
  cost numeric(10,2),
  quantity integer default 1,
  priority text default 'N/A',
  status text default 'Available',
  notes text,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid references public.gifts(id) on delete cascade,
  wishlist_id uuid references public.wishlists(id) on delete cascade,
  buyer_id uuid references public.profiles(id) on delete cascade,
  quantity integer default 1,
  price numeric(10,2),
  purchased_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_members enable row level security;
alter table public.gifts enable row level security;
alter table public.purchases enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

drop policy if exists wishlists_select_logged_in on public.wishlists;
create policy wishlists_select_logged_in on public.wishlists for select using (auth.uid() is not null);

drop policy if exists wishlists_insert_own on public.wishlists;
create policy wishlists_insert_own on public.wishlists for insert with check (auth.uid() = created_by);

drop policy if exists wishlists_update_own on public.wishlists;
create policy wishlists_update_own on public.wishlists for update using (auth.uid() = created_by);

drop policy if exists wishlists_delete_own on public.wishlists;
create policy wishlists_delete_own on public.wishlists for delete using (auth.uid() = created_by);

drop policy if exists wishlist_members_select_logged_in on public.wishlist_members;
create policy wishlist_members_select_logged_in on public.wishlist_members for select using (auth.uid() is not null);

drop policy if exists wishlist_members_insert_own on public.wishlist_members;
create policy wishlist_members_insert_own on public.wishlist_members for insert with check (auth.uid() = user_id);

drop policy if exists gifts_select_logged_in on public.gifts;
create policy gifts_select_logged_in on public.gifts for select using (auth.uid() is not null);

drop policy if exists gifts_insert_own on public.gifts;
create policy gifts_insert_own on public.gifts for insert with check (auth.uid() = created_by);

drop policy if exists gifts_update_logged_in on public.gifts;
create policy gifts_update_logged_in on public.gifts for update using (auth.uid() is not null);

drop policy if exists gifts_delete_own on public.gifts;
create policy gifts_delete_own on public.gifts for delete using (auth.uid() = created_by);

drop policy if exists purchases_select_own on public.purchases;
create policy purchases_select_own on public.purchases for select using (auth.uid() = buyer_id);

drop policy if exists purchases_insert_own on public.purchases;
create policy purchases_insert_own on public.purchases for insert with check (auth.uid() = buyer_id);



-- Secure wishlist sharing by code
-- This keeps wishlists hidden until a user joins using the code.

drop policy if exists wishlists_select_logged_in on public.wishlists;
drop policy if exists wishlists_select_allowed on public.wishlists;

create policy wishlists_select_allowed
on public.wishlists
for select
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.wishlist_members wm
    where wm.wishlist_id = wishlists.id
    and wm.user_id = auth.uid()
    and wm.can_view = true
  )
);

create or replace function public.join_wishlist_by_code(code_input text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  found_wishlist_id uuid;
begin
  select id
  into found_wishlist_id
  from public.wishlists
  where upper(wishlist_code) = upper(code_input)
  limit 1;

  if found_wishlist_id is null then
    raise exception 'No wishlist found with that code.';
  end if;

  insert into public.wishlist_members (
    wishlist_id,
    user_id,
    can_view,
    can_edit
  )
  values (
    found_wishlist_id,
    auth.uid(),
    true,
    false
  )
  on conflict (wishlist_id, user_id) do nothing;

  return found_wishlist_id;
end;
$$;


-- v2.1 permission helpers
drop policy if exists wishlist_members_delete_own_or_owner on public.wishlist_members;
create policy wishlist_members_delete_own_or_owner on public.wishlist_members for delete using (user_id = auth.uid() or exists (select 1 from public.wishlists w where w.id = wishlist_members.wishlist_id and w.created_by = auth.uid()));

create or replace function public.get_wishlist_viewers(wishlist_input uuid)
returns table (member_id uuid,user_id uuid,email text,display_name text,can_view boolean,can_edit boolean,created_at timestamptz)
language sql security definer set search_path = public as $$
  select wm.id, wm.user_id, p.email, p.display_name, wm.can_view, wm.can_edit, wm.created_at
  from public.wishlist_members wm left join public.profiles p on p.id = wm.user_id join public.wishlists w on w.id = wm.wishlist_id
  where wm.wishlist_id = wishlist_input and w.created_by = auth.uid() order by wm.created_at asc;
$$;

create or replace function public.remove_wishlist_viewer(member_input uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.wishlist_members wm using public.wishlists w where wm.id = member_input and w.id = wm.wishlist_id and w.created_by = auth.uid();
end;
$$;


-- v2.2 wishlist viewer/removal helpers
-- Run this in Supabase SQL Editor.

drop policy if exists wishlist_members_delete_own_or_owner on public.wishlist_members;

create policy wishlist_members_delete_own_or_owner
on public.wishlist_members
for delete
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.wishlists w
    where w.id = wishlist_members.wishlist_id
    and w.created_by = auth.uid()
  )
);

create or replace function public.get_wishlist_viewers(wishlist_input uuid)
returns table (
  member_id uuid,
  user_id uuid,
  email text,
  display_name text,
  can_view boolean,
  can_edit boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    wm.id as member_id,
    wm.user_id,
    p.email,
    p.display_name,
    wm.can_view,
    wm.can_edit,
    wm.created_at
  from public.wishlist_members wm
  left join public.profiles p on p.id = wm.user_id
  join public.wishlists w on w.id = wm.wishlist_id
  where wm.wishlist_id = wishlist_input
  and w.created_by = auth.uid()
  order by wm.created_at asc;
$$;

create or replace function public.remove_wishlist_viewer(member_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.wishlist_members wm
  using public.wishlists w
  where wm.id = member_input
  and w.id = wm.wishlist_id
  and w.created_by = auth.uid();
end;
$$;

create or replace function public.leave_wishlist(wishlist_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.wishlist_members
  where wishlist_id = wishlist_input
  and user_id = auth.uid();
end;
$$;
