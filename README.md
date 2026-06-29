# Frever Wishlist v2.3 fixed

Run `supabase-v2-3-update.sql` in Supabase SQL Editor.

Fixes:
- All Wishlists uses compact Create/Join buttons with popups.
- Wishlist codes are generated automatically.
- Add Wishlist/Create Wishlist works again.
- Owner and shared users can update status.
- Status control changed to compact text controls, not big dropdowns.
- Shared users can remove a wishlist from their own account.
- Owner can view and remove viewers using Supabase RPC helpers.

## v2.4 update

Run `supabase-v2-4-update.sql` in Supabase SQL Editor.

Added:
- Wishlist icon picker.
- Boy/girl icons.
- Initial icons A-Z style selection.
- New bottom navigation style.
- Purchase history creation when a gift is marked Purchased.
- Basic "Try auto-fill from URL" helper in Add Gift.

Auto-fill uses a public fetch helper and may not work on every shop. Fields remain editable.

## v2.5 fixes

Run `supabase-v2-5-update.sql` in Supabase SQL Editor.

Fixes:
- Full A-Z initial icons.
- Initial icons are purple letters with a white background.
- Consistent bottom navigation across pages.
- Purchase history is created when a gift is marked Purchased from buttons or edit form.
- Viewer and shared wishlist RPC functions included.
- Keeps URL auto-fill helper.
