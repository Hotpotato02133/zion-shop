-- ========================================================
-- ZION APPAREL E-COMMERCE: SUPABASE POSTGRESQL SCHEMA
-- Integrated with Clerk Authentication (Third-Party Auth)
-- ========================================================

-- Enable standard UUID generation
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- --------------------------------------------------------
-- 1. PROFILES TABLE (Mirrors Clerk Identity)
-- --------------------------------------------------------
create table if not exists public.profiles (
  id text primary key, -- Clerk User ID (e.g. user_2b9x...)
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- --------------------------------------------------------
-- 2. PRODUCTS CATALOG TABLE
-- --------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  original_price numeric(10,2),
  image_url text not null,
  gallery jsonb default '[]'::jsonb,
  category text not null,
  tag text,
  rating numeric(3,2) default 5.0,
  reviews_count int default 0,
  stock int default 10,
  specs jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- --------------------------------------------------------
-- 3. CART LINE ITEMS (Persistent across client devices)
-- --------------------------------------------------------
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int default 1 check (quantity > 0),
  added_at timestamptz default now(),
  unique (user_id, product_id)
);

-- --------------------------------------------------------
-- 4. WISHLIST ITEMS
-- --------------------------------------------------------
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  added_at timestamptz default now(),
  unique (user_id, product_id)
);

-- --------------------------------------------------------
-- 5. ORDERS & TRANSACTIONS
-- --------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(id) on delete cascade,
  total numeric(10,2) not null,
  status text not null default 'pending', -- 'pending', 'paid', 'failed', 'fulfilled'
  payment_method text,
  payment_reference text,
  shipping_address jsonb,
  line_items jsonb,
  created_at timestamptz default now()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR CLERK AUTH
-- ========================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;

-- Products Policies: Public read catalog
drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
  on public.products for select
  using (true);

-- Profiles Policies: Authenticated Clerk user owns their profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.jwt()->>'sub' = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.jwt()->>'sub' = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.jwt()->>'sub' = id);

