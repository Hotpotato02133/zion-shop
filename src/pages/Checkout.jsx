import React, { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { ArrowLeft, Banknote, CreditCard, Loader2, Lock, ShieldCheck, Tag } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useSupabase } from '../context/SupabaseContext'
import CheckoutSteps from '../components/CheckoutSteps'
import { computeTotals, readCheckoutExtras, clearCheckoutExtras } from '../lib/pricing'
import { startPayment } from '../lib/payments'
import { friendlyError, money } from '../lib/orders'

const inputClass =
  'w-full p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-black'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const PAYMENT_OPTIONS = [
  {
    key: 'paymongo',
    title: 'Card, GCash, Maya or GrabPay',
    description: 'Pay securely on the PayMongo checkout page. We never see your card details.',
    icon: CreditCard
  },
  {
    key: 'cod',
    title: 'Cash on delivery',
    description: 'Pay the courier when your order arrives.',
    icon: Banknote
  }
]

const Field = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{label}</span>
    {children}
  </label>
)

const Checkout = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const { supabase, isConfigured } = useSupabase()
  const { cart, isSyncing, resetLocalCart } = useApp()

  const extras = useMemo(() => readCheckoutExtras(), [])
  const totals = computeTotals(cart, extras.promo)

  const storageKey = user ? `zion_delivery_${user.id}` : null
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Philippines'
  })
  const [paymentMethod, setPaymentMethod] = useState('paymongo')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  // Prefill from the last order on this device, then from the Clerk profile
  useEffect(() => {
    if (!user) return
    let saved = {}
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
    } catch {
      // ignore corrupt cache
    }
    setForm(prev => ({
      ...prev,
      full_name: saved.full_name || user.fullName || '',
      email: saved.email || user.primaryEmailAddress?.emailAddress || '',
      ...saved
    }))
  }, [user, storageKey])

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  // `placing` stays true once the order exists, so emptying the bag does not bounce us back to /cart
  if (!isSyncing && !placing && cart.length === 0) return <Navigate to="/cart" replace />

  const hasUnorderableItems = cart.some(item => !UUID_RE.test(String(item.productId ?? item.id)))

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (placing) return
    setError('')

    if (!isConfigured) {
      setError('The store database is not connected yet, so orders cannot be placed.')
      return
    }
    if (hasUnorderableItems) {
      setError('Some items in your bag are no longer available. Please remove them and try again.')
      return
    }

    setPlacing(true)
    const { data: order, error: rpcError } = await supabase.rpc('place_order', {
      p_shipping: form,
      p_payment_method: paymentMethod,
      p_promo: extras.promo?.code ?? null,
      p_gift_note: extras.giftNote || null
    })

    if (rpcError) {
      setError(friendlyError(rpcError))
      setPlacing(false)
      return
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(form))
    } catch {
      // not critical
    }
    clearCheckoutExtras()
    resetLocalCart()

    if (paymentMethod === 'cod') {
      navigate(`/orders/${order.id}?placed=1`, { replace: true })
      return
    }

    try {
      await startPayment(supabase, order) // leaves the site on success
    } catch (payError) {
      // The order exists as "To Pay"; the customer can retry from the order page.
      navigate(`/orders/${order.id}?placed=1&payError=${encodeURIComponent(payError.message)}`, { replace: true })
    }
  }

  return (
    <div className="min-h-screen w-full pt-10 pb-20 bg-white text-neutral-950 font-body overflow-x-clip">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <Link to="/cart" className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-black mb-6">
          <ArrowLeft size={14} /> Back to bag
        </Link>

        <div className="mb-8 border-b border-neutral-100 pb-6 space-y-5">
          <CheckoutSteps current={2} />
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight">Checkout</h1>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Delivery */}
            <section className="space-y-4">
              <h2 className="font-heading text-xl font-bold">1. Delivery details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full name">
                  <input required autoComplete="name" className={inputClass} value={form.full_name} onChange={update('full_name')} />
                </Field>
                <Field label="Mobile number">
                  <input required type="tel" autoComplete="tel" placeholder="09XX XXX XXXX" className={inputClass} value={form.phone} onChange={update('phone')} />
                </Field>
              </div>
              <Field label="Email (order updates are sent here)">
                <input required type="email" autoComplete="email" className={inputClass} value={form.email} onChange={update('email')} />
              </Field>
              <Field label="Street address, building, unit">
                <input required autoComplete="street-address" className={inputClass} value={form.address} onChange={update('address')} />
              </Field>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="City">
                  <input required autoComplete="address-level2" className={inputClass} value={form.city} onChange={update('city')} />
                </Field>
                <Field label="Province">
                  <input autoComplete="address-level1" className={inputClass} value={form.province} onChange={update('province')} />
                </Field>
                <Field label="Postal code">
                  <input required autoComplete="postal-code" className={inputClass} value={form.postal_code} onChange={update('postal_code')} />
                </Field>
                <Field label="Country">
                  <input required autoComplete="country-name" className={inputClass} value={form.country} onChange={update('country')} />
                </Field>
              </div>
            </section>

            {/* 2. Payment */}
            <section className="space-y-4">
              <h2 className="font-heading text-xl font-bold">2. Payment method</h2>
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map(({ key, title, description, icon }) => (
                  <label
                    key={key}
                    className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-colors ${
                      paymentMethod === key ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === key}
                      onChange={() => setPaymentMethod(key)}
                      className="mt-1 text-black focus:ring-black"
                    />
                    {React.createElement(icon, { size: 20, className: 'mt-0.5 shrink-0' })}
                    <span>
                      <span className="block text-sm font-bold">{title}</span>
                      <span className="block text-xs text-neutral-500 mt-0.5">{description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside className="lg:col-span-5">
            <div className="p-7 rounded-[28px] border border-neutral-100 bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] space-y-5 lg:sticky lg:top-28">
              <h2 className="font-heading text-xl font-bold">Order summary</h2>

              <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.map(item => (
                  <li key={item.productId ?? item.id} className="flex gap-3 items-center">
                    <img src={item.image} alt="" className="w-12 h-14 rounded-lg object-cover bg-neutral-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-neutral-400">Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">{money(Number(item.price) * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2.5 text-sm border-t border-neutral-100 pt-4">
                <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{money(totals.subtotal)}</span></div>
                {extras.promo && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span className="flex items-center gap-1.5"><Tag size={14} />{extras.promo.code}</span>
                    <span>-{money(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between"><span className="text-neutral-500">Tax (8%)</span><span>{money(totals.tax)}</span></div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Shipping</span>
                  <span>{totals.shipping === 0 ? 'Free' : money(totals.shipping)}</span>
                </div>
                <div className="flex justify-between items-baseline border-t border-neutral-100 pt-3">
                  <span className="font-heading text-lg font-bold">Total</span>
                  <span className="font-heading text-2xl font-extrabold">{money(totals.total)}</span>
                </div>
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={placing || isSyncing}
                className="w-full bg-neutral-950 text-white py-4 rounded-2xl text-xs font-semibold tracking-wider uppercase hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {placing ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                <span>{placing ? 'Placing order…' : paymentMethod === 'cod' ? 'Place order' : 'Place order & pay'}</span>
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
                <ShieldCheck size={13} /> Prices are confirmed on our server when you place the order.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  )
}

export default Checkout
