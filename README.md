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

## v2.6 polish fixes

Run `supabase-v2-6-update.sql` in Supabase SQL Editor.

Fixes:
- Added different colour gift icons.
- Letters are now purple with white background.
- Bottom navigation simplified and made consistent.
- Purchase history now uses RPC helpers, so it should save reliably.
- Auto-fill from URL now times out instead of getting stuck.

## v2.7 purchase restore

Run `supabase-v2-7-purchase-fix.sql` in Supabase SQL Editor.

Changes:
- Restores purchase history behaviour to direct insert/delete.
- Marking Purchased adds to Purchases.
- Changing back to Available/Reserved removes it from Purchases for that user.
- Auto-fill now detects Access Denied / blocked pages and stops gracefully.

## v2.8 update

Run `supabase-v2-8-icons-update.sql` in Supabase SQL Editor if you have not already added the icon column.

Changes:
- Removed the auto-fill section from Add Gift.
- Added extra gift colour icons.
- Added boy, girl, baby, adult and more general icons.
- Kept full A-Z initials.
- Purchase behaviour stays restored from v2.7.
