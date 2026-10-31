-- ========================================================
-- ZION: ORDERS WORKFLOW + ADMIN
-- Run AFTER supabase_schema.sql (safe to re-run).
-- Identity comes from the Clerk JWT: auth.jwt()->>'sub'
-- ========================================================

-- --------------------------------------------------------
-- 1. ADMINS + SETTINGS
-- --------------------------------------------------------
create table if not exists public.admins (
  user_id text primary key,            -- Clerk user id (user_...)
  email text,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.jwt()->>'sub');
$$;

drop policy if exists "Admins can view admins" on public.admins;
create policy "Admins can view admins" on public.admins for select using (public.is_admin());

create table if not exists public.app_settings (
  key text primary key,
  value text not null
);
alter table public.app_settings enable row level security;

drop policy if exists "Anyone can read settings" on public.app_settings;
create policy "Anyone can read settings" on public.app_settings for select using (true);
drop policy if exists "Admins manage settings" on public.app_settings;
create policy "Admins manage settings" on public.app_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- demo_payments=true lets customers "simulate" a PayMongo payment without the Edge Function.
-- TURN OFF BEFORE GOING LIVE:  update app_settings set value='false' where key='demo_payments';
insert into public.app_settings (key, value) values ('demo_payments', 'true')
on conflict (key) do nothing;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- --------------------------------------------------------
-- 2. PRODUCTS: admin CRUD
-- --------------------------------------------------------
alter table public.products add column if not exists is_active boolean not null default true;
alter table public.products add column if not exists updated_at timestamptz default now();
alter table public.products alter column image_url drop not null;
alter table public.products drop constraint if exists products_stock_nonneg;
alter table public.products add constraint products_stock_nonneg check (stock >= 0);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products" on public.products
  for select using (is_active or public.is_admin());

drop policy if exists "Admins insert products" on public.products;
create policy "Admins insert products" on public.products for insert with check (public.is_admin());
drop policy if exists "Admins update products" on public.products;
create policy "Admins update products" on public.products for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete products" on public.products;
create policy "Admins delete products" on public.products for delete using (public.is_admin());

-- Admins can see all customer profiles
drop policy if exists "Admins can view profiles" on public.profiles;
create policy "Admins can view profiles" on public.profiles for select using (public.is_admin());

-- Product image storage
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images" on storage.objects
  for select using (bucket_id = 'product-images');
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- --------------------------------------------------------
-- 3. ORDERS WORKFLOW
-- --------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

alter table public.orders add column if not exists order_number text;
alter table public.orders add column if not exists payment_status text not null default 'unpaid';
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists subtotal numeric(10,2) not null default 0;
alter table public.orders add column if not exists discount numeric(10,2) not null default 0;
alter table public.orders add column if not exists tax numeric(10,2) not null default 0;
alter table public.orders add column if not exists shipping_fee numeric(10,2) not null default 0;
alter table public.orders add column if not exists promo_code text;
alter table public.orders add column if not exists gift_note text;
alter table public.orders add column if not exists courier text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists cancel_reason text;
alter table public.orders add column if not exists return_reason text;
alter table public.orders add column if not exists return_status text;      -- requested | approved | rejected | refunded
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists updated_at timestamptz default now();

-- Map legacy statuses onto the new workflow
alter table public.orders drop constraint if exists orders_status_check;
update public.orders set status = case status
  when 'pending'   then 'to_pay'
  when 'paid'      then 'to_ship'
  when 'fulfilled' then 'completed'
  when 'failed'    then 'cancelled'
  else status end
where status in ('pending', 'paid', 'fulfilled', 'failed');
update public.orders set order_number = 'ZION-' || nextval('public.order_number_seq')
where order_number is null;

