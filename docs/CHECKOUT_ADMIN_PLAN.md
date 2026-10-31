# Checkout, Orders & Admin — Audit and Plan

## 1. Audit of the current implementation

### Guest flow (not signed in)
| Step | What happens today | Problem |
|------|--------------------|---------|
| Browse / add to cart | Cart lives in `localStorage` | OK, but fallback catalog uses numeric ids (`1`, `2`…) while the DB uses UUIDs |
| Cart → "Proceed to Checkout" | Opens a modal for anyone | **No login gate** — no conversion point, no account for the order |
| Checkout form | Pre-filled with fake data (`Alexander Vance`, Milan, card `4242…`) | Looks real but is demo data; user data is never validated |
| Pay | `setTimeout(2000)` then a fake `pay_sbox_…` reference | **No payment happens.** PayMongo is never called |
| After pay | Local state success screen, `clearCart()` | **No order is saved** — nothing in Supabase, nothing to track |
| Login/Signup pages | Always redirect to `/products` | No "return to where you were" (`redirect` param) |

### Signed-in flow
| Step | What happens today | Problem |
|------|--------------------|---------|
| Sign in (Clerk) | Profile upserted into `profiles` | OK |
| Guest cart → account | Cloud cart *replaces* local cart; guest items never uploaded | **Guest cart is lost on login** (kills conversion) |
| `addToCart` | `upsert({quantity: 1})` | Resets quantity to 1 on every add |
| Cloud cart rows | Spread `products.*` (`image_url`) but UI reads `image` | **Broken cart thumbnails** after sync |
| Fallback-catalog items | `product_id: 1` sent to a `uuid` column | Silent sync failure |
| Orders | `orders` table exists, nothing writes/reads it | No order history, no statuses |
| Totals | Computed in the browser (8% tax, $25 shipping) | Client-trusted; must be recomputed server-side |
| Promo codes | Hard-coded in the component | Not enforceable |

### Payments
PayMongo is referenced only in copy ("PayMongo Sandbox"). There is no backend, no secret key handling, no webhook, so **payment is not working** — it is a UI simulation.

### Admin
Does not exist. Products can only be changed with SQL. `supabase_schema.sql` also **deletes the whole catalog and carts** every time it is run.

## 2. Payment gateway recommendation

**PayMongo Checkout Sessions (hosted checkout page)** — keep PayMongo, because:
- Easiest: the server creates a session and returns a `checkout_url`; the customer pays on PayMongo's hosted page. No card data ever touches our app (PCI scope stays minimal).
- One integration covers cards, **GCash, Maya, GrabPay** and online banking — the methods Filipino shoppers expect.
- Free sandbox with test keys (`sk_test_…`), webhooks for `checkout_session.payment.paid`.
- Runs as a **Supabase Edge Function** (secret key stays server-side, no separate Express host needed).

Also offered: **Cash on Delivery** (common in PH, zero integration risk). Stripe is the alternative if selling outside PH, but it does not support GCash/Maya.

PayMongo only charges PHP; the catalog is in USD, so the Edge Function converts using `USD_TO_PHP` (env, default 56). Switch catalog prices to PHP later and set it to `1`.

## 3. Target flow

```
Guest:  browse → add to bag (local) → Bag → "Sign in to checkout"
        → /login?redirect=/checkout → guest bag merged into account
Member: Bag → /checkout (address → payment method → review)
        → place_order() RPC  (server recomputes totals, snapshots items, reserves stock, clears bag)
        → PayMongo hosted page → webhook marks paid → "To Ship"
        → /orders/:id (timeline, pay-now, cancel, confirm received, return)
```

### Order statuses (customer tabs)
| Tab | `orders.status` | Entered when |
|-----|-----------------|--------------|
| To Pay | `to_pay` | Order placed, awaiting online payment |
| To Ship | `to_ship` | Paid (webhook) or COD placed |
| To Receive | `to_receive` | Admin marks shipped (courier + tracking) |
| Completed | `completed` | Customer confirms receipt / admin marks delivered |
| Return/Refund | `return_refund` | Customer requests return on a completed order; admin approves/rejects/refunds (`return_status`) |
| Cancelled | `cancelled` | Customer cancels while `to_pay`/`to_ship`, or admin cancels; stock is restored |

Every transition writes an `order_events` row (timeline shown to customer).

## 4. Data model changes (`supabase/migrations/002_orders_admin.sql`)
- `admins(user_id)` + `is_admin()` — admin = Clerk user id in this table (no Clerk dashboard claim customisation needed).
- `products`: `is_active`, `updated_at`; admin-only insert/update/delete via RLS; public sees active only.
- `orders`: status workflow, `payment_status`, totals breakdown, courier/tracking, return fields, timestamps, `order_number`.
- `order_items` (price/name/image snapshot), `order_events` (timeline).
- RPCs (`security definer`, identity from the Clerk JWT, never from the client): `place_order`, `cancel_order`, `confirm_received`, `request_return`, `admin_set_order_status`, `admin_resolve_return`, `mark_order_paid` (service-role only, used by webhook), `demo_mark_paid` (only while `app_settings.demo_payments = true`).
- Storage bucket `product-images` (public read, admin write).

## 5. Admin features (`/admin`, admins only)
- **Dashboard** — revenue, orders by status, low-stock list, recent orders.
- **Products** — create / edit / delete (soft-hide via `is_active`), image upload or URL, price, compare-at price, stock, category, tag, specs.
- **Orders** — filter by status, view details, mark shipped (courier + tracking), mark delivered, cancel, approve/reject returns, mark refunded.
- **Customers** — list of profiles with order counts.

## 6. Implementation steps
1. SQL migration (above).
2. Cart fixes: merge guest cart on login, quantity-safe upsert, image mapping, UUID guard.
3. Auth gate: `RequireAuth`, `redirect` param honoured in Login/Signup, Cart CTA changes by auth state.
4. `/checkout` page replacing the fake modal; real `place_order`.
5. Edge Functions: `create-checkout` (PayMongo session), `paymongo-webhook`.
6. `/orders` and `/orders/:id`.
7. `/admin` area.
8. Navbar links (My Orders, Admin), docs, `.env.example`.

## 7. Setup checklist (manual steps only you can do)
1. Run `supabase/migrations/002_orders_admin.sql` in the Supabase SQL editor.
2. Clerk dashboard → enable the Supabase integration; Supabase → Auth → Third-party → add Clerk.
3. Make yourself admin: `insert into admins (user_id, email) values ('user_xxx', 'you@mail.com');`
4. Deploy functions and set secrets (see `supabase/functions/README.md`).
5. In PayMongo dashboard add the webhook URL for `checkout_session.payment.paid`.
6. Before going live: `update app_settings set value='false' where key='demo_payments';`
