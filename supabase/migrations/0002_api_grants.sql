-- =============================================================================
-- API privileges.
--
-- This project does not auto-expose new tables to the Data API, so access is
-- granted explicitly here. Grants decide which operations a role may attempt;
-- Row Level Security (0001) still decides which rows it can touch.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Visitors (and signed-in users) may read the public catalogue. RLS limits
-- this to visible categories, active products, published testimonials, etc.
grant select on
  public.categories,
  public.products,
  public.product_images,
  public.product_variants,
  public.inventory,
  public.delivery_methods,
  public.store_settings,
  public.testimonials
to anon, authenticated;

-- Signed-in users: table access gated entirely by RLS policies
-- (own profile/addresses/cart/orders for customers; everything for staff).
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Customers may only ever change their own name and phone, never their role.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
revoke insert, delete on public.profiles from authenticated;

-- Server-side code (secret key) has full access.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Helper functions used inside RLS policies must be callable by the roles
-- whose queries evaluate those policies.
grant execute on function public.is_staff() to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Transactional functions: server only.
grant execute on function public.confirm_order_payment(text, int, text, text, timestamptz, jsonb) to service_role;
grant execute on function public.restock_order(uuid, public.stock_reason, uuid) to service_role;
grant execute on function public.adjust_stock(uuid, int, public.stock_reason, text, uuid) to service_role;
grant execute on function public.generate_order_reference() to service_role;

-- Future tables created by migrations are available to the server by default;
-- client roles must still be granted explicitly in each migration.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
