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

## v2.1 update
- Home is navigation only.
- Home includes All Wishlists, Purchases, Admin and Sign Out.
- Create Wishlist moved to All Wishlists.
- Join another wishlist moved to the bottom of All Wishlists.
- Other users' wishlists no longer show edit/delete gift controls.
- Shared wishlist users can set gift status to Available, Reserved or Purchased.
- Shared wishlist users can remove the wishlist from their account.
- Owners can delete their own wishlist.
- Owners can view and remove people who can view their wishlist.
- Run supabase-v2-1-update.sql in Supabase SQL Editor after uploading.

## v2.2 update

- All Wishlists page now uses compact Create and Join buttons with popups.
- Wishlist code is generated automatically when creating a wishlist.
- Owners can update item status too.
- Status controls changed from buttons to a compact dropdown.
- Shared users can remove a wishlist from their own account using the `leave_wishlist` RPC function.
- Viewer list function is included in `supabase-v2-2-update.sql`.

Run `supabase-v2-2-update.sql` in Supabase SQL Editor after uploading this version.
