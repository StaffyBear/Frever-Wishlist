-- Run this if your database already exists.
-- It allows users to delete gifts they created.

drop policy if exists "gifts_delete_own" on public.gifts;

create policy "gifts_delete_own"
on public.gifts for delete
using (auth.uid() = created_by);
