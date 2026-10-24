# Integrations Roadmap: Supabase & PayMongo

This guide specifies the implementation plan, security architecture, and code patterns for integrating **Supabase** (Database + Auth) and **PayMongo** (Test Sandbox Checkout) into Zion E-Commerce.

---

## 1. System Integration Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Zion React Client
    participant SupabaseAuth as Supabase Auth (OAuth/Email)
    participant SupabaseDB as Supabase DB (PostgreSQL)
    participant BackendAPI as Backend / Edge Function (PayMongo Secret)
    participant PayMongo as PayMongo Sandbox

    %% Auth Flow
    User->>Frontend: Click "Sign in with Google" or Email
    Frontend->>SupabaseAuth: supabase.auth.signInWithOAuth({ provider: 'google' })
    SupabaseAuth-->>Frontend: Session & Access Token
    Frontend->>SupabaseDB: Fetch user's cart_items & profile

    %% Checkout Flow
    User->>Frontend: Clicks "Proceed to Checkout" (Cart.jsx)
    Frontend->>BackendAPI: POST /api/create-checkout (cartItems, userId)
    Note over BackendAPI: Validates prices server-side.<br/>Creates PayMongo Checkout Session.
    BackendAPI->>PayMongo: POST https://api.paymongo.com/v1/checkout_sessions
    PayMongo-->>BackendAPI: Return checkout_url & session_id
    BackendAPI->>SupabaseDB: Create order record (status: 'pending')
    BackendAPI-->>Frontend: { checkoutUrl: 'https://...' }
    Frontend->>User: Redirects to PayMongo hosted checkout page
    User->>PayMongo: Enters test card credentials
    PayMongo->>BackendAPI: Webhook: checkout_session.payment.paid
    BackendAPI->>SupabaseDB: Update order status to 'paid', clear cart_items
    PayMongo-->>Frontend: Redirects user back to /order-success
```

---

## 2. Supabase Implementation Blueprint

### 2.1 Client Initialization
Create `src/lib/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 2.2 Google OAuth Trigger in [Login.jsx](file:///c:/Users/windows11/Documents/GitHub/zion-shop/src/pages/Login.jsx) & [Signup.jsx](file:///c:/Users/windows11/Documents/GitHub/zion-shop/src/pages/Signup.jsx)
```javascript
import { supabase } from '../lib/supabase'

export const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/products`
    }
  })
  if (error) console.error('OAuth error:', error.message)
}
```

### 2.3 Row Level Security (RLS) Rules
To ensure users can only access their own data:
```sql
-- Enable RLS
alter table profiles enable row level security;
alter table cart_items enable row level security;
alter table wishlist_items enable row level security;
alter table orders enable row level security;

-- Profiles: public read, owner write
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Cart items: owner only
create policy "Users can view own cart" on cart_items for select using (auth.uid() = user_id);
create policy "Users can insert own cart" on cart_items for insert with check (auth.uid() = user_id);
create policy "Users can update own cart" on cart_items for update using (auth.uid() = user_id);
create policy "Users can delete own cart" on cart_items for delete using (auth.uid() = user_id);

-- Wishlist: owner only
create policy "Users can view own wishlist" on wishlist_items for select using (auth.uid() = user_id);
create policy "Users can manage own wishlist" on wishlist_items for all using (auth.uid() = user_id);

-- Orders: owner read, backend insert/update
create policy "Users can view own orders" on orders for select using (auth.uid() = user_id);
```

---

## 3. PayMongo Test Checkout Integration

PayMongo requires a server-side environment because the secret key must never be exposed to the client bundle.

### 3.1 Server Function Strategy
The backend dependencies already present in [package.json](file:///c:/Users/windows11/Documents/GitHub/zion-shop/package.json) (`express`, `cors`, `body-parser`) can be run as a lightweight microservice or implemented via Supabase Edge Functions:

```javascript
// Example server route: POST /api/checkout
import express from 'express'
import axios from 'axios'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY // sk_test_...

app.post('/api/create-checkout', async (req, res) => {
  try {
    const { items, successUrl, cancelUrl } = req.body

    const lineItems = items.map(item => ({
      name: item.name,
      amount: Math.round(parseFloat(item.price.replace('$', '')) * 100), // amount in cents
      currency: 'PHP', // or USD
      quantity: item.quantity,
      images: [item.image]
    }))

    const response = await axios.post(
      'https://api.paymongo.com/v1/checkout_sessions',
      {
        data: {
          attributes: {
            line_items: lineItems,
            payment_method_types: ['card', 'gcash', 'paymaya'],
            success_url: successUrl,
            cancel_url: cancelUrl
          }
        }
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const checkoutUrl = response.data.data.attributes.checkout_url
    res.json({ checkoutUrl })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

---

## 4. Execution Milestones

| Phase | Tasks | Key Deliverables |
|---|---|---|
| **Phase 1: Database Migration** | Create Supabase project, execute SQL schema, populate `products` table | `src/lib/supabase.js`, Supabase product fetch in [Products.jsx](file:///c:/Users/windows11/Documents/GitHub/zion-shop/src/pages/Products.jsx) |
| **Phase 2: Auth Synchronization** | Connect Login/Signup forms, enable Google OAuth | Persistent user sessions, profile drawer |
| **Phase 3: Persistent Cart/Wishlist** | Sync `AppContext` with `cart_items` and `wishlist_items` tables | Cross-device cart continuity |
| **Phase 4: PayMongo Sandbox** | Implement backend checkout endpoint, webhook listener | Simulated end-to-end purchasing |
