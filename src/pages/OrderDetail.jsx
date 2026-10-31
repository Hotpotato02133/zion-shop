import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Truck } from 'lucide-react'
import { useSupabase } from '../context/SupabaseContext'
import OrderActions from '../components/orders/OrderActions'
import StatusBadge from '../components/orders/StatusBadge'
import CheckoutSteps from '../components/CheckoutSteps'
import {
  PAYMENT_LABELS, RETURN_LABELS, STATUS_META, formatDate, formatDateTime, money
} from '../lib/orders'

const OrderDetail = () => {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const { supabase, isConfigured } = useSupabase()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const justPlaced = searchParams.get('placed') === '1'
  const returnedFromPayment = searchParams.get('payment')
  const payError = searchParams.get('payError')

  const load = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false)
      return null
    }
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items (*), order_events (*)')
      .eq('id', orderId)
      .maybeSingle()
    if (fetchError) setError(fetchError.message)
    else if (!data) setError('Order not found.')
    else {
      data.order_events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setOrder(data)
    }
    setLoading(false)
    return data
  }, [supabase, isConfigured, orderId])

  useEffect(() => { load() }, [load])

  // PayMongo's webhook can land a few seconds after the redirect back: poll briefly.
  useEffect(() => {
    if (returnedFromPayment !== 'success' || order?.status !== 'to_pay') return
    let attempts = 0
    const timer = setInterval(async () => {
      attempts += 1
      const fresh = await load()
      if (fresh?.status !== 'to_pay' || attempts >= 10) clearInterval(timer)
    }, 3000)
    return () => clearInterval(timer)
  }, [returnedFromPayment, order?.status, load])

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-neutral-100 border-t-black animate-spin" /></div>
  }
  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-sm text-neutral-600">{error || 'Order not found.'}</p>
        <Link to="/orders" className="text-xs font-semibold underline">Back to my orders</Link>
      </div>
    )
  }

  const address = order.shipping_address || {}
  const paymentConfirming = returnedFromPayment === 'success' && order.status === 'to_pay'

  return (
    <div className="min-h-screen w-full pt-10 pb-20 bg-white text-neutral-950 font-body overflow-x-clip">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 space-y-8">
        <Link to="/orders" className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-black">
          <ArrowLeft size={14} /> All orders
        </Link>

        {justPlaced && (
          <div className="space-y-5">
            <CheckoutSteps current={3} />
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex gap-3 text-emerald-900">
              <CheckCircle2 className="shrink-0" />
              <div>
                <p className="font-bold">Thank you — your order is in.</p>
                <p className="text-xs mt-0.5">
                  {order.status === 'to_pay'
                    ? 'Complete the payment below to start processing your order.'
                    : 'We will email updates to ' + order.customer_email + '.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {payError && (
          <p role="alert" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            We could not open the payment page ({payError}). Your order is saved — use "Pay now" to try again.
          </p>
        )}
        {returnedFromPayment === 'cancelled' && order.status === 'to_pay' && (
          <p className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            Payment was not completed. You can pay now or cancel this order.
          </p>
        )}
        {paymentConfirming && (
          <p className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
            Confirming your payment… this page will update automatically.
          </p>
        )}

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-neutral-400 block mb-1">Order</span>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight font-mono">{order.order_number}</h1>
            <p className="text-xs text-neutral-400 mt-1">Placed {formatDateTime(order.created_at)}</p>
          </div>
          <div className="text-right space-y-1">
            <StatusBadge status={order.status} />
            <p className="text-xs text-neutral-500">{STATUS_META[order.status]?.hint}</p>
          </div>
        </header>

        <OrderActions order={order} onUpdated={(updated) => updated && load()} />

        {order.courier || order.tracking_number ? (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 text-sm text-indigo-900">
            <Truck size={18} />
            <span>
              Shipped via <strong>{order.courier || 'courier'}</strong>
              {order.tracking_number && <> · Tracking <span className="font-mono">{order.tracking_number}</span></>}
            </span>
          </div>
        ) : null}

        {order.return_status && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-sm text-rose-900">
            <strong>{RETURN_LABELS[order.return_status]}</strong>
            {order.return_reason && <span className="block text-xs mt-1">Reason: {order.return_reason}</span>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <section className="md:col-span-3 space-y-6">
            <h2 className="font-heading text-lg font-bold">Items</h2>
            <ul className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl px-4">
              {order.order_items.map(item => (
                <li key={item.id} className="flex gap-3 items-center py-3">
                  {item.image_url && <img src={item.image_url} alt="" className="w-14 h-16 rounded-lg object-cover bg-neutral-100" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-neutral-400">{money(item.price)} × {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{money(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-700"><dt>Discount {order.promo_code && `(${order.promo_code})`}</dt><dd>-{money(order.discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-neutral-500">Tax</dt><dd>{money(order.tax)}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Shipping</dt><dd>{Number(order.shipping_fee) === 0 ? 'Free' : money(order.shipping_fee)}</dd></div>
              <div className="flex justify-between border-t border-neutral-100 pt-3 font-heading text-lg font-bold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
            </dl>
          </section>

          <section className="md:col-span-2 space-y-6">
            <div>
              <h2 className="font-heading text-lg font-bold mb-2">Delivery</h2>
              <p className="text-sm leading-relaxed text-neutral-600">
                {address.full_name}<br />
                {address.phone}<br />
                {address.address}<br />
                {[address.city, address.province, address.postal_code].filter(Boolean).join(', ')}<br />
                {address.country}
              </p>
              {order.gift_note && <p className="text-xs text-neutral-500 mt-2 italic">Gift note: “{order.gift_note}”</p>}
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold mb-2">Payment</h2>
              <p className="text-sm text-neutral-600">
                {order.payment_method === 'cod' ? 'Cash on delivery' : 'PayMongo (card / e-wallet)'}
                <br />
                <span className="font-semibold text-neutral-900">{PAYMENT_LABELS[order.payment_status]}</span>
                {order.paid_at && <> · {formatDate(order.paid_at)}</>}
              </p>
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold mb-3">Timeline</h2>
              <ol className="space-y-4 border-l border-neutral-200 ml-1.5">
                {order.order_events.map(event => (
                  <li key={event.id} className="pl-5 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-neutral-950" />
                    <p className="text-sm font-semibold">{event.note || STATUS_META[event.status]?.label}</p>
                    <p className="text-xs text-neutral-400">{formatDateTime(event.created_at)}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
