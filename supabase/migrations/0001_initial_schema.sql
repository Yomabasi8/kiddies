-- =============================================================================
-- Kiddies Accessories: initial schema
--
-- Conventions
--   * Money is stored as integer minor units (kobo). ₦12,500 = 1250000.
--   * Order items snapshot product name/price at purchase time.
--   * Stock is decremented only when a payment is verified (see
--     confirm_order_payment), inside one transaction with row locks.
--   * Row Level Security is enabled on every table. The storefront reads
--     public catalogue data with the publishable key; everything else goes
--     through server code using the secret key, or through admin policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'staff', 'admin');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.image_style as enum ('cutout', 'photo');
create type public.order_status as enum (
  'pending', 'paid', 'processing', 'dispatched', 'delivered', 'cancelled', 'refunded'
);
create type public.payment_status as enum (
  'pending', 'success', 'failed', 'abandoned', 'refunded', 'partially_refunded'
);
create type public.stock_reason as enum (
  'initial', 'restock', 'adjustment', 'order', 'cancellation', 'refund'
);
create type public.discount_type as enum ('percent', 'fixed');
create type public.coupon_scope as enum ('all', 'products', 'categories');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles & roles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  phone text check (char_length(phone) <= 20),
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- True when the signed-in user is staff or admin. SECURITY DEFINER so it can
-- read profiles without recursing through profiles' own RLS policies.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Create a profile for every new auth user (customers by default).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  description text,
  image_url text,
  image_style public.image_style not null default 'cutout',
  icon text not null default 'other',
  accent text not null default 'mint',
  is_visible boolean not null default true,
  sort_order int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 160),
  description text not null default '',
  -- Products keep their category; categories with products can't be deleted.
  category_id uuid not null references public.categories (id) on delete restrict,
  product_type text,
  sku text not null unique,
  price int not null check (price >= 0),
  sale_price int check (sale_price is null or (sale_price >= 0 and sale_price < price)),
  currency char(3) not null default 'NGN',
  age_range text,
  material text,
  capacity_ml int check (capacity_ml is null or capacity_ml > 0),
  dimensions text,
  piece_count int check (piece_count is null or piece_count > 0),
  care_instructions text,
  -- Extra label/value specifications, e.g. [{"label":"Colour","value":"Cream"}].
  specs jsonb not null default '[]'::jsonb check (jsonb_typeof(specs) = 'array'),
  status public.product_status not null default 'draft',
  is_featured boolean not null default false,
  is_new boolean not null default false,
  track_inventory boolean not null default true,
  low_stock_threshold int not null default 5 check (low_stock_threshold >= 0),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create index products_created_idx on public.products (created_at desc);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text not null default '',
  image_style public.image_style not null default 'cutout',
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);
-- At most one primary image per product.
create unique index product_images_one_primary on public.product_images (product_id) where is_primary;

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  sku text not null unique,
  price_override int check (price_override is null or price_override >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants (product_id);
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

-- One stock row per product (variant_id null) or per variant.
create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0), -- no overselling
  updated_at timestamptz not null default now(),
  unique nulls not distinct (product_id, variant_id)
);
create trigger inventory_updated_at before update on public.inventory
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  state text not null,
  instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);
create unique index addresses_one_default on public.addresses (user_id) where is_default;
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

-- Server-side carts for signed-in customers (guests keep theirs in the browser).
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now()
);
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique nulls not distinct (cart_id, product_id, variant_id)
);

-- ---------------------------------------------------------------------------
-- Delivery, promotions, settings
-- ---------------------------------------------------------------------------
create table public.delivery_methods (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null,
  description text not null default '',
  fee int not null check (fee >= 0),
  -- States served; null means nationwide.
  states text[],
  is_pickup boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
create trigger delivery_methods_updated_at before update on public.delivery_methods
  for each row execute function public.set_updated_at();

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,32}$'),
  description text,
  discount_type public.discount_type not null,
  -- percent: 1–100; fixed: kobo
  value int not null check (value > 0),
  min_subtotal int not null default 0 check (min_subtotal >= 0),
  scope public.coupon_scope not null default 'all',
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int check (usage_limit is null or usage_limit > 0),
  per_customer_limit int check (per_customer_limit is null or per_customer_limit > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'percent' or value <= 100),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create unique index coupons_code_unique on public.coupons (code);
