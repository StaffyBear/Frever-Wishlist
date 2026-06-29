-- Frever Wishlist v2.6 update
-- Run this in Supabase SQL Editor.

alter table public.wishlists
add column if not exists icon text default 'gift-purple';

update public.wishlists
set icon = 'gift-purple'
where icon is null or icon = '🎁';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'purchases_gift_buyer_unique'
  ) then
    alter table public.purchases
    add constraint purchases_gift_buyer_unique unique (gift_id, buyer_id);
  end if;
end $$;

drop policy if exists purchases_select_own on public.purchases;
create policy purchases_select_own on public.purchases for select using (auth.uid() = buyer_id);

drop policy if exists purchases_insert_own on public.purchases;
create policy purchases_insert_own on public.purchases for insert with check (auth.uid() = buyer_id);

drop policy if exists purchases_update_own on public.purchases;
create policy purchases_update_own on public.purchases for update using (auth.uid() = buyer_id);

drop policy if exists purchases_delete_own on public.purchases;
create policy purchases_delete_own on public.purchases for delete using (auth.uid() = buyer_id);

create or replace function public.record_purchase(
  gift_input uuid,
  wishlist_input uuid,
  quantity_input integer,
  price_input numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.purchases (
    gift_id,
    wishlist_id,
    buyer_id,
    quantity,
    price
  )
  values (
    gift_input,
    wishlist_input,
    auth.uid(),
    coalesce(quantity_input, 1),
    price_input
  )
  on conflict (gift_id, buyer_id)
  do update set
    wishlist_id = excluded.wishlist_id,
    quantity = excluded.quantity,
    price = excluded.price,
    purchased_at = now();
end;
$$;

create or replace function public.remove_purchase_record(gift_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.purchases
  where gift_id = gift_input
  and buyer_id = auth.uid();
end;
$$;