alter table public.orders alter column status set default 'to_pay';
alter table public.orders add constraint orders_status_check
  check (status in ('to_pay', 'to_ship', 'to_receive', 'completed', 'return_refund', 'cancelled'));
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('unpaid', 'paid', 'cod', 'refund_pending', 'refunded'));
alter table public.orders alter column order_number set default ('ZION-' || nextval('public.order_number_seq'));
create unique index if not exists orders_order_number_key on public.orders (order_number);
create index if not exists orders_user_status_idx on public.orders (user_id, status);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  image_url text,
  price numeric(10,2) not null,
  quantity int not null check (quantity > 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

-- Reads only: all writes go through the RPCs below
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders" on public.orders
  for select using (auth.jwt()->>'sub' = user_id or public.is_admin());

drop policy if exists "View own order items" on public.order_items;
create policy "View own order items" on public.order_items for select using (
  public.is_admin() or exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = auth.jwt()->>'sub')
);

drop policy if exists "View own order events" on public.order_events;
create policy "View own order events" on public.order_events for select using (
  public.is_admin() or exists (
    select 1 from public.orders o where o.id = order_id and o.user_id = auth.jwt()->>'sub')
);

-- --------------------------------------------------------
-- 4. RPCs
-- --------------------------------------------------------
create or replace function public.log_order_event(p_order_id uuid, p_status text, p_note text)
returns void language sql security definer set search_path = public as $$
  insert into public.order_events (order_id, status, note) values (p_order_id, p_status, p_note);
$$;
revoke execute on function public.log_order_event(uuid, text, text) from public, anon, authenticated;

