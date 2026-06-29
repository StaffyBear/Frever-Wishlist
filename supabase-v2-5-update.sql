-- Frever Wishlist v2.5 database update
-- Run this in Supabase SQL Editor.

alter table public.wishlists
add column if not exists icon text default '🎁';

update public.wishlists
set icon = '🎁'
where icon is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'purchases_gift_buyer_unique'
  ) then
    alter table public.purchases
    add constraint purchases_gift_buyer_unique unique (gift_id, buyer_id);
  end if;
end $$;

-- Ensure wishlist visibility is locked down.
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

-- Ensure gift visibility follows wishlist access.
drop policy if exists gifts_select_logged_in on public.gifts;
drop policy if exists gifts_select_allowed on public.gifts;

create policy gifts_select_allowed
on public.gifts
for select
using (
  exists (
    select 1
    from public.wishlists w
    where w.id = gifts.wishlist_id
    and (
      w.created_by = auth.uid()
      or exists (
        select 1
        from public.wishlist_members wm
        where wm.wishlist_id = w.id
        and wm.user_id = auth.uid()
        and wm.can_view = true
      )
    )
  )
);

drop policy if exists gifts_update_logged_in on public.gifts;
drop policy if exists gifts_update_allowed on public.gifts;

create policy gifts_update_allowed
on public.gifts
for update
using (
  exists (
    select 1
    from public.wishlists w
    where w.id = gifts.wishlist_id
    and (
      w.created_by = auth.uid()
      or exists (
        select 1
        from public.wishlist_members wm
        where wm.wishlist_id = w.id
        and wm.user_id = auth.uid()
        and wm.can_view = true
      )
    )
  )
);

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
