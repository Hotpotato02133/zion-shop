-- ========================================================
-- ZION: COD APPROVAL & SHIPPING WORKFLOW
-- Run AFTER 002_orders_admin.sql and 003_admin_notifications.sql (safe to re-run).
-- ========================================================

-- RPC to approve a Cash on Delivery (COD) order to be shipped
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

-- Ensure Admins have full access to manage admins table
drop policy if exists "Admins manage admins" on public.admins;
create policy "Admins manage admins" on public.admins
  for all using (public.is_admin()) with check (public.is_admin());

-- Allow first authenticated user to claim admin if table is empty (bootstrapping helper)
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

