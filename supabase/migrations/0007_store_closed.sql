-- =============================================================================
-- "Store closed" switch. While store_closed is on, the storefront shows a
-- maintenance page and checkout refuses new orders. The admin keeps working.
-- closed_message and reopens_on are optional extras shown to customers.
-- =============================================================================

alter table public.store_settings
  add column if not exists store_closed boolean not null default false,
  add column if not exists closed_message text check (char_length(closed_message) <= 300),
  add column if not exists reopens_on date;
