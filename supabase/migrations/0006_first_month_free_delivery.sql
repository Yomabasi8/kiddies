-- =============================================================================
-- Free delivery for each customer's first month, replacing the fixed launch
-- end date. A customer's month starts at their first PAID order (matched by
-- email or phone). 0 turns the offer off.
-- =============================================================================

alter table public.store_settings
  add column if not exists free_delivery_first_days int not null default 30
    check (free_delivery_first_days between 0 and 365);

alter table public.store_settings drop column if exists free_delivery_until;

-- Speeds up the "has this customer paid before?" check at checkout.
create index if not exists orders_paid_email_idx on public.orders (lower(email), paid_at) where paid_at is not null;
create index if not exists orders_paid_phone_idx on public.orders (right(regexp_replace(phone, '\D', '', 'g'), 10), paid_at) where paid_at is not null;

-- Earliest verified payment for a customer, by email or phone (last 10 digits).
create or replace function public.first_paid_order_at(p_email text, p_phone text)
returns timestamptz
language sql stable security definer set search_path = public as $$
  select min(paid_at) from public.orders
  where paid_at is not null
    and (
      (p_email is not null and lower(email) = lower(p_email))
      or (p_phone is not null and length(p_phone) = 10
          and right(regexp_replace(phone, '\D', '', 'g'), 10) = p_phone)
    );
$$;

revoke execute on function public.first_paid_order_at(text, text) from public, anon, authenticated;
grant execute on function public.first_paid_order_at(text, text) to service_role;
