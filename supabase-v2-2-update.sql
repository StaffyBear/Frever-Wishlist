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
