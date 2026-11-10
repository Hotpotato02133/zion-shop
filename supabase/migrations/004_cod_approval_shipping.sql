-- ========================================================
-- ZION: COD APPROVAL, CANCELLATION ALERTS & SHIPPING WORKFLOW
-- Run AFTER 002_orders_admin.sql and 003_admin_notifications.sql (safe to re-run).
-- ========================================================

-- 1. RPC to approve a Cash on Delivery (COD) order to be shipped
create or replace function public.admin_approve_cod_order(
  p_order_id uuid,
  p_note text default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if v_order.status <> 'to_ship' then raise exception 'Only orders awaiting shipment can be approved'; end if;

  -- Record approval flag inside shipping_address jsonb
  update public.orders
  set status = 'to_ship',
      shipping_address = jsonb_set(coalesce(shipping_address, '{}'::jsonb), '{cod_approved}', 'true'::jsonb, true)
  where id = p_order_id returning * into v_order;

  perform public.log_order_event(
    p_order_id,
    'to_ship',
    coalesce(nullif(trim(p_note), ''), 'COD order approved for shipping by admin')
  );

  return v_order;
end;
$$;

-- 2. Upgrade admin_set_order_status so COD approval or shipping persists cod_approved in shipping_address
create or replace function public.admin_set_order_status(
  p_order_id uuid,
  p_status text,
  p_courier text default null,
  p_tracking text default null,
  p_note text default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_status not in ('to_pay','to_ship','to_receive','completed','cancelled','return_refund') then
    raise exception 'Invalid status';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Order not found'; end if;

  if p_status = 'cancelled' and v_order.status <> 'cancelled' then
    perform public.restock_order(p_order_id);
  end if;

  update public.orders
  set status = p_status,
      courier = coalesce(nullif(trim(p_courier), ''), courier),
      tracking_number = coalesce(nullif(trim(p_tracking), ''), tracking_number),
      payment_status = case
        when p_status = 'completed' and payment_method = 'cod' then 'paid'
        when p_status = 'cancelled' and payment_status = 'paid' then 'refund_pending'
        else payment_status
      end,
      paid_at = case
        when p_status = 'completed' and payment_method = 'cod' and paid_at is null then now()
        else paid_at
      end,
      shipping_address = case
        when payment_method = 'cod' and (p_status in ('to_receive', 'completed') or (p_status = 'to_ship' and p_note ilike '%approved%'))
          then jsonb_set(coalesce(shipping_address, '{}'::jsonb), '{cod_approved}', 'true'::jsonb, true)
        else shipping_address
      end
  where id = p_order_id returning * into v_order;

  perform public.log_order_event(p_order_id, p_status,
    coalesce(nullif(trim(p_note), ''), case p_status
      when 'to_ship' then 'Order confirmed, preparing to ship'
      when 'to_receive' then 'Order is on delivery' || coalesce(' (' || nullif(trim(p_courier), '') || ' ' || nullif(trim(p_tracking), '') || ')', '')
      when 'completed' then 'Order marked completed'
      when 'cancelled' then 'Order cancelled by store'
      else 'Status updated to ' || p_status
    end)
  );
  return v_order;
end;
$$;

-- 3. Expand admin_notifications type constraint to include 'order_cancelled'
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'admin_notifications'
      and constraint_name = 'admin_notifications_type_check'
  ) then
    alter table public.admin_notifications drop constraint admin_notifications_type_check;
  end if;
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_notifications'
  ) then
    alter table public.admin_notifications
      add constraint admin_notifications_type_check
      check (type in ('new_order', 'order_cancelled', 'return_request', 'low_stock', 'out_of_stock'));
  end if;
end $$;

-- 4. Update order notification trigger to alert admin when a customer cancels an order
create or replace function public.notify_admin_on_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.admin_notifications (type, title, body, order_id)
    values (
      'new_order',
      'New order ' || new.order_number,
      coalesce(new.customer_name, new.customer_email, 'Customer') || ' · $' || new.total::text ||
        case when new.payment_method = 'cod' then ' · Cash on delivery (awaiting approval)' else ' · Online payment' end,
      new.id
    );
  elsif tg_op = 'UPDATE' then
    if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
      -- Mark any unread 'new_order' notification for this order as read so it is replaced by the cancellation alert
      update public.admin_notifications
      set read_at = now()
      where order_id = new.id and type = 'new_order' and read_at is null;

      insert into public.admin_notifications (type, title, body, order_id)
      values (
        'order_cancelled',
        'Order ' || new.order_number || ' cancelled',
        coalesce(new.customer_name, new.customer_email, 'Customer') || ' · Reason: ' || coalesce(new.cancel_reason, 'Cancelled'),
        new.id
      );
    elsif new.return_status = 'requested' and old.return_status is distinct from 'requested' then
      insert into public.admin_notifications (type, title, body, order_id)
      values (
        'return_request',
        'Return requested on ' || new.order_number,
        coalesce(new.return_reason, 'No reason given'),
        new.id
      );
    end if;
  end if;
  return new;
end;
$$;

-- 5. Enable Supabase Realtime on orders, order_events, and admin_notifications
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
    ) then
      alter publication supabase_realtime add table public.orders;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_events'
    ) then
      alter publication supabase_realtime add table public.order_events;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_notifications'
    ) then
      alter publication supabase_realtime add table public.admin_notifications;
    end if;
  end if;
end $$;

-- 6. Ensure Admins have full access to manage admins table
drop policy if exists "Admins manage admins" on public.admins;
create policy "Admins manage admins" on public.admins
  for all using (public.is_admin()) with check (public.is_admin());

-- 7. Allow first authenticated user to claim admin if table is empty (bootstrapping helper)
create or replace function public.claim_initial_admin()
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_uid text := auth.jwt()->>'sub';
  v_email text := auth.jwt()->>'email';
  v_count int;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  select count(*) into v_count from public.admins;
  if v_count = 0 then
    insert into public.admins (user_id, email) values (v_uid, v_email)
    on conflict (user_id) do nothing;
    return true;
  end if;
  return false;
end;
$$;


