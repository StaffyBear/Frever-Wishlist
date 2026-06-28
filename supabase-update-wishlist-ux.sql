
-- Extra policies for updated wishlist sharing/editing
drop policy if exists "wishlist_members_insert_own" on public.wishlist_members;
create policy "wishlist_members_insert_own" on public.wishlist_members for insert with check (auth.uid() = user_id);
drop policy if exists "gifts_delete_own" on public.gifts;
create policy "gifts_delete_own" on public.gifts for delete using (auth.uid() = created_by);
drop policy if exists "wishlists_delete_own" on public.wishlists;
create policy "wishlists_delete_own" on public.wishlists for delete using (auth.uid() = created_by);
