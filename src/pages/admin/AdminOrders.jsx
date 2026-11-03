import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Package,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  X
} from 'lucide-react'
import { useAdminAlerts } from './AdminAlerts'
import { downloadCsv, printPackingSlip } from '../../lib/adminExport'
import { useSupabase } from '../../context/SupabaseContext'
import StatusBadge from '../../components/orders/StatusBadge'
import {
  ORDER_TABS,
  PAYMENT_LABELS,
  RETURN_LABELS,
  formatDate,
  formatDateTime,
  friendlyError,
  isCodOrder,
  isCodOrderApproved,
  money
} from '../../lib/orders'

const btn =
  'px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-1.5'
const primary = `${btn} bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-black dark:hover:bg-neutral-200 shadow-xs`
const successBtn = `${btn} bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs`
const danger = `${btn} border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`

const POPULAR_COURIERS = ['LBC Express', 'J&T Express', 'Ninja Van', 'Flash Express', '2GO']

const OrderPanel = ({ orderId, onClose, onChanged }) => {
  const { supabase } = useSupabase()
  const [order, setOrder] = useState(null)
  const [courier, setCourier] = useState('')
  const [tracking, setTracking] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items (*), order_events (*)')
      .eq('id', orderId)
      .maybeSingle()
    if (fetchError) setError(fetchError.message)
    else if (data) {
      data.order_events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setOrder(data)
      setCourier(data.courier || '')
      setTracking(data.tracking_number || '')
    }
  }, [supabase, orderId])

  useEffect(() => {
    load()
  }, [load])

  const call = async (name, params) => {
    setBusy(true)
    setError('')
    const { error: rpcError } = await supabase.rpc(name, params)
    setBusy(false)
    if (rpcError) {
      setError(friendlyError(rpcError))
      return
    }
    setNote('')
    await load()
    onChanged()
  }

  const setStatus = (status) =>
    call('admin_set_order_status', {
      p_order_id: orderId,
      p_status: status,
      p_courier: courier || null,
      p_tracking: tracking || null,
      p_note: note || null
    })

  const approveCod = async () => {
    setBusy(true)
    setError('')
    const noteText = note ? `COD order approved: ${note}` : 'COD order approved for shipping by admin'
    const { error: rpcError } = await supabase.rpc('admin_approve_cod_order', {
      p_order_id: orderId,
      p_note: noteText
    })
    if (rpcError) {
      const { error: fallbackErr } = await supabase.rpc('admin_set_order_status', {
        p_order_id: orderId,
        p_status: 'to_ship',
        p_courier: courier || null,
        p_tracking: tracking || null,
        p_note: noteText
      })
      setBusy(false)
      if (fallbackErr) {
        setError(friendlyError(fallbackErr))
        return
      }
    } else {
      setBusy(false)
    }
    setNote('')
    await load()
    onChanged()
  }

  const resolveReturn = (decision) =>
    call('admin_resolve_return', { p_order_id: orderId, p_decision: decision, p_note: note || null })

  const address = order?.shipping_address || {}
  const isCod = isCodOrder(order)
  const isApproved = isCodOrderApproved(order)

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-xs" onClick={onClose} />
      <aside className="relative w-full max-w-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-l border-neutral-200 dark:border-neutral-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        {!order ? (
          <p className="text-sm text-neutral-400 dark:text-neutral-500">{error || 'Loading…'}</p>
        ) : (
          <>
            <header className="space-y-2 pr-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading text-2xl font-semibold font-mono text-neutral-950 dark:text-white">
                  {order.order_number}
                </h2>
                <button
                  onClick={() => printPackingSlip(order)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Printer size={13} /> Packing slip
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <StatusBadge status={order.status} order={order} />
                <span>{PAYMENT_LABELS[order.payment_status]}</span>
                <span>· {isCod ? 'Cash on Delivery (COD)' : 'PayMongo Online'}</span>
                <span>· {formatDateTime(order.created_at)}</span>
              </div>
            </header>

            {/* COD Verification Banner for 'to_ship' orders */}
            {order.status === 'to_ship' && isCod && (
              <section
                className={`p-4 rounded-2xl border text-xs space-y-3 ${
                  isApproved
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {isApproved ? (
                    <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Clock size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {isApproved ? 'COD Order Approved for Shipping' : 'Cash on Delivery — Pending Store Approval'}
                    </p>
                    <p className="mt-0.5 opacity-90 leading-relaxed">
                      {isApproved
                        ? 'This COD order has been approved by the store. Enter courier details below to dispatch.'
                        : 'Customer requested Cash on Delivery. Please verify their phone and address details before approving this order for fulfillment.'}
                    </p>
                  </div>
                </div>

                {!isApproved && (
                  <button
                    disabled={busy}
                    onClick={approveCod}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold uppercase tracking-wider hover:bg-black dark:hover:bg-neutral-200 transition-colors inline-flex items-center justify-center gap-2 shadow-xs"
                  >
                    <CheckCircle2 size={14} /> Approve Order for Shipping
                  </button>
                )}
              </section>
            )}

            <section className="text-sm space-y-1.5 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Customer & Delivery Address
              </h3>
              <p className="font-medium text-neutral-900 dark:text-white">
                {address.full_name || order.customer_name || 'Customer'}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300 text-xs">
                Phone: <span className="font-mono font-semibold">{address.phone || '—'}</span>
                <br />
                Email: {order.customer_email || '—'}
              </p>
              <p className="text-neutral-600 dark:text-neutral-300 text-xs mt-1">
                {address.address}
                {[address.city, address.province, address.postal_code].filter(Boolean).length > 0 &&
                  `, ${[address.city, address.province, address.postal_code].filter(Boolean).join(', ')}`}
                {address.country && `, ${address.country}`}
              </p>
              {order.gift_note && (
                <p className="text-xs italic text-neutral-500 dark:text-neutral-400 pt-1">
                  Gift note: “{order.gift_note}”
                </p>
              )}
            </section>

            <section>
              <h3 className="font-semibold text-sm mb-2 text-neutral-950 dark:text-white">
                Items ({order.order_items?.length || 0})
              </h3>
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-xl px-3 bg-neutral-50/50 dark:bg-neutral-800/50">
                {order.order_items?.map((i) => (
                  <li key={i.id} className="py-2.5 flex items-center gap-3 text-sm">
                    {i.image_url && (
                      <img
                        src={i.image_url}
                        alt=""
                        className="w-10 h-12 rounded-lg object-cover bg-neutral-100 dark:bg-neutral-800 shrink-0"
                      />
                    )}
                    <span className="flex-1 min-w-0 truncate text-neutral-800 dark:text-neutral-200">
                      {i.name} × {i.quantity}
                    </span>
                    <span className="font-medium tabular-nums text-neutral-900 dark:text-white">
                      {money(i.price * i.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center text-sm mt-2 px-1">
                <span className="text-neutral-500 dark:text-neutral-400 text-xs">
                  {order.payment_method === 'cod' ? 'Payment to collect on delivery' : 'Paid online via PayMongo'}
                </span>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Total{' '}
                  <span className="font-heading text-base font-semibold tabular-nums ml-1 text-neutral-950 dark:text-white">
                    {money(order.total)}
                  </span>
                </p>
              </div>
            </section>

            {order.return_status && (
              <section className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-sm text-rose-900 dark:text-rose-200">
                <strong>{RETURN_LABELS[order.return_status]}</strong>
                {order.return_reason && <p className="text-xs mt-1">“{order.return_reason}”</p>}
              </section>
            )}
            {order.cancel_reason && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Cancel reason: {order.cancel_reason}</p>
            )}

            <section className="space-y-3 border-t border-neutral-100 dark:border-neutral-800 pt-5">
              <h3 className="font-semibold text-sm text-neutral-950 dark:text-white">Fulfillment & Actions</h3>

              {order.status === 'to_ship' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Select Courier
                    </span>
                    <div className="flex gap-1 overflow-x-auto">
                      {POPULAR_COURIERS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCourier(c)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                            courier === c
                              ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 border-transparent font-medium'
                              : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Courier (e.g. LBC, J&T)"
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    />
                    <input
                      placeholder="Tracking number"
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    />
                  </div>
                </div>
              )}

              <input
                placeholder="Note for the customer timeline (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
              />

              <div className="flex flex-wrap gap-2 pt-1">
                {order.status === 'to_pay' && (
                  <button disabled={busy} className={primary} onClick={() => setStatus('to_ship')}>
                    Confirm payment received
                  </button>
                )}

                {order.status === 'to_ship' && isCod && !isApproved && (
                  <button disabled={busy} className={successBtn} onClick={approveCod}>
                    <CheckCircle2 size={13} /> Approve COD Order
                  </button>
                )}

                {order.status === 'to_ship' && (
                  <button disabled={busy} className={primary} onClick={() => setStatus('to_receive')}>
                    <Truck size={13} /> Mark Shipped (Dispatch)
                  </button>
                )}

                {order.status === 'to_receive' && (
                  <button disabled={busy} className={primary} onClick={() => setStatus('completed')}>
                    <CheckCircle2 size={13} /> Mark Delivered
                  </button>
                )}

                {['to_pay', 'to_ship', 'to_receive'].includes(order.status) && (
                  <button
                    disabled={busy}
                    className={danger}
                    onClick={() => window.confirm('Cancel this order and restore stock?') && setStatus('cancelled')}
                  >
                    Cancel order
                  </button>
                )}

                {order.status === 'return_refund' && order.return_status === 'requested' && (
                  <>
                    <button disabled={busy} className={primary} onClick={() => resolveReturn('approved')}>
                      Approve return
                    </button>
                    <button disabled={busy} className={danger} onClick={() => resolveReturn('rejected')}>
                      Decline
                    </button>
                  </>
                )}
                {order.status === 'return_refund' && order.return_status === 'approved' && (
                  <button disabled={busy} className={primary} onClick={() => resolveReturn('refunded')}>
                    Mark refunded
                  </button>
                )}
                {order.payment_status === 'refund_pending' && (
                  <button disabled={busy} className={primary} onClick={() => call('admin_mark_refunded', { p_order_id: orderId })}>
                    Mark refund issued
                  </button>
                )}
              </div>
              {order.payment_status === 'refund_pending' || order.return_status === 'approved' ? (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Issue the actual refund from your PayMongo dashboard, then record it here.
                </p>
              ) : null}
              {error && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </section>

            <section>
              <h3 className="font-semibold text-sm mb-3 text-neutral-950 dark:text-white">Timeline</h3>
              <ol className="space-y-3 border-l border-neutral-200 dark:border-neutral-700 ml-1.5">
                {order.order_events?.map((ev) => (
                  <li key={ev.id} className="pl-4 relative">
                    <span
                      className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${
                        /approved/i.test(ev.note || '')
                          ? 'bg-emerald-600'
                          : 'bg-neutral-950 dark:bg-white'
                      }`}
                    />
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{ev.note || ev.status}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{formatDateTime(ev.created_at)}</p>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </aside>
    </div>
  )
}

const AdminOrders = () => {
  const { supabase } = useSupabase()
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [shippingFilter, setShippingFilter] = useState('all') // 'all' | 'cod_pending' | 'ready'
  const [busyId, setBusyId] = useState(null)
  const [openId, setOpenId] = useState(searchParams.get('order'))
  const { lastUpdated, refresh } = useAdminAlerts()

  const tab = searchParams.get('status') || 'all'

  const load = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items (*), order_events (*)')
      .order('created_at', { ascending: false })
    if (fetchError) setError(fetchError.message)
    setOrders(data || [])
    setLoading(false)
  }, [supabase])

  // Real-time synchronization: listen for new buyer checkout orders and timeline events
  useEffect(() => {
    load()
    const channel = supabase
      .channel('admin-orders-realtime-listener')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        load()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_events' }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, load, lastUpdated])

  // Quick single-click approve COD from the table
  const handleQuickApprove = async (orderId, e) => {
    if (e) e.stopPropagation()
    setBusyId(orderId)
    setError('')
    const { error: rpcError } = await supabase.rpc('admin_approve_cod_order', {
      p_order_id: orderId,
      p_note: 'COD order approved for shipping by admin'
    })
    if (rpcError) {
      const { error: fallbackErr } = await supabase.rpc('admin_set_order_status', {
        p_order_id: orderId,
        p_status: 'to_ship',
        p_courier: null,
        p_tracking: null,
        p_note: 'COD order approved for shipping by admin'
      })
      if (fallbackErr) {
        setBusyId(null)
        setError(friendlyError(fallbackErr))
        return
      }
    }
    setBusyId(null)
    await load()
    refresh()
  }

  const counts = useMemo(() => {
    const result = { all: orders.length, cod_pending: 0, ready_to_ship: 0 }
    orders.forEach((o) => {
      result[o.status] = (result[o.status] || 0) + 1
      if (o.status === 'to_ship') {
        if (isCodOrder(o) && !isCodOrderApproved(o)) {
          result.cod_pending += 1
        } else {
          result.ready_to_ship += 1
        }
      }
    })
    return result
  }, [orders])

  const needle = query.trim().toLowerCase()
  const visible = orders.filter((o) => {
    const matchesTab = tab === 'all' || o.status === tab
    if (!matchesTab) return false

    // Sub-filter under 'to_ship' (Shipping) tab
    if (tab === 'to_ship') {
      const isCod = isCodOrder(o)
      const approved = isCodOrderApproved(o)
      if (shippingFilter === 'cod_pending' && (!isCod || approved)) return false
      if (shippingFilter === 'ready' && isCod && !approved) return false
    }

    if (!needle) return true
    const searchTarget = `${o.order_number} ${o.customer_name} ${o.customer_email} ${o.payment_method}`.toLowerCase()
    return searchTarget.includes(needle)
  })

  const isShippingView = tab === 'to_ship'

  return (
    <div className="space-y-6 w-full">
      {/* Top Header / View Banner for Shipping */}
      {isShippingView && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white border border-neutral-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Truck size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-xl font-bold tracking-tight">Shipping &amp; Fulfillment</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white">
                  {counts.to_ship || 0} Orders
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                Review buyer delivery details, approve Cash on Delivery (COD) transactions, and dispatch couriers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {counts.cod_pending > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold">
                <Clock size={13} className="animate-pulse" />
                {counts.cod_pending} COD Awaiting Approval
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="flex gap-1 overflow-x-auto pb-1 max-w-full">
          {ORDER_TABS.map(({ key, label }) => {
            const isSelected = tab === key
            const isShipping = key === 'to_ship'
            return (
              <button
                key={key}
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setSearchParams(key === 'all' ? {} : { status: key })
                  setShippingFilter('all')
                }}
                className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                {isShipping && <Truck size={13} className={isSelected ? 'text-white dark:text-neutral-950' : 'text-neutral-400'} />}
                <span>{label}</span>
                {counts[key] ? (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white dark:bg-neutral-900/20 dark:text-neutral-950'
                        : isShipping && counts.cod_pending > 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {counts[key]}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order, customer, email…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white"
            />
          </div>
          <button
            onClick={refresh}
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
            aria-label="Refresh orders"
            title="Refresh orders"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() =>
              downloadCsv(
                'zion-orders.csv',
                visible.map((o) => ({
                  order: o.order_number,
                  date: o.created_at,
                  customer: o.customer_name,
                  email: o.customer_email,
                  status: o.status,
                  payment: o.payment_status,
                  method: o.payment_method,
                  total: o.total,
                  items_count: o.order_items?.length || 0,
                  courier: o.courier || '',
                  tracking: o.tracking_number || ''
                }))
              )
            }
            disabled={visible.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Sub-filter chips for Shipping / To Ship */}
      {isShippingView && (
        <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
          <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mr-1">
            Filter:
          </span>
          <button
            onClick={() => setShippingFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              shippingFilter === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            All Shipping ({counts.to_ship || 0})
          </button>
          <button
            onClick={() => setShippingFilter('cod_pending')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              shippingFilter === 'cod_pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
            }`}
          >
            <Clock size={12} />
            COD Awaiting Approval ({counts.cod_pending})
          </button>
          <button
            onClick={() => setShippingFilter('ready')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              shippingFilter === 'ready'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 size={12} />
            Ready for Dispatch ({counts.ready_to_ship})
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Orders Table */}
      <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-xs overflow-x-auto transition-colors">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-semibold border-b border-neutral-100 dark:border-neutral-800">
            <tr>
              <th className="p-4">Order</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Items to Ship</th>
              <th className="p-4">Payment &amp; Verification</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-neutral-400 dark:text-neutral-500">
                  <div className="inline-block w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-2" />
                  <p className="text-xs">Loading orders…</p>
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-neutral-400 dark:text-neutral-500 space-y-2">
                  <Truck size={28} className="mx-auto text-neutral-300 dark:text-neutral-600" />
                  <p className="text-sm font-medium">
                    {isShippingView
                      ? shippingFilter === 'cod_pending'
                        ? 'No Cash on Delivery orders awaiting approval.'
                        : 'No orders awaiting shipment.'
                      : 'No orders match this filter.'}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    When customers complete checkout, transactions will appear here in real time.
                  </p>
                </td>
              </tr>
            ) : (
              visible.map((o) => {
                const isCod = isCodOrder(o)
                const isApproved = isCodOrderApproved(o)
                const address = o.shipping_address || {}
                const items = o.order_items || []
                const firstItem = items[0]
                const isBusy = busyId === o.id

                return (
                  <tr
                    key={o.id}
                    onClick={() => setOpenId(o.id)}
                    className="cursor-pointer hover:bg-neutral-50/80 dark:hover:bg-neutral-800/60 transition-colors"
                  >
                    {/* Order Number & Date */}
                    <td className="p-4">
                      <span className="font-mono font-semibold text-neutral-950 dark:text-white block">
                        {o.order_number}
                      </span>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 block">
                        {formatDate(o.created_at)}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">
                        {o.customer_name || address.full_name || 'Customer'}
                      </p>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate max-w-[180px]">
                        {o.customer_email || address.phone || '—'}
                      </p>
                      {address.city && (
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {address.city}{address.province ? `, ${address.province}` : ''}
                        </p>
                      )}
                    </td>

                    {/* Items Preview */}
                    <td className="p-4">
                      {items.length === 0 ? (
                        <span className="text-xs text-neutral-400">Order items</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {firstItem?.image_url && (
                            <img
                              src={firstItem.image_url}
                              alt=""
                              className="w-9 h-11 rounded-lg object-cover bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-700"
                            />
                          )}
                          <div className="min-w-0 max-w-[200px]">
                            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                              {firstItem?.name}
                            </p>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                              Qty {firstItem?.quantity}
                              {items.length > 1 && ` · +${items.length - 1} more item${items.length > 2 ? 's' : ''}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Payment & Approval Status */}
                    <td className="p-4">
                      {isCod ? (
                        isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <CheckCircle2 size={12} /> COD · Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                            <Clock size={12} className="animate-pulse text-amber-600 dark:text-amber-400" />
                            COD · Needs Approval
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                          {PAYMENT_LABELS[o.payment_status] || 'Paid Online'}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <StatusBadge status={o.status} order={o} />
                    </td>

                    {/* Total Price */}
                    <td className="p-4 text-right font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {money(o.total)}
                    </td>

                    {/* Action Column */}
                    <td className="p-4 text-right whitespace-nowrap">
                      {o.status === 'to_ship' && isCod && !isApproved ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={(e) => handleQuickApprove(o.id, e)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
                          title="Approve this Cash on Delivery order to be shipped"
                        >
                          <CheckCircle2 size={13} />
                          {isBusy ? 'Saving…' : 'Approve'}
                        </button>
                      ) : o.status === 'to_ship' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenId(o.id)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-black dark:hover:bg-neutral-200 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
                        >
                          <Truck size={13} /> Ship
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenId(o.id)
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors"
                        >
                          Details
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {openId && (
        <OrderPanel
          orderId={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => {
            load()
            refresh()
          }}
        />
      )}
    </div>
  )
}

export default AdminOrders
