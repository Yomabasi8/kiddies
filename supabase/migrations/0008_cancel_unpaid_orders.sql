-- =============================================================================
-- Close orders whose payment failed or was abandoned.
--
-- Before: a failed/abandoned payment was recorded, but its order stayed
-- 'pending' forever. Now the order is cancelled in the same transaction and
-- the timeline says why. Pending orders hold no stock (stock is only taken
-- when payment is confirmed), so nothing needs restocking.
--
-- If the customer somehow pays later anyway, confirm_order_payment still
-- records the payment and flags the order for staff (see 0004).
-- =============================================================================

create or replace function public.mark_payment_unsuccessful(p_reference text, p_status public.payment_status, p_raw jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
begin
  if p_status not in ('failed', 'abandoned') then
    raise exception 'invalid status %', p_status;
  end if;

  update public.payments set status = p_status, raw = coalesce(p_raw, raw)
    where reference = p_reference and status = 'pending'
    returning order_id into v_order_id;
  if not found then
    return 'unchanged';
  end if;

  update public.orders set status = 'cancelled', cancelled_at = now()
    where id = v_order_id and status = 'pending';
  if found then
    insert into public.order_status_history (order_id, from_status, to_status, note)
      values (v_order_id, 'pending', 'cancelled',
              case p_status
                when 'abandoned' then 'Payment not completed: cancelled or abandoned at Paystack'
                else 'Payment failed at Paystack'
              end);
  end if;
  return 'updated';
end $$;

-- create or replace keeps the existing grants (service_role only), but be explicit.
revoke execute on function public.mark_payment_unsuccessful(text, public.payment_status, jsonb) from public, anon, authenticated;
grant execute on function public.mark_payment_unsuccessful(text, public.payment_status, jsonb) to service_role;

-- One-off catch-up: orders already stuck at 'pending' although their payment
-- was recorded as failed/abandoned before this fix.
with stuck as (
  update public.orders o set status = 'cancelled', cancelled_at = now()
  from public.payments p
  where p.order_id = o.id and o.status = 'pending' and p.status in ('failed', 'abandoned')
  returning o.id
)
insert into public.order_status_history (order_id, from_status, to_status, note)
  select id, 'pending', 'cancelled', 'Payment not completed (closed automatically)' from stuck;
