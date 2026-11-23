-- =============================================================================
-- Checkout + payments.
--
-- create_checkout_order: writes a pending order, its items (with name/price
-- snapshots), the pending payment and the first timeline entry in ONE
-- transaction. Prices/totals are computed by the server before calling it.
--
-- confirm_order_payment is replaced to also record the coupon redemption
-- once a payment is verified (usage limits count paid orders only).
--
-- mark_payment_unsuccessful records failed/abandoned attempts without ever
-- downgrading a payment that already succeeded.
-- =============================================================================

create or replace function public.create_checkout_order(
  p_order jsonb,
  p_items jsonb,
  p_payment_reference text
) returns table (order_id uuid, order_reference text)
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'order has no items';
  end if;

  insert into public.orders (
    user_id, email, full_name, phone, address_line, city, state, instructions,
    delivery_method_id, delivery_method_label,
    subtotal, discount_total, delivery_fee, total,
    coupon_id, coupon_code
  ) values (
    nullif(p_order ->> 'user_id', '')::uuid,
    p_order ->> 'email', p_order ->> 'full_name', p_order ->> 'phone',
    p_order ->> 'address_line', p_order ->> 'city', p_order ->> 'state',
    nullif(p_order ->> 'instructions', ''),
    p_order ->> 'delivery_method_id', p_order ->> 'delivery_method_label',
    (p_order ->> 'subtotal')::int, (p_order ->> 'discount_total')::int,
    (p_order ->> 'delivery_fee')::int, (p_order ->> 'total')::int,
    nullif(p_order ->> 'coupon_id', '')::uuid, nullif(p_order ->> 'coupon_code', '')
  )
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name, sku, image_url, unit_price, quantity, line_total)
  select v_order.id,
         (i ->> 'product_id')::uuid,
         i ->> 'product_name',
         i ->> 'sku',
         i ->> 'image_url',
         (i ->> 'unit_price')::int,
         (i ->> 'quantity')::int,
         (i ->> 'unit_price')::int * (i ->> 'quantity')::int
  from jsonb_array_elements(p_items) as i;

  insert into public.payments (order_id, provider, reference, amount, currency, status)
    values (v_order.id, 'paystack', p_payment_reference, v_order.total, v_order.currency, 'pending');

  insert into public.order_status_history (order_id, from_status, to_status, note)
    values (v_order.id, null, 'pending', 'Order placed, awaiting payment');

  order_id := v_order.id;
  order_reference := v_order.reference;
  return next;
end $$;

create or replace function public.mark_payment_unsuccessful(p_reference text, p_status public.payment_status, p_raw jsonb)
returns text
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('failed', 'abandoned') then
    raise exception 'invalid status %', p_status;
  end if;
  update public.payments set status = p_status, raw = coalesce(p_raw, raw)
    where reference = p_reference and status = 'pending';
  return case when found then 'updated' else 'unchanged' end;
end $$;

-- Same as 0001, plus: record the coupon redemption on verified payment.
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
  if v_payment.status in ('success', 'refunded', 'partially_refunded') then
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

  -- A cancelled-before-payment order that is then paid still gets confirmed,
  -- but flagged so staff can decide (fulfil or refund).
  update public.orders
    set status = case when v_order.status = 'pending' then 'paid'::public.order_status else status end,
        paid_at = coalesce(p_paid_at, now()),
        needs_attention = v_short or v_order.status <> 'pending',
        attention_reason = case
          when v_short then 'Not enough stock for one or more items when payment was confirmed'
          when v_order.status <> 'pending' then 'Payment received for an order that was already ' || v_order.status::text
        end
    where id = v_order.id;

  if v_order.status = 'pending' then
    insert into public.order_status_history (order_id, from_status, to_status, note)
      values (v_order.id, 'pending', 'paid', 'Payment verified with Paystack');
  end if;

  if v_order.coupon_id is not null then
    insert into public.coupon_redemptions (coupon_id, order_id, email, user_id, amount)
      values (v_order.coupon_id, v_order.id, lower(v_order.email), v_order.user_id, v_order.discount_total)
      on conflict (order_id) do nothing;
  end if;

  insert into public.notifications (type, title, body, data)
    values ('order.paid', 'New paid order ' || v_order.reference,
            v_order.full_name || ' · ₦' || to_char(v_order.total / 100.0, 'FM999,999,999'),
            jsonb_build_object('order_id', v_order.id, 'reference', v_order.reference));

  return case when v_short then 'stock_shortfall' else 'confirmed' end;
end $$;

revoke execute on function public.create_checkout_order(jsonb, jsonb, text) from public, anon, authenticated;
revoke execute on function public.mark_payment_unsuccessful(text, public.payment_status, jsonb) from public, anon, authenticated;
grant execute on function public.create_checkout_order(jsonb, jsonb, text) to service_role;
grant execute on function public.mark_payment_unsuccessful(text, public.payment_status, jsonb) to service_role;
-- confirm_order_payment keeps its existing grants (service_role only).
