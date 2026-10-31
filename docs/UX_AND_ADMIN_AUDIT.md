# UX & Admin Audit (round 2)

## Fixed in this round
| Issue | Fix |
|-------|-----|
| Admin never saw new orders (Orders page loaded once) | Admin area now polls every 20s and on tab focus, has a Refresh button, shows unread **notifications** (new order, return request, low stock) via a bell, tab-title count `(2)`, and toasts |
| No stock alerts | Per-product **alert level** (`low_stock_threshold`, default 5). A DB trigger raises one notification each time stock *crosses* the level (and when it hits 0). Surfaced as: amber banner on every admin page, badge on the Products tab, "Needs restocking" card on the dashboard, **Low stock** filter, and one-click **+ Restock** |
| Free-shipping promise said `$300` in the top bar, the code charged `$25` under `$150` | Bar now says `$150`; Bag shows a **progress bar** to free shipping |
| "30-Day Returns" advertised in 4 places, enforced 7 days | Return window is now 30 days everywhere (SQL in `003`) |
| Luxury jargon hiding costs ("Global Insured Freight", "import duties included", "dispatch from Milan") | Plain labels: Subtotal / Tax / Shipping; removed false claims |

## UX audit — prioritised

### P0 (blocks sales or causes wrong orders)
1. **No size/variant selection is saved.** Apparel orders cannot be fulfilled correctly. Add `product_variants` (size, stock) or at minimum a `size` on `cart_items` and `order_items`; stock then lives per size.
2. **Catalog contains legacy non-apparel products** (headphones, knife, speaker…) next to the apparel seed. Hide/delete them in `/admin/products`.
3. **Currency mismatch.** Prices show `$`, but PayMongo charges PHP (converted at `USD_TO_PHP`). Shoppers see one number on the site and another on the payment page. Price the catalog in PHP (`₱`) and set the rate to 1.

### P1 (conversion and trust)
4. **Stock is not enforced in the bag.** Quantity can exceed stock; the error only appears at checkout. Cap the stepper at stock and show "Only 3 left".
5. **No order emails.** Send confirmation / shipped / delivered emails (Supabase Edge Function + Resend, triggered from `order_events`).
6. **Address entry is long and generic.** Add a saved-address book and Philippine fields (barangay, province dropdown).
7. **Bag prices can go stale.** Refresh bag line prices from `products` when `/cart` opens.
8. **Promo codes are hard-coded** in the UI and SQL; move to a `promo_codes` table managed by admin.
9. **Post-payment feedback.** After PayMongo returns, show the order page with a clear "Payment received" state (polling is in place; add a success animation and email).

### P2 (polish and accessibility)
10. Mobile bag: add a **sticky bottom "Checkout" bar**; product quick-view needs a visible size picker once variants exist.
11. Icon-only buttons rely on `title` only (bag trash, steppers): add `aria-label`s. Many captions are 10px `neutral-400` (contrast < 4.5:1); raise to `neutral-500` / 11–12px.
12. Skeleton loaders on Products/Orders instead of spinners; remember scroll position when returning from a product.
13. Reviews are static numbers. Add verified-buyer reviews after `completed` orders.
14. Order page: link the courier's tracking page from `courier` + `tracking_number`.

## Admin audit

### Now available
Dashboard (revenue, counts, recent orders, status breakdown, restock card) · Products CRUD with image upload, hide/show, alert level, **quick restock** · Orders with status filters, search, auto-refresh, timeline, ship/deliver/cancel, return approve/decline/refund, **CSV export**, **packing slip** · Customers list · Notifications.

### Recommended next (highest value first)
1. **Variants + per-size inventory** (see P0-1).
2. **Refund from the admin** by calling PayMongo's Refunds API from an Edge Function (today you refund in the PayMongo dashboard and record it).
3. **Promo-code manager** (code, type, value, min spend, expiry, usage limit).
4. **Inventory history**: log every stock change (sale, restock, cancel, manual) with who/when.
5. **Sales analytics**: revenue by day, top products, conversion (bag → order), average order value.
6. **Bulk actions**: select many orders → mark shipped with a CSV of tracking numbers; CSV product import.
7. **Internal order notes** and customer detail page (all orders, lifetime spend).
8. **Staff roles**: `owner` vs `staff` (staff cannot delete products or refund).
9. **Alert channels**: e-mail / Telegram / SMS on `admin_notifications` insert via a Supabase Database Webhook → Edge Function, so you are told even when the dashboard is closed.
10. **Settings page**: shipping fee/free-shipping threshold, tax rate, store contact, demo-payments switch (these are hard-coded in SQL today).

## Stock-alert design (as built)
`products.low_stock_threshold` → trigger `notify_low_stock` fires only when stock crosses the level (no spam on every sale) → row in `admin_notifications` → admin UI polls and shows bell, banner, badge, toast, tab title → admin restocks (`+ Restock`) → the alert clears when marked read, and fires again the next time stock falls below the level.
