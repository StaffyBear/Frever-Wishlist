-- Frever Wishlist v2.7 purchase fix
-- Run this in Supabase SQL Editor.

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
create policy purchases_select_own
on public.purchases for select
using (auth.uid() = buyer_id);

drop policy if exists purchases_insert_own on public.purchases;
create policy purchases_insert_own
on public.purchases for insert
with check (auth.uid() = buyer_id);

drop policy if exists purchases_update_own on public.purchases;
create policy purchases_update_own
on public.purchases for update
using (auth.uid() = buyer_id);

drop policy if exists purchases_delete_own on public.purchases;
create policy purchases_delete_own
on public.purchases for delete
using (auth.uid() = buyer_id);
