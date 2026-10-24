-- ========================================================
-- ZION ATELIER E-COMMERCE: SUPABASE POSTGRESQL SCHEMA
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
-- SEED DATA: CURATED LUXURY CATALOG (12 PIECES)
-- ========================================================
insert into public.products (id, name, description, price, original_price, image_url, category, tag, rating, reviews_count, stock, specs)
values 
  (
    '00000000-0000-0000-0000-000000000001',
    'Atelier Wireless Over-Ear Headphones',
    'Precision acoustic engineering featuring 40mm custom beryllium drivers, memory foam ear cushions wrapped in full-grain lambskin, and 45-hour active noise cancellation.',
    299.00,
    399.00,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1400&auto=format&fit=crop',
    'Electronics',
    'Limited Edition',
    4.9,
    142,
    7,
    '{"Material": "Anodized Aluminum & Lambskin", "Battery": "45h Active ANC Playback", "Origin": "Designed in Copenhagen", "Warranty": "3-Year Global Warranty"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Monochrome Minimalist Chronograph',
    'Surgical-grade 316L matte black case paired with double-domed anti-reflective sapphire crystal and a Swiss automatic self-winding caliber.',
    420.00,
    480.00,
    'https://images.unsplash.com/photo-1523170335258-f5e6a7c0c1c4?q=80&w=1400&auto=format&fit=crop',
    'Accessories',
    'Bestseller',
    4.9,
    98,
    5,
    '{"Movement": "Automatic Caliber 2824-2", "Case": "316L Sandblasted Steel (40mm)", "Glass": "Anti-Reflective Sapphire", "Water Resistance": "5 ATM / 50 Meters"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Full-Grain Structured Leather Backpack',
    'Vegetable-tanned Tuscan leather conditioned with natural beeswax. Includes a padded 16-inch laptop pocket and water-resistant YKK Excella zippers.',
    340.00,
    390.00,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1400&auto=format&fit=crop',
    'Fashion',
    'Handcrafted',
    4.8,
    215,
    12,
    '{"Material": "Tuscan Full-Grain Vachetta", "Hardware": "Brushed Solid Brass", "Capacity": "22 Liters", "Dimensions": "44cm x 30cm x 15cm"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Acoustic Sculptural Smart Speaker',
    'Monolithic acoustic sphere wrapped in acoustically transparent Nordic wool fabric. Features custom DSP room-tuning and lossless multi-room streaming.',
    189.00,
    null,
    'https://images.unsplash.com/photo-1543512214-318c7553f230?q=80&w=1400&auto=format&fit=crop',
    'Electronics',
    'New Arrival',
    4.7,
    76,
    15,
    '{"Audio": "90W Class-D Amplification", "Connectivity": "WiFi 6, AirPlay 2, Bluetooth 5.3", "Enclosure": "Resonance-Free Mineral Composite", "Weight": "3.2 kg"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Japanese Acetate Luxury Sunglasses',
    'Hand-cut 8mm Japanese Takiron cellulose acetate with seven-barrel hinges and scratch-resistant polarized Carl Zeiss lenses offering 100% UV protection.',
    240.00,
    280.00,
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1400&auto=format&fit=crop',
    'Accessories',
    'Seasonal',
    4.8,
    110,
    9,
    '{"Frame": "Japanese Cured Acetate", "Lenses": "Carl Zeiss CR-39 Polarized", "Hinges": "7-Barrel Custom German Steel", "UV Protection": "UV400 Cat. 3"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'Handcrafted Scented Atelier Candle',
    'Hand-poured coconut and soy wax blend infused with wild cypress, smoke, and black amber. Encased in a reusable mouth-blown smoked obsidian tumbler.',
    68.00,
    null,
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=1400&auto=format&fit=crop',
    'Home',
    'Atelier',
    4.9,
    180,
    25,
    '{"Burn Time": "Approx. 65 Hours", "Wax": "100% Organic Soy & Coconut", "Vessel": "Mouth-Blown Smoked Glass", "Scent Profile": "Cypress, Black Amber, Cedar"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000007',
    'Ceramic Matte Minimalist Coffee Set',
    'Wheel-thrown high-fire stoneware glazed with an unrefined basalt matte finish. Includes precision pour-over dripper, carafe, and two matching espresso cups.',
    125.00,
    150.00,
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1400&auto=format&fit=crop',
    'Home',
    'Artisan',
    4.9,
    94,
    14,
    '{"Material": "High-Fire Stoneware Ceramic", "Glaze": "Food-Safe Basalt Matte", "Dishwasher Safe": "Yes", "Carafe Capacity": "600 ml"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000008',
    'Vegetable-Tanned Heritage Leather Journal',
    'Heirloom journal with a solid brass binder mechanism, holding 192 pages of bleed-resistant 120gsm Japanese fountain-pen friendly cotton paper.',
    95.00,
    null,
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1400&auto=format&fit=crop',
    'Accessories',
    'Refillable',
    4.9,
    84,
    18,
    '{"Paper": "120gsm Japanese Cotton Archive", "Cover": "Full-Grain English Bridle Leather", "Binding": "Refillable Solid Brass Screwpost", "Page Count": "192 Leaves"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000009',
    'Double-Faced Cashmere Minimalist Overcoat',
    'Unlined double-faced cashmere constructed using hand-split and hand-stitched invisible seam techniques by master tailors in Florence.',
    780.00,
    920.00,
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop',
    'Fashion',
    'Atelier Spotlight',
    5.0,
    62,
    4,
    '{"Composition": "90% Mongolian Cashmere, 10% Silk", "Buttons": "Natural Buffalo Horn", "Origin": "Handmade in Florence, Italy", "Care": "Specialist Dry Clean Only"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000010',
    'Aircraft-Grade Titanium Fast Wireless Valet',
    'CNC-milled from a solid billet of Grade 5 titanium, inlaid with Italian Alcantara and capable of dual 15W Qi2 MagSafe fast charging.',
    115.00,
    null,
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1400&auto=format&fit=crop',
    'Electronics',
    'New',
    4.7,
    58,
    20,
    '{"Material": "Grade 5 Titanium & Alcantara", "Charging Standard": "Qi2 Certified 15W MagSafe", "Ports": "USB-C Braided Cable Included", "Compatibility": "iPhone, AirPods, Android"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000011',
    'Hand-Forged 67-Layer Damascus Santoku',
    'Folded VG-10 core wrapped in 66 layers of nickel steel. Finished with an octagonal bog-oak handle and buffalo horn ferrule for surgical balance.',
    210.00,
    250.00,
    'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1400&auto=format&fit=crop',
    'Home',
    'Limited Craft',
    4.9,
    43,
    6,
    '{"Core Steel": "Japanese VG-10 (61 HRC)", "Blade Length": "180mm / 7 Inches", "Handle": "Stabilized Bog Oak & Horn", "Sharpening Angle": "15° Double Bevel"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    'Pure Mulberry Silk Twill Modular Scarf',
    '18 momme heavy silk twill featuring subtle monochrome geometric engravings. Finished with French hand-rolled edges in Lake Como, Italy.',
    165.00,
    null,
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1400&auto=format&fit=crop',
    'Fashion',
    'Silk Archive',
    4.8,
    77,
    16,
    '{"Material": "100% Grade 6A Mulberry Silk (18mm)", "Dimensions": "90cm x 90cm", "Finishing": "Hand-Rolled & Stitched Edges", "Origin": "Como, Italy"}'::jsonb
  )
on conflict (id) do nothing;
