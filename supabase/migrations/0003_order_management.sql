-- =============================================================================
-- Order management rules + customer summary.
--
-- Status changes go through admin_set_order_status so the allowed
-- transitions, timestamps, stock restoration and history are applied in one
-- transaction. There is deliberately NO way to move an order to 'paid' here:
-- only confirm_order_payment (verified with the payment provider) does that.
-- =============================================================================

create or replace function public.admin_set_order_status(
  p_order_id uuid,
  p_to public.order_status,
  p_note text,
  p_actor uuid
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_allowed public.order_status[];
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return 'not_found';
  end if;

  v_allowed := case v_order.status
    when 'pending'    then array['cancelled']::public.order_status[]
    when 'paid'       then array['processing', 'cancelled']::public.order_status[]
    when 'processing' then array['dispatched', 'cancelled']::public.order_status[]
    when 'dispatched' then array['delivered']::public.order_status[]
    else array[]::public.order_status[]
  end;

  if p_to = 'paid' or not (p_to = any (v_allowed)) then
    return 'invalid_transition';
  end if;

  update public.orders set
    status = p_to,
    dispatched_at = case when p_to = 'dispatched' then now() else dispatched_at end,
    delivered_at  = case when p_to = 'delivered'  then now() else delivered_at end,
    cancelled_at  = case when p_to = 'cancelled'  then now() else cancelled_at end,
    -- A cancelled paid order still needs its money returned.
    needs_attention = case when p_to = 'cancelled' and v_order.paid_at is not null then true else needs_attention end,
    attention_reason = case when p_to = 'cancelled' and v_order.paid_at is not null
                            then 'Cancelled after payment: refund the customer, then record the refund'
                            else attention_reason end
  where id = p_order_id;

  -- Paid orders that are cancelled return their stock.
  if p_to = 'cancelled' and v_order.paid_at is not null then
    perform public.restock_order(p_order_id, 'cancellation', p_actor);
  end if;

  insert into public.order_status_history (order_id, from_status, to_status, note, changed_by)
    values (p_order_id, v_order.status, p_to, nullif(trim(p_note), ''), p_actor);
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (p_actor, 'order.status', 'order', p_order_id::text,
            jsonb_build_object('from', v_order.status, 'to', p_to, 'reference', v_order.reference));
  return 'ok';
end $$;

-- Record a refund that was made with the payment provider. Full refunds move
-- the order to 'refunded'. Stock is restored only if the items came back.
create or replace function public.admin_record_refund(
  p_order_id uuid,
  p_amount int,
  p_restock boolean,
  p_note text,
  p_actor uuid
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_total_refunded int;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return 'not_found';
  end if;
  select * into v_payment from public.payments
    where order_id = p_order_id and status in ('success', 'partially_refunded')
    order by created_at desc limit 1 for update;
  if not found then
    return 'no_verified_payment';
  end if;
  if p_amount <= 0 or p_amount > v_payment.amount - v_payment.refunded_amount then
    return 'invalid_amount';
  end if;

  v_total_refunded := v_payment.refunded_amount + p_amount;
  update public.payments set
    refunded_amount = v_total_refunded,
    status = case when v_total_refunded >= amount then 'refunded' else 'partially_refunded' end
  where id = v_payment.id;

  if v_total_refunded >= v_payment.amount then
    update public.orders set status = 'refunded', needs_attention = false, attention_reason = null
      where id = p_order_id;
    insert into public.order_status_history (order_id, from_status, to_status, note, changed_by)
      values (p_order_id, v_order.status, 'refunded', nullif(trim(p_note), ''), p_actor);
  end if;

  if p_restock then
    perform public.restock_order(p_order_id, 'refund', p_actor);
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (p_actor, 'order.refund_recorded', 'order', p_order_id::text,
            jsonb_build_object('amount', p_amount, 'restock', p_restock, 'reference', v_order.reference));
  return 'ok';
end $$;

revoke execute on function public.admin_set_order_status(uuid, public.order_status, text, uuid) from public, anon, authenticated;
revoke execute on function public.admin_record_refund(uuid, int, boolean, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_order_status(uuid, public.order_status, text, uuid) to service_role;
grant execute on function public.admin_record_refund(uuid, int, boolean, text, uuid) to service_role;

-- One row per purchaser (guests by email, registered users by account),
-- counting only orders whose payment was verified.
create or replace view public.admin_customer_summary
with (security_invoker = true) as
select
  coalesce(o.user_id::text, lower(o.email)) as customer_key,
  o.user_id,
  lower(o.email) as email,
  (array_agg(o.full_name order by o.created_at desc))[1] as full_name,
  (array_agg(o.phone order by o.created_at desc))[1] as phone,
  count(*) filter (where o.paid_at is not null) as orders_count,
  coalesce(sum(o.total) filter (where o.status in ('paid', 'processing', 'dispatched', 'delivered')), 0)::bigint as total_spent,
  min(o.created_at) as first_order_at,
  max(o.created_at) as last_order_at
from public.orders o
group by coalesce(o.user_id::text, lower(o.email)), o.user_id, lower(o.email);

revoke all on public.admin_customer_summary from public, anon, authenticated;
grant select on public.admin_customer_summary to service_role;
