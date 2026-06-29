-- Frever Wishlist v2.4 update
-- Run this in Supabase SQL Editor after uploading the new ZIP.

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
