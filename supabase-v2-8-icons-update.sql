-- Frever Wishlist v2.8 icons update
-- Run this in Supabase SQL Editor.

alter table public.wishlists
add column if not exists icon text default 'gift-purple';

update public.wishlists
set icon = 'gift-purple'
where icon is null or icon = '🎁';