create or replace function public.restore_order_stock(p_order_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.products p set stock = p.stock + oi.quantity
  from public.order_items oi where oi.order_id = p_order_id and oi.product_id = p.id;
$$;
revoke execute on function public.restore_order_stock(uuid) from public, anon, authenticated;

-- Place an order from the signed-in user's saved bag. Totals are computed here, never trusted from the client.
create or replace function public.place_order(
  p_shipping jsonb,
  p_payment_method text,
  p_promo text default null,
  p_gift_note text default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_uid text := auth.jwt()->>'sub';
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_tax numeric(10,2);
  v_ship numeric(10,2);
  v_total numeric(10,2);
  v_count int := 0;
  v_promo text := upper(trim(coalesce(p_promo, '')));
  v_order public.orders;
  r record;
begin
  if v_uid is null then raise exception 'Please sign in to place an order'; end if;
  if p_payment_method not in ('paymongo', 'cod') then raise exception 'Unsupported payment method'; end if;
  if coalesce(trim(p_shipping->>'full_name'), '') = ''
     or coalesce(trim(p_shipping->>'email'), '') = ''
     or coalesce(trim(p_shipping->>'phone'), '') = ''
     or coalesce(trim(p_shipping->>'address'), '') = ''
     or coalesce(trim(p_shipping->>'city'), '') = ''
     or coalesce(trim(p_shipping->>'postal_code'), '') = '' then
    raise exception 'Please complete your delivery details';
  end if;

  insert into public.profiles (id, email, full_name)
  values (v_uid, p_shipping->>'email', p_shipping->>'full_name')
  on conflict (id) do nothing;

  for r in
    select c.quantity, p.id, p.name, p.price, p.stock, p.is_active
    from public.cart_items c join public.products p on p.id = c.product_id
    where c.user_id = v_uid
    for update of p
  loop
    if not r.is_active then raise exception '"%" is no longer available', r.name; end if;
    if r.stock < r.quantity then raise exception 'Only % left of "%"', r.stock, r.name; end if;
    v_subtotal := v_subtotal + r.price * r.quantity;
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then raise exception 'Your bag is empty'; end if;

  if v_promo = 'ZION10' then v_discount := round(v_subtotal * 0.10, 2);
  elsif v_promo = 'ATELIER' then v_discount := least(v_subtotal, 50);
  elsif v_promo <> '' then raise exception 'Invalid promo code';
  end if;

  v_tax := round((v_subtotal - v_discount) * 0.08, 2);
  v_ship := case when v_subtotal > 150 then 0 else 25 end;
  v_total := v_subtotal - v_discount + v_tax + v_ship;

  insert into public.orders (
    user_id, total, subtotal, discount, tax, shipping_fee, promo_code, gift_note,
    status, payment_status, payment_method, shipping_address, customer_name, customer_email
  ) values (
    v_uid, v_total, v_subtotal, v_discount, v_tax, v_ship, nullif(v_promo, ''), nullif(trim(coalesce(p_gift_note, '')), ''),
    case when p_payment_method = 'cod' then 'to_ship' else 'to_pay' end,
    case when p_payment_method = 'cod' then 'cod' else 'unpaid' end,
    p_payment_method, p_shipping, p_shipping->>'full_name', p_shipping->>'email'
  ) returning * into v_order;

  insert into public.order_items (order_id, product_id, name, image_url, price, quantity)
  select v_order.id, p.id, p.name, p.image_url, p.price, c.quantity
  from public.cart_items c join public.products p on p.id = c.product_id
  where c.user_id = v_uid;

  update public.products p set stock = p.stock - c.quantity
  from public.cart_items c where c.user_id = v_uid and c.product_id = p.id;

  delete from public.cart_items where user_id = v_uid;

  perform public.log_order_event(v_order.id, 'placed', 'Order placed');
  if p_payment_method = 'cod' then
    perform public.log_order_event(v_order.id, v_order.status, 'Cash on delivery - preparing your order');
  else
    perform public.log_order_event(v_order.id, v_order.status, 'Waiting for payment');
  end if;

  return v_order;
end;
$$;

-- Payment confirmed (PayMongo webhook uses the service role; demo path is gated by app_settings)
create or replace function public.mark_order_paid(p_order_id uuid, p_reference text default null)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  update public.orders
  set status = 'to_ship', payment_status = 'paid', paid_at = now(),
      payment_reference = coalesce(p_reference, payment_reference)
  where id = p_order_id and status = 'to_pay'
  returning * into v_order;

  if v_order.id is not null then
    perform public.log_order_event(v_order.id, 'to_ship', 'Payment received - preparing your order');
  else
    select * into v_order from public.orders where id = p_order_id;
  end if;
  return v_order;
end;
$$;
revoke execute on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;

create or replace function public.demo_mark_paid(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  if coalesce((select value from public.app_settings where key = 'demo_payments'), 'false') <> 'true' then
    raise exception 'Demo payments are disabled';
  end if;
  select * into v_order from public.orders where id = p_order_id and user_id = auth.jwt()->>'sub';
  if v_order.id is null then raise exception 'Order not found'; end if;
  return public.mark_order_paid(p_order_id, 'demo_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
end;
$$;

create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders
  where id = p_order_id and user_id = auth.jwt()->>'sub' for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if v_order.status not in ('to_pay', 'to_ship') then
    raise exception 'This order can no longer be cancelled';
  end if;

  update public.orders
  set status = 'cancelled',
      cancel_reason = nullif(trim(coalesce(p_reason, '')), ''),
      payment_status = case when payment_status = 'paid' then 'refund_pending' else payment_status end
  where id = p_order_id returning * into v_order;

  perform public.restore_order_stock(p_order_id);
  perform public.log_order_event(p_order_id, 'cancelled', coalesce(nullif(trim(coalesce(p_reason, '')), ''), 'Cancelled by customer'));
  return v_order;
end;
$$;

create or replace function public.confirm_received(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  update public.orders
  set status = 'completed', delivered_at = now(),
      payment_status = case when payment_status = 'cod' then 'paid' else payment_status end
  where id = p_order_id and user_id = auth.jwt()->>'sub' and status = 'to_receive'
  returning * into v_order;
  if v_order.id is null then raise exception 'Order is not awaiting delivery'; end if;
  perform public.log_order_event(p_order_id, 'completed', 'Delivered - confirmed by customer');
  return v_order;
end;
$$;

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
  if coalesce(v_order.delivered_at, v_order.updated_at) < now() - interval '7 days' then
    raise exception 'The 7-day return window has passed';
  end if;

  update public.orders
  set status = 'return_refund', return_status = 'requested', return_reason = trim(p_reason)
  where id = p_order_id returning * into v_order;
  perform public.log_order_event(p_order_id, 'return_refund', 'Return requested: ' || trim(p_reason));
  return v_order;
end;
$$;

-- Admin: move an order through fulfilment
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
  if p_status not in ('to_ship', 'to_receive', 'completed', 'cancelled') then
    raise exception 'Invalid status';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Order not found'; end if;
  if v_order.status in ('cancelled', 'return_refund') then
    raise exception 'This order is closed';
  end if;

  if p_status = 'cancelled' then
    update public.orders
    set status = 'cancelled', cancel_reason = coalesce(nullif(trim(p_note), ''), 'Cancelled by store'),
        payment_status = case when payment_status = 'paid' then 'refund_pending' else payment_status end
    where id = p_order_id returning * into v_order;
    perform public.restore_order_stock(p_order_id);
  elsif p_status = 'to_ship' then
    -- manual payment confirmation (e.g. bank transfer) when still waiting for payment
    update public.orders
    set status = 'to_ship',
        payment_status = case when status = 'to_pay' then 'paid' else payment_status end,
        paid_at = case when status = 'to_pay' then now() else paid_at end
    where id = p_order_id returning * into v_order;
  elsif p_status = 'to_receive' then
    update public.orders
    set status = 'to_receive', shipped_at = now(),
        courier = coalesce(nullif(trim(p_courier), ''), courier),
        tracking_number = coalesce(nullif(trim(p_tracking), ''), tracking_number)
    where id = p_order_id returning * into v_order;
  else
    update public.orders
    set status = 'completed', delivered_at = now(),
        payment_status = case when payment_status = 'cod' then 'paid' else payment_status end
    where id = p_order_id returning * into v_order;
  end if;

  perform public.log_order_event(p_order_id, p_status, coalesce(nullif(trim(p_note), ''),
    case p_status when 'to_ship' then 'Payment confirmed - preparing your order'
                  when 'to_receive' then 'Shipped' || coalesce(' via ' || nullif(trim(p_courier), ''), '')
                  when 'completed' then 'Delivered'
                  else 'Cancelled by store' end));
  return v_order;
end;
$$;

-- Admin: decide on a return request
create or replace function public.admin_resolve_return(p_order_id uuid, p_decision text, p_note text default null)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_decision not in ('approved', 'rejected', 'refunded') then raise exception 'Invalid decision'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null or v_order.status <> 'return_refund' then
    raise exception 'No open return for this order';
  end if;

  if p_decision = 'rejected' then
    update public.orders set status = 'completed', return_status = 'rejected'
    where id = p_order_id returning * into v_order;
    perform public.log_order_event(p_order_id, 'completed', coalesce(nullif(trim(p_note), ''), 'Return request declined'));
  elsif p_decision = 'approved' then
    update public.orders set return_status = 'approved'
    where id = p_order_id returning * into v_order;
    perform public.log_order_event(p_order_id, 'return_refund', coalesce(nullif(trim(p_note), ''), 'Return approved - please send the items back'));
  else
    update public.orders set return_status = 'refunded', payment_status = 'refunded'
    where id = p_order_id returning * into v_order;
    perform public.restore_order_stock(p_order_id);
    perform public.log_order_event(p_order_id, 'return_refund', coalesce(nullif(trim(p_note), ''), 'Refund issued'));
  end if;
  return v_order;
end;
$$;

-- Admin: record that a cancelled-but-paid order has been refunded in the payment dashboard
create or replace function public.admin_mark_refunded(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v_order public.orders;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.orders set payment_status = 'refunded'
  where id = p_order_id and payment_status = 'refund_pending'
  returning * into v_order;
  if v_order.id is null then raise exception 'No pending refund for this order'; end if;
  perform public.log_order_event(p_order_id, v_order.status, 'Refund issued');
  return v_order;
end;
$$;

-- --------------------------------------------------------
-- 5. HOW TO MAKE YOURSELF ADMIN (replace with your Clerk user id)
-- --------------------------------------------------------
-- insert into public.admins (user_id, email) values ('user_xxxxxxxx', 'you@example.com');
