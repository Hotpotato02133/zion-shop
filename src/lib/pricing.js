// Display-only pricing. The authoritative totals are recomputed in the place_order() RPC.
// Keep the rules below in sync with supabase/migrations/002_orders_admin.sql.

export const TAX_RATE = 0.08
export const FREE_SHIPPING_OVER = 150
export const SHIPPING_FEE = 25

export const PROMOS = {
  ZION10: { code: 'ZION10', type: 'percent', value: 0.1, label: '10% Private Atelier Privilege' },
  ATELIER: { code: 'ATELIER', type: 'fixed', value: 50, label: '$50 Off Welcome Benefit' }
}

export const toPrice = (value) =>
  typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0

export const computeTotals = (cart, promo) => {
  const subtotal = cart.reduce((sum, item) => sum + toPrice(item.price) * item.quantity, 0)
  let discount = 0
  if (promo) {
    discount = promo.type === 'percent' ? subtotal * promo.value : Math.min(subtotal, promo.value)
  }
  discount = Math.round(discount * 100) / 100
  const tax = Math.round((subtotal - discount) * TAX_RATE * 100) / 100
  const shipping = subtotal > FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE
  return { subtotal, discount, tax, shipping, total: subtotal - discount + tax + shipping }
}

// Promo code + gift note travel from the bag to /checkout, even across the login step.
const EXTRAS_KEY = 'zion_checkout_extras'

export const saveCheckoutExtras = (extras) => {
  try {
    sessionStorage.setItem(EXTRAS_KEY, JSON.stringify(extras))
  } catch {
    // ignore
  }
}

export const readCheckoutExtras = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(EXTRAS_KEY) || '{}')
    return { promo: PROMOS[raw.promo] || null, giftNote: raw.giftNote || '' }
  } catch {
    return { promo: null, giftNote: '' }
  }
}

export const clearCheckoutExtras = () => {
  try {
    sessionStorage.removeItem(EXTRAS_KEY)
  } catch {
    // ignore
  }
}