create trigger coupons_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

create table public.coupon_products (
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  primary key (coupon_id, product_id)
);
create table public.coupon_categories (
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (coupon_id, category_id)
);

-- Single-row store configuration.
create table public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Kiddies Accessories',
  logo_url text,
  email text,
  phone text,
  whatsapp text,
  address text,
  socials jsonb not null default '{}'::jsonb,
  notify_new_orders boolean not null default true,
  notify_payments boolean not null default true,
  notify_low_stock boolean not null default true,
  notify_order_status boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values (1);
create trigger store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders & payments
-- ---------------------------------------------------------------------------
-- Unguessable, human-friendly reference, e.g. KA-7F3K9Q2D.
create or replace function public.generate_order_reference()
returns text language sql volatile as $$
  select 'KA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.generate_order_reference(),
  user_id uuid references public.profiles (id) on delete set null, -- null for guests
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  full_name text not null,
  phone text not null,
  -- Delivery address snapshot
  address_line text not null,
  city text not null,
  state text not null,
  instructions text,
  delivery_method_id text references public.delivery_methods (id) on delete set null,
  delivery_method_label text not null,
  -- Totals (kobo)
  subtotal int not null check (subtotal >= 0),
  discount_total int not null default 0 check (discount_total >= 0),
  delivery_fee int not null default 0 check (delivery_fee >= 0),
  total int not null check (total >= 0),
  currency char(3) not null default 'NGN',
  coupon_id uuid references public.coupons (id) on delete set null,
  coupon_code text,
  status public.order_status not null default 'pending',
  tracking_number text,
  tracking_url text,
  needs_attention boolean not null default false,
  attention_reason text,
  paid_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  restocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total = subtotal - discount_total + delivery_fee)
);
create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_email_idx on public.orders (lower(email));
create index orders_created_idx on public.orders (created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Kept as set-null so orders survive product archival/deletion.
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_name text,
  sku text,
  image_url text,
  unit_price int not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total int not null check (line_total = unit_price * quantity)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  note text,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

create table public.order_notes (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_notes_order_idx on public.order_notes (order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  provider text not null default 'paystack',
  reference text not null unique,
  amount int not null check (amount >= 0),
  currency char(3) not null default 'NGN',
  status public.payment_status not null default 'pending',
  provider_transaction_id text,
  channel text,
  paid_at timestamptz,
  refunded_amount int not null default 0 check (refunded_amount >= 0),
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- Every webhook received. The unique key makes duplicate deliveries no-ops.
create table public.payment_events (
  id bigint generated always as identity primary key,
  provider text not null,
  event_key text not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  result text,
  unique (provider, event_key)
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete restrict,
  order_id uuid not null unique references public.orders (id) on delete cascade,
  email text not null,
  user_id uuid references public.profiles (id) on delete set null,
  amount int not null check (amount >= 0),
  created_at timestamptz not null default now()
);
create index coupon_redemptions_coupon_idx on public.coupon_redemptions (coupon_id);

create table public.inventory_movements (
  id bigint generated always as identity primary key,
  inventory_id uuid not null references public.inventory (id) on delete cascade,
  change int not null check (change <> 0),
  quantity_after int not null check (quantity_after >= 0),
  reason public.stock_reason not null,
  order_id uuid references public.orders (id) on delete set null,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_movements_inventory_idx on public.inventory_movements (inventory_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Engagement, notifications, audit
-- ---------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  source text,
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
create unique index newsletter_email_unique on public.newsletter_subscribers (lower(email));

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  order_reference text,
  message text not null check (char_length(message) <= 4000),
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

-- Only genuine, consented reviews may be published (no fabricated content).
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  context text,
  quote text not null,
  rating int not null check (rating between 1 and 5),
  avatar_url text,
  consent_confirmed boolean not null default false,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (not is_published or consent_confirmed)
);

create table public.notifications (
  id bigint generated always as identity primary key,
  type text not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_unread_idx on public.notifications (created_at desc) where read_at is null;

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Transactional business logic (server-only: execute revoked from clients)
-- ---------------------------------------------------------------------------

-- Record a verified payment and confirm the order, exactly once.
-- Decrements stock with row locks; if stock ran out between checkout and
-- payment the order is still marked paid but flagged for the admin to
-- resolve (e.g. refund), rather than silently overselling.
-- Returns: confirmed | already_confirmed | amount_mismatch | not_found | stock_shortfall
create or replace function public.confirm_order_payment(
  p_reference text,
  p_amount int,
  p_provider_transaction_id text,
  p_channel text,
  p_paid_at timestamptz,
  p_raw jsonb
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_item record;
  v_inv public.inventory%rowtype;
  v_short boolean := false;
begin
  select * into v_payment from public.payments where reference = p_reference for update;
  if not found then
    return 'not_found';
  end if;
  if v_payment.status = 'success' then
    return 'already_confirmed';
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;

  if p_amount <> v_payment.amount or p_amount <> v_order.total then
    update public.payments set raw = p_raw where id = v_payment.id;
    update public.orders
      set needs_attention = true,
          attention_reason = 'Payment amount did not match the order total'
      where id = v_order.id;
    insert into public.audit_logs (action, entity_type, entity_id, details)
      values ('payment.amount_mismatch', 'order', v_order.id::text,
              jsonb_build_object('expected', v_order.total, 'received', p_amount, 'reference', p_reference));
    return 'amount_mismatch';
  end if;

  update public.payments
    set status = 'success',
        provider_transaction_id = p_provider_transaction_id,
        channel = p_channel,
        paid_at = coalesce(p_paid_at, now()),
        raw = p_raw
    where id = v_payment.id;

  for v_item in
    select oi.product_id, oi.variant_id, oi.quantity
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = v_order.id and p.track_inventory
  loop
    update public.inventory
      set quantity = quantity - v_item.quantity
      where product_id = v_item.product_id
        and variant_id is not distinct from v_item.variant_id
        and quantity >= v_item.quantity
      returning * into v_inv;
    if not found then
      v_short := true;
      continue;
    end if;
    insert into public.inventory_movements (inventory_id, change, quantity_after, reason, order_id)
      values (v_inv.id, -v_item.quantity, v_inv.quantity, 'order', v_order.id);
  end loop;

  update public.orders
    set status = 'paid',
        paid_at = coalesce(p_paid_at, now()),
        needs_attention = v_short,
        attention_reason = case when v_short then 'Not enough stock for one or more items when payment was confirmed' end
    where id = v_order.id;

  insert into public.order_status_history (order_id, from_status, to_status, note)
    values (v_order.id, v_order.status, 'paid', 'Payment verified with provider');

  insert into public.notifications (type, title, body, data)
    values ('order.paid', 'New paid order ' || v_order.reference,
            v_order.full_name || ' · ' || (v_order.total / 100)::text || ' NGN',
            jsonb_build_object('order_id', v_order.id, 'reference', v_order.reference));

  return case when v_short then 'stock_shortfall' else 'confirmed' end;
end $$;

-- Put a paid order's stock back once (cancellation or refund).
create or replace function public.restock_order(p_order_id uuid, p_reason public.stock_reason, p_actor uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_inv public.inventory%rowtype;
begin
  if p_reason not in ('cancellation', 'refund') then
    raise exception 'invalid restock reason %', p_reason;
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.paid_at is null or v_order.restocked_at is not null then
    return false;
  end if;

  for v_item in
    select oi.product_id, oi.variant_id, oi.quantity
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = p_order_id and p.track_inventory
  loop
    update public.inventory
      set quantity = quantity + v_item.quantity
      where product_id = v_item.product_id and variant_id is not distinct from v_item.variant_id
      returning * into v_inv;
    if found then
      insert into public.inventory_movements (inventory_id, change, quantity_after, reason, order_id, created_by)
        values (v_inv.id, v_item.quantity, v_inv.quantity, p_reason, p_order_id, p_actor);
    end if;
  end loop;

  update public.orders set restocked_at = now() where id = p_order_id;
  return true;
end $$;

-- Admin stock adjustment with a movement record. Never goes below zero.
create or replace function public.adjust_stock(p_inventory_id uuid, p_change int, p_reason public.stock_reason, p_note text, p_actor uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_inv public.inventory%rowtype;
begin
  if p_change = 0 then
    raise exception 'change must not be zero';
  end if;
  update public.inventory set quantity = quantity + p_change
    where id = p_inventory_id and quantity + p_change >= 0
    returning * into v_inv;
  if not found then
    raise exception 'stock cannot go below zero';
  end if;
  insert into public.inventory_movements (inventory_id, change, quantity_after, reason, note, created_by)
    values (v_inv.id, p_change, v_inv.quantity, p_reason, p_note, p_actor);
  return v_inv.quantity;
end $$;

revoke execute on function public.confirm_order_payment(text, int, text, text, timestamptz, jsonb) from public, anon, authenticated;
revoke execute on function public.restock_order(uuid, public.stock_reason, uuid) from public, anon, authenticated;
revoke execute on function public.adjust_stock(uuid, int, public.stock_reason, text, uuid) from public, anon, authenticated;
revoke execute on function public.generate_order_reference() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.delivery_methods enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_products enable row level security;
alter table public.coupon_categories enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_notes enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.testimonials enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Public catalogue: only visible categories and active products.
create policy "public reads visible categories" on public.categories
  for select using (is_visible and archived_at is null);
create policy "public reads active products" on public.products
  for select using (status = 'active');
create policy "public reads images of active products" on public.product_images
  for select using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy "public reads active variants" on public.product_variants
  for select using (is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy "public reads stock of active products" on public.inventory
  for select using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy "public reads active delivery methods" on public.delivery_methods
  for select using (is_active);
create policy "public reads store settings" on public.store_settings
  for select using (true);
create policy "public reads published testimonials" on public.testimonials
  for select using (is_published);

-- Customers: their own profile, addresses, cart and orders.
create policy "users read own profile" on public.profiles
  for select using (id = auth.uid());
create policy "users update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
-- Customers may edit their name/phone but never their role.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy "users manage own addresses" on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage own cart" on public.carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage own cart items" on public.cart_items
  for all using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
create policy "users read own orders" on public.orders
  for select using (user_id = auth.uid());
create policy "users read own order items" on public.order_items
  for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "users read own order history" on public.order_status_history
  for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Staff/admin: full management of store data.
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'products', 'product_images', 'product_variants', 'inventory',
    'inventory_movements', 'delivery_methods', 'coupons', 'coupon_products',
    'coupon_categories', 'coupon_redemptions', 'orders', 'order_items',
    'order_status_history', 'order_notes', 'payments', 'newsletter_subscribers',
    'contact_messages', 'testimonials', 'notifications'
  ] loop
    execute format('create policy "staff manage %1$s" on public.%1$I for all using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

-- Only admins change settings, roles, and read the audit log / raw webhooks.
create policy "admins read all profiles" on public.profiles
  for select using (public.is_staff());
create policy "admins update store settings" on public.store_settings
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit logs" on public.audit_logs
  for select using (public.is_admin());
create policy "admins read payment events" on public.payment_events
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: product images (public read, staff write, images only, 5 MB)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "staff upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_staff());
create policy "staff update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_staff());
create policy "staff delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_staff());