-- Cart Items Policies: User-isolated operations
drop policy if exists "Users can view own cart" on public.cart_items;
create policy "Users can view own cart"
  on public.cart_items for select
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can add to own cart" on public.cart_items;
create policy "Users can add to own cart"
  on public.cart_items for insert
  with check (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can update own cart item" on public.cart_items;
create policy "Users can update own cart item"
  on public.cart_items for update
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can delete own cart item" on public.cart_items;
create policy "Users can delete own cart item"
  on public.cart_items for delete
  using (auth.jwt()->>'sub' = user_id);

-- Wishlist Items Policies: User-isolated operations
drop policy if exists "Users can view own wishlist" on public.wishlist_items;
create policy "Users can view own wishlist"
  on public.wishlist_items for select
  using (auth.jwt()->>'sub' = user_id);

drop policy if exists "Users can manage own wishlist" on public.wishlist_items;
create policy "Users can manage own wishlist"
  on public.wishlist_items for all
  using (auth.jwt()->>'sub' = user_id)
  with check (auth.jwt()->>'sub' = user_id);

-- Orders Policies: User can view their own orders
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select
  using (auth.jwt()->>'sub' = user_id);

-- ========================================================
-- RESET CATALOG: remove any non-apparel products
-- (electronics, home goods, ceramics, etc. from earlier drops)
-- ========================================================
delete from public.cart_items;
delete from public.wishlist_items;
delete from public.products;

-- ========================================================
-- SEED DATA: ZION APPAREL CATALOG
-- Tops, Bottoms, Outerwear, Footwear, Accessories
-- ========================================================
insert into public.products (id, name, description, price, original_price, image_url, gallery, category, tag, rating, reviews_count, stock, specs)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Classic Crewneck T-Shirt',
    'A wardrobe essential cut from heavyweight combed cotton jersey for a clean drape that holds its shape wash after wash. Reinforced collar seam and double-stitched hem.',
    28.00,
    35.00,
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Tops',
    'Bestseller',
    4.8,
    326,
    48,
    '{"Material": "100% Combed Cotton Jersey", "Fit": "Regular Fit", "Sizes": "XS, S, M, L, XL, XXL", "Care": "Machine Wash Cold"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Essential Tee 3-Pack',
    'Three go-to crewneck tees in rotating core colors. Pre-shrunk cotton blend keeps its fit through everyday wear and frequent washing.',
    45.00,
    null,
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Tops',
    'New In',
    4.6,
    154,
    60,
    '{"Material": "95% Cotton, 5% Elastane", "Fit": "Regular Fit", "Pack Size": "3 Tees", "Care": "Machine Wash Cold"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Fringed Knit Poncho Sweater',
    'Hand-finished open-knit poncho sweater with a relaxed V-neck and fringe hem. Lightweight enough to layer, textured enough to wear alone.',
    58.00,
    72.00,
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Tops',
    'Handcrafted',
    4.7,
    61,
    22,
    '{"Material": "Cotton-Acrylic Knit Blend", "Fit": "Relaxed / One Size", "Length": "Hip Length", "Care": "Hand Wash Cold"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Corduroy Long-Sleeve Shirt Dress',
    'A fitted-waist shirt dress in brushed corduroy with a button placket and three-quarter sleeves. Transitions easily from desk to dinner.',
    89.00,
    110.00,
    'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Tops',
    'New Arrival',
    4.9,
    47,
    16,
    '{"Material": "100% Cotton Corduroy", "Fit": "Fitted Waist, A-Line Skirt", "Sizes": "XS, S, M, L, XL", "Care": "Machine Wash Cold"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'Off-Shoulder Ruffle Mini Dress',
    'Breathable cotton-poplin off-shoulder mini dress with an elasticated ruffle neckline and tiered hem. Warm-weather staple with a flattering silhouette.',
    42.00,
    null,
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Tops',
    'Seasonal',
    4.5,
    88,
    30,
    '{"Material": "100% Cotton Poplin", "Fit": "Relaxed, Off-Shoulder", "Sizes": "XS, S, M, L, XL", "Care": "Machine Wash Cold"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'Pleated Mini Skirt',
    'A box-pleated mini skirt in structured stretch twill with a concealed side zip. Pairs cleanly with tees, knits, or tucked-in shirts.',
    48.00,
    58.00,
    'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Bottoms',
    'Bestseller',
    4.7,
    133,
    34,
    '{"Material": "Stretch Twill (Poly-Viscose Blend)", "Fit": "A-Line, Box Pleat", "Sizes": "XS, S, M, L, XL", "Care": "Dry Clean Recommended"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000007',
    'High-Waist Jogger Pants',
    'Soft satin-twill joggers with a high elastic waistband, side pockets, and tapered elastic cuffs. Structured enough to dress up, soft enough for travel.',
    52.00,
    null,
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Bottoms',
    'New In',
    4.6,
    72,
    40,
    '{"Material": "Satin Twill (Poly Blend)", "Fit": "Tapered, High-Rise", "Sizes": "XS, S, M, L, XL", "Care": "Machine Wash Cold"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000008',
    'Classic Skinny Fit Jeans',
    'Five-pocket skinny jeans in rigid mid-wash denim with a hint of stretch for all-day movement. A clean, everyday staple.',
    68.00,
    82.00,
    'https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Bottoms',
    'Bestseller',
    4.8,
    241,
    45,
    '{"Material": "98% Cotton, 2% Elastane Denim", "Fit": "Skinny, Mid-Rise", "Sizes": "24-32 (Waist)", "Care": "Machine Wash Cold, Inside Out"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000009',
    'Relaxed Fit Sweatpants',
    'Brushed-back fleece sweatpants with a drawstring waist and tapered leg. Everyday comfort with a clean, minimal silhouette.',
    46.00,
    null,
    'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Bottoms',
    'New Arrival',
    4.5,
    58,
    38,
    '{"Material": "80% Cotton, 20% Polyester Fleece", "Fit": "Relaxed, Tapered Leg", "Sizes": "XS, S, M, L, XL, XXL", "Care": "Machine Wash Cold"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000010',
    'Faux Leather Biker Jacket',
    'A moto-inspired jacket in supple faux leather with an asymmetric zip front, snap lapels, and quilted shoulder panels. Fully lined for structure.',
    148.00,
    178.00,
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Outerwear',
    'Bestseller',
    4.8,
    97,
    18,
    '{"Material": "Faux Leather, Polyester Lining", "Fit": "Fitted, Cropped", "Sizes": "XS, S, M, L, XL", "Care": "Wipe Clean / Spot Clean Only"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000011',
    'Classic Denim Trucker Jacket',
    'A timeless button-front trucker jacket in rigid cotton denim with twin chest pockets and adjustable waist tabs. Built to fade and wear in beautifully.',
    96.00,
    null,
    'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Outerwear',
    'New In',
    4.7,
    112,
    24,
    '{"Material": "100% Cotton Denim", "Fit": "Classic, Button Front", "Sizes": "XS, S, M, L, XL", "Care": "Machine Wash Cold"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000012',
    'Oversized Utility Jacket',
    'An oversized shirt-jacket in brushed twill with chest flap pockets and a dropped shoulder seam. Layers easily over knits and tees.',
    118.00,
    140.00,
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Outerwear',
    'New Arrival',
    4.6,
    39,
    15,
    '{"Material": "Cotton Twill", "Fit": "Oversized", "Sizes": "S, M, L, XL", "Care": "Machine Wash Cold"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000013',
    'Leather Lace-Up Combat Boots',
    'Full-grain leather combat boots with a cap toe, reinforced eyelets, and a durable lugged outsole built for daily wear.',
    132.00,
    155.00,
    'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Footwear',
    'Bestseller',
    4.8,
    164,
    26,
    '{"Material": "Full-Grain Leather", "Outsole": "Rubber Lug Sole", "Sizes": "US 6 - US 12", "Care": "Leather Conditioner Recommended"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000014',
    'Tan Leather Work Boots',
    'Rugged oiled-leather work boots with a cushioned footbed and shock-absorbing sole. Durable enough for daily wear, refined enough for everyday fits.',
    145.00,
    null,
    'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Footwear',
    'New In',
    4.7,
    85,
    20,
    '{"Material": "Oiled Full-Grain Leather", "Outsole": "Shock-Absorbing Rubber", "Sizes": "US 7 - US 13", "Care": "Leather Conditioner Recommended"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000015',
    'Chunky Colorblock Sneakers',
    'Statement low-top sneakers in a colorblocked suede-and-mesh upper with a chunky lugged midsole for all-day comfort.',
    110.00,
    130.00,
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Footwear',
    'New Arrival',
    4.6,
    72,
    32,
    '{"Material": "Suede & Mesh Upper", "Outsole": "Chunky EVA Midsole", "Sizes": "US 6 - US 12", "Care": "Wipe Clean"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000016',
    'Floral Print Statement Heels',
    'Pointed-toe pumps in a hand-finished floral jacquard with a comfort-padded insole and a stable 90mm heel.',
    95.00,
    null,
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Footwear',
    'Seasonal',
    4.5,
    54,
    18,
    '{"Material": "Jacquard Textile Upper", "Heel Height": "90mm", "Sizes": "US 5 - US 10", "Care": "Spot Clean Only"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000017',
    'Round Metal-Frame Sunglasses',
    'Vintage-inspired round sunglasses in a lightweight gold-tone metal frame with polarized UV400 lenses.',
    38.00,
    48.00,
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Accessories',
    'Bestseller',
    4.7,
    198,
    50,
    '{"Frame": "Gold-Tone Metal", "Lenses": "Polarized UV400", "Fit": "One Size", "Care": "Microfiber Cloth Only"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000018',
    'Everyday Canvas Backpack',
    'A durable canvas backpack with a padded 15-inch laptop sleeve, water-resistant coating, and adjustable ergonomic straps.',
    78.00,
    95.00,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Accessories',
    'New In',
    4.8,
    143,
    28,
    '{"Material": "Water-Resistant Canvas", "Capacity": "20 Liters", "Laptop Sleeve": "Up to 15 Inches", "Care": "Spot Clean"}'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000019',
    'Structured Canvas Tote Bag',
    'A roomy structured tote in heavyweight cotton canvas with reinforced handles and an interior zip pocket. Everyday carry, built to last.',
    42.00,
    null,
    'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1400&auto=format&fit=crop',
    '["https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1400&auto=format&fit=crop"]'::jsonb,
    'Accessories',
    'New Arrival',
    4.6,
    76,
    35,
    '{"Material": "Heavyweight Cotton Canvas", "Capacity": "18 Liters", "Dimensions": "38cm x 34cm x 14cm", "Care": "Spot Clean"}'::jsonb
  )
on conflict (id) do nothing;
