-- ========================================================
-- ZION: ADMIN NOTIFICATIONS (new orders, returns, low stock)
-- Run AFTER 002_orders_admin.sql (safe to re-run).
-- ========================================================

-- Per-product restock threshold (default 5)
alter table public.products add column if not exists low_stock_threshold int not null default 5;
alter table public.products drop constraint if exists products_low_stock_threshold_nonneg;
alter table public.products add constraint products_low_stock_threshold_nonneg check (low_stock_threshold >= 0);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('new_order', 'return_request', 'low_stock', 'out_of_stock')),
  title text not null,
  body text,
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists admin_notifications_unread_idx on public.admin_notifications (created_at desc) where read_at is null;

alter table public.admin_notifications enable row level security;

drop policy if exists "Admins read notifications" on public.admin_notifications;
create policy "Admins read notifications" on public.admin_notifications for select using (public.is_admin());
drop policy if exists "Admins update notifications" on public.admin_notifications;
create policy "Admins update notifications" on public.admin_notifications for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete notifications" on public.admin_notifications;
create policy "Admins delete notifications" on public.admin_notifications for delete using (public.is_admin());

-- New order
create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.admin_notifications (type, title, body, order_id)
  values (
    'new_order',
    'New order ' || new.order_number,
    coalesce(new.customer_name, 'A customer') || ' · $' || to_char(new.total, 'FM999990.00') ||
      ' · ' || case when new.payment_method = 'cod' then 'Cash on delivery' else 'Online payment' end,
    new.id
  );
  return new;
end;
$$;
drop trigger if exists orders_notify_new on public.orders;
create trigger orders_notify_new after insert on public.orders
  for each row execute function public.notify_new_order();

-- Return requested
create or replace function public.notify_return_request()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'return_refund' and new.return_status = 'requested'
     and (old.return_status is distinct from 'requested') then
    insert into public.admin_notifications (type, title, body, order_id)
    values ('return_request', 'Return requested for ' || new.order_number, new.return_reason, new.id);
  end if;
  return new;
end;
$$;
drop trigger if exists orders_notify_return on public.orders;
create trigger orders_notify_return after update of status, return_status on public.orders
  for each row execute function public.notify_return_request();

-- Stock crossing its threshold (fires once per crossing, not on every sale)
create or replace function public.notify_low_stock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.stock = 0 and old.stock > 0 then
    insert into public.admin_notifications (type, title, body, product_id)
    values ('out_of_stock', new.name || ' is out of stock', 'Restock to keep selling it.', new.id);
  elsif new.stock <= new.low_stock_threshold and old.stock > old.low_stock_threshold then
    insert into public.admin_notifications (type, title, body, product_id)
    values ('low_stock', new.name || ' is running low', 'Only ' || new.stock || ' left (alert level ' || new.low_stock_threshold || ').', new.id);
  end if;
  return new;
end;
$$;
drop trigger if exists products_notify_low_stock on public.products;
create trigger products_notify_low_stock after update of stock on public.products
  for each row execute function public.notify_low_stock();

-- Backfill: flag anything that is already low so the dashboard is accurate on day one
insert into public.admin_notifications (type, title, body, product_id)
select case when p.stock = 0 then 'out_of_stock' else 'low_stock' end,
       p.name || case when p.stock = 0 then ' is out of stock' else ' is running low' end,
       'Only ' || p.stock || ' left (alert level ' || p.low_stock_threshold || ').',
       p.id
from public.products p
where p.is_active and p.stock <= p.low_stock_threshold
  and not exists (select 1 from public.admin_notifications n where n.product_id = p.id and n.read_at is null);

-- ========================================================
-- RETURN WINDOW: 30 days (matches the "30-Day Returns" promise across the storefront)
-- ========================================================
create or replace function public.request_return(p_order_id uuid, p_reason text)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'Please tell us why you are returning this order'; end if;
  select * into v_order from public.orders
  where id = p_order_id and user_id = auth.jwt()->>'sub' for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if v_order.status <> 'completed' then raise exception 'Only completed orders can be returned'; end if;
  if coalesce(v_order.delivered_at, v_order.updated_at) < now() - interval '30 days' then
    raise exception 'The 30-day return window has passed';
  end if;

  update public.orders
  set status = 'return_refund', return_status = 'requested', return_reason = trim(p_reason)
  where id = p_order_id returning * into v_order;
  perform public.log_order_event(p_order_id, 'return_refund', 'Return requested: ' || trim(p_reason));
  return v_order;
end;
$$;
