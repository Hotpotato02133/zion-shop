# 🛒 E-Commerce Portfolio Website — Project Context (agent.md)

## 🧠 Project Overview
This project is a **fully functional e-commerce portfolio website** built to showcase modern full-stack development skills in 2025.  
The app demonstrates real-world architecture using:

- **Frontend:** React (Vite) + Tailwind CSS + Shadcn UI components  
- **Backend / Database:** Supabase (PostgreSQL + Auth + Realtime + Row-Level Security)  
- **Payments:** PayMongo (Test Mode API Integration) — sandbox checkout, no real transactions  
- **Fonts:** Urbanist (Headings) + Hauora Sans (Body)  
- **Design Theme:** Strictly **black & white** minimalist layout for a luxury-brand aesthetic

The app is intended for **portfolio/demo purposes only** — showing complete checkout, authentication, and CRUD flows, but without actual payment charges.

---

## ⚙️ Tech Stack Summary

| Layer | Technology | Notes |
|-------|-------------|-------|
| Frontend | **React + Vite** | Fast build toolchain; modular component structure |
| Styling | **Tailwind CSS + Shadcn UI** | Prebuilt and custom reusable UI components |
| Backend | **Supabase** | Handles Auth, PostgreSQL DB, Realtime updates |
| Payments | **PayMongo (Test Mode)** | Simulated checkout flow via sandbox keys |
| Fonts | **Urbanist & Hauora Sans** | Imported via Google Fonts |
| Language | **JavaScript / ESNext** | Clean, modular functional components |
| Server | **Node + Express** (or Supabase Edge Function) | For PayMongo secret-key operations |
| Auth | **Supabase Auth + Google OAuth** | Session persistence and route protection |

---

## 🧩 Features / Pages

1. **Landing Page**
   - Full-width hero banner and featured products grid.  
   - Uses Shadcn UI Cards and Tailwind responsive layout.

2. **Product Listing**
   - Fetches products from `products` table in Supabase.  
   - Grid layout with product image, name, price, and link to detail view.

3. **Product Detail**
   - Displays selected product info.  
   - “Add to Cart” and “Add to Wishlist” buttons insert rows into Supabase (`cart_items`, `wishlist_items`).

4. **Shopping Cart**
   - Lists user’s `cart_items`.  
   - Quantity controls, remove button, and dynamic total price.  
   - “Proceed to Checkout” triggers PayMongo sandbox payment.

5. **Wishlist**
   - Displays products from `wishlist_items`.  
   - Allows removal or transfer to cart.

6. **Checkout**
   - Shows cart summary and payment action.  
   - Creates PayMongo **Checkout Link (Test Mode)** via backend endpoint.  
   - After simulated success, inserts an `orders` record in Supabase and shows a success page.

7. **User Account**
   - Sign Up / Sign In / Sign Out via Supabase Auth.  
   - Google OAuth supported using `supabase.auth.signInWithOAuth({ provider: 'google' })`.  
   - Displays user profile and order history.

---

## 🗄️ Database Schema (Supabase SQL)

```sql
-- users / profiles
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

-- products
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- cart_items
create table cart_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity int default 1,
  added_at timestamptz default now()
);

-- wishlist_items
create table wishlist_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  added_at timestamptz default now()
);

-- orders
create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  total numeric(10,2),
  status text,
  payment_reference text,
  metadata jsonb,
  created_at timestamptz default now()
);
