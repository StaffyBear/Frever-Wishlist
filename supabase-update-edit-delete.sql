-- Run this in Supabase SQL Editor if your database already exists.


drop policy if exists "gifts_delete_own" on public.gifts;
create policy "gifts_delete_own" on public.gifts for delete using (auth.uid() = created_by);

drop policy if exists "wishlists_delete_own" on public.wishlists;
create policy "wishlists_delete_own" on public.wishlists for delete using (auth.uid() = created_by);
