
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
