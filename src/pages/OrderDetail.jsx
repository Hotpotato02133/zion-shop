import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Ban, CheckCircle2, Clock, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { useSupabase } from '../context/SupabaseContext'
import OrderActions from '../components/orders/OrderActions'
import StatusBadge from '../components/orders/StatusBadge'
import CheckoutSteps from '../components/CheckoutSteps'
import {
  PAYMENT_LABELS,
  RETURN_LABELS,
  STATUS_META,
  formatDate,
  formatDateTime,
  formatOrderEventNote,
  getOrderStatusHint,
  isCancelledByCustomer,
  isCodOrder,
  isCodOrderApproved,
  money,
  sortOrderEvents
} from '../lib/orders'
import { subscribeOrderSync } from '../lib/orderSync'
import { fetchOrderRefundRequests } from '../services/refundTriageService'

const OrderDetail = () => {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const { supabase, isConfigured } = useSupabase()
  const [order, setOrder] = useState(null)
  const [refundTriage, setRefundTriage] = useState(null)
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
      data.order_events = sortOrderEvents(data.order_events || [])
      setOrder(data)
      fetchOrderRefundRequests(orderId, supabase).then(rows => {
        if (rows && rows.length > 0) setRefundTriage(rows[0])
      })
    }
    setLoading(false)
    return data
  }, [supabase, isConfigured, orderId])

  useEffect(() => { load() }, [load])

  // Real-time synchronization for order updates & admin actions (BroadcastChannel + polling + Supabase Realtime)
  useEffect(() => {
    if (!isConfigured || !orderId) return
    const channel = supabase
      .channel(`order-${orderId}-realtime`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, () => {
        load()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_events', filter: `order_id=eq.${orderId}` }, () => {
        load()
      })
      .subscribe()

    const unsubscribeSync = subscribeOrderSync((payload) => {
      if (!payload?.orderId || payload.orderId === orderId) {
        load()
      }
    })

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    window.addEventListener('focus', onFocusOrVisible)
    document.addEventListener('visibilitychange', onFocusOrVisible)

    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, 4000)

    return () => {
      supabase.removeChannel(channel)
      unsubscribeSync()
      window.removeEventListener('focus', onFocusOrVisible)
      document.removeEventListener('visibilitychange', onFocusOrVisible)
      clearInterval(pollInterval)
    }
  }, [supabase, isConfigured, orderId, load])

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
  const isCod = isCodOrder(order)
  const codApproved = isCodOrderApproved(order)
  const cancelledByCustomer = isCancelledByCustomer(order)

  const codSteps = [
    { key: 'placed', label: 'Order Placed', done: true },
    {
      key: 'approval',
      label: isCod ? 'Store COD Approval' : 'Payment Confirmed',
      done: isCod ? (codApproved || order.status === 'to_receive' || order.status === 'completed') : order.payment_status === 'paid',
      active: order.status === 'to_ship' && isCod && !codApproved
    },
    {
      key: 'delivery',
      label: 'On Delivery',
      done: order.status === 'to_receive' || order.status === 'completed',
      active: order.status === 'to_receive' || (order.status === 'to_ship' && (!isCod || codApproved))
    },
    {
      key: 'completed',
      label: 'Delivered',
      done: order.status === 'completed',
      active: false
    }
  ]

  const getCodPaymentSubtitle = () => {
    if (order.status === 'cancelled') return 'Voided · Order cancelled'
    if (order.payment_status === 'paid' || order.status === 'completed') return 'Paid upon delivery'
    if (order.status === 'to_receive') return `Pay ${money(order.total)} cash upon delivery`
    if (codApproved) return 'Approved by store · Pay upon delivery'
    return 'Awaiting store approval · Pay upon delivery'
  }

  return (
    <div className="min-h-screen w-full pt-10 pb-20 bg-white text-neutral-950 font-body overflow-x-clip">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 space-y-8">
        <Link to="/orders" className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-black">
          <ArrowLeft size={14} /> All orders
        </Link>

        {justPlaced && order.status !== 'cancelled' && (
          <div className="space-y-5">
            <CheckoutSteps current={3} />
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex gap-3 text-emerald-900">
              <CheckCircle2 className="shrink-0" />
              <div>
                <p className="font-semibold text-base">Thank you — your order is in.</p>
                <p className="text-xs mt-0.5">
                  {order.status === 'to_pay'
                    ? 'Complete the payment below to start processing your order.'
                    : isCod && !codApproved
                      ? `Your Cash on Delivery order is awaiting store approval before shipping. We will also email updates to ${order.customer_email}.`
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
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight font-mono">{order.order_number}</h1>
            <p className="text-xs text-neutral-400 mt-1">Placed {formatDateTime(order.created_at)}</p>
          </div>
          <div className="text-right space-y-1">
            <StatusBadge status={order.status} order={order} />
            <p className="text-xs text-neutral-500">{getOrderStatusHint(order)}</p>
          </div>
        </header>

        <OrderActions order={order} onUpdated={(updated) => updated && load()} />

        {/* Order Fulfillment & COD Approval Status Banner */}
        {order.status === 'cancelled' ? (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3.5 text-rose-950">
            <Ban size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="text-sm font-semibold text-rose-900">
                {cancelledByCustomer ? 'You cancelled this order' : 'This order was cancelled'}
              </p>
              {order.cancel_reason && (
                <p className="text-rose-800">
                  Reason: <span className="font-medium">{order.cancel_reason}</span>
                </p>
              )}
              <p className="text-rose-700/80">
                The store admin has been notified and any reserved items have been returned to stock.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/70 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {codSteps.map((step, idx) => (
                <div
                  key={step.key}
                  className={`p-2.5 rounded-xl border text-xs transition-colors ${
                    step.done
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : step.active
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-white text-neutral-400 border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider opacity-75">Step {idx + 1}</span>
                    {step.done ? (
                      <CheckCircle2 size={13} className="shrink-0" />
                    ) : step.active ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    ) : null}
                  </div>
                  <p className="font-semibold leading-snug">{step.label}</p>
                </div>
              ))}
            </div>

            {order.status === 'to_ship' && isCod && !codApproved && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-950 text-xs">
                <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Waiting for Admin Approval (Cash on Delivery)</p>
                  <p className="text-amber-800 leading-relaxed">
                    Your order is in the store verification queue. Once the admin approves your Cash on Delivery request, your package will be cleared to ship and move to <strong>On Delivery</strong>. This page updates automatically.
                  </p>
                </div>
              </div>
            )}

            {order.status === 'to_ship' && (!isCod || codApproved) && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-emerald-950 text-xs">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">
                    {isCod ? 'COD Approved by Store — Preparing for Dispatch' : 'Order Confirmed — Preparing for Dispatch'}
                  </p>
                  <p className="text-emerald-800 leading-relaxed">
                    Your order has been approved for shipping and is being packed for courier handoff.
                  </p>
                </div>
              </div>
            )}

            {order.status === 'to_receive' && (
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-start gap-3 text-indigo-950 text-xs">
                <Truck size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Your Order is On Delivery</p>
                  <p className="text-indigo-800 leading-relaxed">
                    {order.courier ? `Dispatched via ${order.courier}` : 'Your package is on its way to your delivery address'}
                    {order.tracking_number ? ` (Tracking: ${order.tracking_number})` : ''}.
                    {isCod ? ` Please prepare ${money(order.total)} in cash for the courier.` : ''} Once it arrives, click <strong>Order received</strong> above.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {(order.courier || order.tracking_number) && order.status !== 'to_receive' ? (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 text-sm text-indigo-900">
            <Truck size={18} />
            <span>
              Shipped via <strong>{order.courier || 'courier'}</strong>
              {order.tracking_number && <> · Tracking <span className="font-mono">{order.tracking_number}</span></>}
            </span>
          </div>
        ) : null}

        {order.return_status && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-sm text-rose-900 space-y-2">
            <div>
              <strong>{RETURN_LABELS[order.return_status]}</strong>
              {order.return_reason && <span className="block text-xs mt-1">Reason: {order.return_reason}</span>}
            </div>

            {refundTriage && (
              <div className="p-3.5 rounded-xl bg-white border border-rose-200/70 text-neutral-900 flex items-start gap-3">
                {refundTriage.evidence_image_url && (
                  <img
                    src={refundTriage.evidence_image_url}
                    alt="Return evidence"
                    className="w-14 h-14 rounded-lg object-cover border border-neutral-200 shrink-0"
                  />
                )}
                <div className="space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold uppercase tracking-wider text-[10px] inline-flex items-center gap-1 text-black">
                      <Sparkles size={12} /> AI Return Triage
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        refundTriage.status === 'auto_approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {refundTriage.status === 'auto_approved'
                        ? 'AI Verified · Expedited'
                        : 'Routed to Concierge Review'}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      Confidence: {Math.round(Number(refundTriage.ai_confidence_score || 0) * 100)}%
                    </span>
                  </div>
                  {refundTriage.ai_assessment_notes && (
                    <p className="text-neutral-600 leading-relaxed">
                      {refundTriage.ai_assessment_notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <section className="md:col-span-3 space-y-6">
            <h2 className="font-heading text-lg font-semibold tracking-tight">Items</h2>
            <ul className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl px-4">
              {order.order_items.map(item => (
                <li key={item.id} className="flex gap-3 items-center py-3">
                  {item.image_url && <img src={item.image_url} alt="" className="w-14 h-16 rounded-lg object-cover bg-neutral-100" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-neutral-400">{money(item.price)} × {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">{money(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd className="tabular-nums font-medium">{money(order.subtotal)}</dd></div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-700"><dt>Discount {order.promo_code && `(${order.promo_code})`}</dt><dd className="tabular-nums font-medium">-{money(order.discount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-neutral-500">Tax</dt><dd className="tabular-nums font-medium">{money(order.tax)}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Shipping</dt><dd className="tabular-nums font-medium">{Number(order.shipping_fee) === 0 ? 'Free' : money(order.shipping_fee)}</dd></div>
              <div className="flex justify-between border-t border-neutral-100 pt-3 font-heading text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
            </dl>
          </section>

          <section className="md:col-span-2 space-y-6">
            <div>
              <h2 className="font-heading text-lg font-semibold mb-2">Delivery</h2>
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
              <h2 className="font-heading text-lg font-semibold mb-2">Payment</h2>
              <p className="text-sm text-neutral-600">
                {order.payment_method === 'cod' ? 'Cash on delivery' : 'PayMongo (card / e-wallet)'}
                <br />
                <span className="font-medium text-neutral-900">
                  {order.payment_method === 'cod'
                    ? getCodPaymentSubtitle()
                    : PAYMENT_LABELS[order.payment_status]}
                </span>
                {order.paid_at && <> · {formatDate(order.paid_at)}</>}
              </p>
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold mb-3">Timeline</h2>
              <ol className="space-y-4 border-l border-neutral-200 ml-1.5">
                {order.order_events.map(event => (
                  <li key={event.id} className="pl-5 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-neutral-950" />
                    <p className="text-sm font-medium">{formatOrderEventNote(event, order) || STATUS_META[event.status]?.label}</p>
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
