-- =============================================================================
-- Launch free-delivery offer, store pickup, and search insights.
-- =============================================================================

-- Free delivery on every order until this moment (null = no offer).
alter table public.store_settings
  add column if not exists free_delivery_until timestamptz,
  add column if not exists pickup_address text check (char_length(pickup_address) <= 300),
  add column if not exists pickup_hours text check (char_length(pickup_hours) <= 120);

-- Launch offer: 30 days. The owner can change it in Admin → Store Settings.
update public.store_settings set free_delivery_until = '2026-12-25 23:59:59+01' where id = 1 and free_delivery_until is null;

-- Pickup option. Only offered at checkout once a pickup address is set.
insert into public.delivery_methods (id, label, description, fee, states, is_pickup, is_active, sort_order)
values ('pickup', 'Pick up from our store', 'Free · we''ll let you know when it''s ready', 0, null, true, true, 99)
on conflict (id) do nothing;

-- What shoppers search for. Query text only: no names, emails or IPs.
create table if not exists public.search_queries (
  id bigint generated always as identity primary key,
  query text not null check (char_length(query) between 2 and 80),
  results_count int not null check (results_count >= 0),
  created_at timestamptz not null default now()
);
create index if not exists search_queries_created_idx on public.search_queries (created_at desc);
create index if not exists search_queries_query_idx on public.search_queries (query);

alter table public.search_queries enable row level security;
create policy "staff read searches" on public.search_queries for select using (public.is_staff());
-- Writes only happen from the server (secret key); no client grants.
grant all on public.search_queries to service_role;
grant usage, select on all sequences in schema public to service_role;
