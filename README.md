# Frever Wishlist v2

This is the cleaner rebuild.

## What changed

- Admin page removed.
- Home is now the main page.
- Wishlists page has:
  - My Wishlists
  - Other Wishlists
  - Join another wishlist by code
- Add Gift now lives on the individual wishlist page.
- Wishlist page has search and sorting only.
- Add/Edit Gift uses compact popups.
- Code split into separate JS files.

## Supabase

Run `supabase-v2-schema.sql` in Supabase SQL Editor.

If you already have the simplified tables, this script is safe to run over them.

## Secure join update

This version fixes wishlist visibility.

- New accounts will not automatically see existing wishlists.
- Users join a wishlist by entering the 5-character code.
- The app now uses the Supabase RPC function `join_wishlist_by_code`.
- Run `supabase-update-secure-join.sql` in Supabase SQL Editor if your database already exists.
