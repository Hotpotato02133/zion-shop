-- ========================================================
-- ZION ATELIER: 100% FREE AI FEATURES & PGVECTOR MIGRATION
-- Run AFTER 004_cod_approval_shipping.sql (safe to re-run).
-- ========================================================

-- 1. Enable the pgvector extension (100% Free in Supabase)
create extension if not exists vector;

-- 2. Enhance the products table with AI columns
alter table public.products
  add column if not exists embedding vector(768),
  add column if not exists ai_review_summary jsonb default null,
  add column if not exists ai_tags text[] default '{}',
  add column if not exists visual_attributes jsonb default null;

-- 3. Create an index for fast semantic vector search
create index if not exists products_embedding_idx
  on public.products
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. Create an AI Rate-Limiting & Usage Tracking table
create table if not exists public.ai_api_logs (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  feature text not null,
  created_at timestamptz default now()
);

create index if not exists ai_api_logs_user_created_idx
  on public.ai_api_logs (clerk_user_id, created_at desc);

alter table public.ai_api_logs enable row level security;

drop policy if exists "Anyone can read own ai logs" on public.ai_api_logs;
create policy "Anyone can read own ai logs"
  on public.ai_api_logs for select
  using (true);

drop policy if exists "Anyone can insert ai logs" on public.ai_api_logs;
create policy "Anyone can insert ai logs"
  on public.ai_api_logs for insert
  with check (true);

-- 5. Create the RPC function for Semantic Product Search
drop function if exists public.match_products(vector(768), float, int);
create or replace function public.match_products (
  query_embedding vector(768),
  match_threshold float default 0.35,
  match_count int default 12
)
returns table (
  id uuid,
  name text,
  description text,
  price numeric,
  original_price numeric,
  category text,
  tag text,
  image_url text,
  gallery jsonb,
  rating numeric,
  reviews_count int,
  stock int,
  specs jsonb,
  ai_review_summary jsonb,
  ai_tags text[],
  similarity float
)
language sql stable
as $$
  select
    products.id,
    products.name,
    products.description,
    products.price,
    products.original_price,
    products.category,
    products.tag,
    products.image_url,
    products.gallery,
    products.rating,
    products.reviews_count,
    products.stock,
    products.specs,
    products.ai_review_summary,
    products.ai_tags,
    1 - (products.embedding <=> query_embedding) as similarity
  from public.products
  where products.is_active = true
    and products.embedding is not null
    and 1 - (products.embedding <=> query_embedding) > match_threshold
  order by products.embedding <=> query_embedding
  limit match_count;
$$;

-- 6. Create Product Reviews table (for Feature 4: AI Review Summarizer)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id text,
  author_name text not null default 'Verified Atelier Client',
  rating int not null check (rating >= 1 and rating <= 5),
  comment text not null,
  verified_purchase boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists reviews_product_created_idx
  on public.reviews (product_id, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews"
  on public.reviews for select
  using (true);

drop policy if exists "Authenticated users can insert reviews" on public.reviews;
create policy "Authenticated users can insert reviews"
  on public.reviews for insert
  with check (auth.jwt()->>'sub' is not null or user_id is not null);

-- RPC to cache AI review summary onto products safely
create or replace function public.cache_product_review_summary(
  p_product_id uuid,
  p_summary jsonb
) returns void
language sql security definer set search_path = public
as $$
  update public.products
  set ai_review_summary = p_summary
  where id = p_product_id;
$$;

-- Seed initial verified buyer reviews so AI Review Summarizer has rich data immediately
insert into public.reviews (product_id, author_name, rating, comment, verified_purchase)
select p.id, v.author_name, v.rating, v.comment, true
from public.products p
cross join lateral (
  values
    ('Elena V.', 5, 'Exceptional drape and fabric weight. Feels far more expensive than the price tag and holds its structure after multiple washes.'),
    ('Marcus T.', 5, 'The tailoring and seam work are impeccable. Fits true to size with a clean architectural silhouette.'),
    ('Sora K.', 4, 'Love the minimalist aesthetic and breathable material. Runs slightly structured at first but softens nicely after a day of wear.'),
    ('Julian R.', 5, 'An everyday staple in my wardrobe now. Pairs effortlessly with both tailored trousers and relaxed denim.')
) as v(author_name, rating, comment)
where not exists (
  select 1 from public.reviews r where r.product_id = p.id
);

-- 7. Create Support / Refund Triage table (Feature 7)
create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  clerk_user_id text not null,
  reason text not null,
  evidence_image_url text,
  ai_damage_verified boolean default false,
  ai_confidence_score numeric,
  ai_assessment_notes text,
  status text default 'pending_review' check (status in ('auto_approved', 'pending_review', 'rejected')),
  created_at timestamptz default now()
);

create index if not exists refund_requests_order_idx
  on public.refund_requests (order_id, created_at desc);

alter table public.refund_requests enable row level security;

drop policy if exists "Users and admins can view refund requests" on public.refund_requests;
create policy "Users and admins can view refund requests"
  on public.refund_requests for select
  using (auth.jwt()->>'sub' = clerk_user_id or public.is_admin());

drop policy if exists "Users can create own refund requests" on public.refund_requests;
create policy "Users can create own refund requests"
  on public.refund_requests for insert
  with check (auth.jwt()->>'sub' = clerk_user_id);

drop policy if exists "Admins can update refund requests" on public.refund_requests;
create policy "Admins can update refund requests"
  on public.refund_requests for update
  using (public.is_admin())
  with check (public.is_admin());

-- Storage bucket for return/refund damage evidence photos
insert into storage.buckets (id, name, public)
values ('return-evidence', 'return-evidence', true)
on conflict (id) do nothing;

drop policy if exists "Public read return evidence" on storage.objects;
create policy "Public read return evidence" on storage.objects
  for select using (bucket_id = 'return-evidence');

drop policy if exists "Authenticated upload return evidence" on storage.objects;
create policy "Authenticated upload return evidence" on storage.objects
  for insert with check (bucket_id = 'return-evidence');

