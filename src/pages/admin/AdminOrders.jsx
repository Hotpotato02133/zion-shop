import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { useSupabase } from '../../context/SupabaseContext'
import StatusBadge from '../../components/orders/StatusBadge'
import {
  ORDER_TABS, PAYMENT_LABELS, RETURN_LABELS, formatDate, formatDateTime, friendlyError, money
} from '../../lib/orders'

const btn = 'px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider disabled:opacity-60'
const primary = `${btn} bg-neutral-950 text-white hover:bg-black`
const danger = `${btn} border border-red-200 text-red-700 hover:bg-red-50`

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

  useEffect(() => { load() }, [load])

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
      p_order_id: orderId, p_status: status, p_courier: courier || null, p_tracking: tracking || null, p_note: note || null
    })
  const resolveReturn = (decision) =>
    call('admin_resolve_return', { p_order_id: orderId, p_decision: decision, p_note: note || null })

  const address = order?.shipping_address || {}

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-neutral-950/50" onClick={onClose} />
      <aside className="relative w-full max-w-lg bg-white h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100" aria-label="Close"><X size={16} /></button>
        {!order ? (
          <p className="text-sm text-neutral-400">{error || 'Loading…'}</p>
        ) : (
          <>
            <header className="space-y-2 pr-8">
              <h2 className="font-heading text-2xl font-extrabold font-mono">{order.order_number}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                <StatusBadge status={order.status} />
                <span>{PAYMENT_LABELS[order.payment_status]}</span>
                <span>· {order.payment_method === 'cod' ? 'COD' : 'PayMongo'}</span>
                <span>· {formatDateTime(order.created_at)}</span>
              </div>
            </header>

            <section className="text-sm space-y-1">
              <h3 className="font-bold">Customer</h3>
              <p className="text-neutral-600">
                {address.full_name} · {address.phone}<br />
                {order.customer_email}<br />
                {address.address}, {[address.city, address.province, address.postal_code].filter(Boolean).join(', ')}, {address.country}
              </p>
              {order.gift_note && <p className="text-xs italic text-neutral-500">Gift note: “{order.gift_note}”</p>}
            </section>

            <section>
              <h3 className="font-bold text-sm mb-2">Items</h3>
              <ul className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl px-3">
                {order.order_items.map(i => (
                  <li key={i.id} className="py-2.5 flex items-center gap-3 text-sm">
                    {i.image_url && <img src={i.image_url} alt="" className="w-10 h-12 rounded-lg object-cover bg-neutral-100" />}
                    <span className="flex-1 min-w-0 truncate">{i.name} × {i.quantity}</span>
                    <span className="font-semibold">{money(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-right text-sm mt-2">Total <strong className="font-heading text-lg">{money(order.total)}</strong></p>
            </section>

            {order.return_status && (
              <section className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-900">
                <strong>{RETURN_LABELS[order.return_status]}</strong>
                {order.return_reason && <p className="text-xs mt-1">“{order.return_reason}”</p>}
              </section>
            )}
            {order.cancel_reason && <p className="text-xs text-neutral-500">Cancel reason: {order.cancel_reason}</p>}

            <section className="space-y-3 border-t border-neutral-100 pt-5">
              <h3 className="font-bold text-sm">Actions</h3>

              {order.status === 'to_ship' && (
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Courier (e.g. LBC, J&T)" value={courier} onChange={e => setCourier(e.target.value)} className="p-3 rounded-xl border border-neutral-200 text-sm" />
                  <input placeholder="Tracking number" value={tracking} onChange={e => setTracking(e.target.value)} className="p-3 rounded-xl border border-neutral-200 text-sm" />
                </div>
              )}
              <input placeholder="Note for the customer timeline (optional)" value={note} onChange={e => setNote(e.target.value)} className="w-full p-3 rounded-xl border border-neutral-200 text-sm" />

              <div className="flex flex-wrap gap-2">
                {order.status === 'to_pay' && <button disabled={busy} className={primary} onClick={() => setStatus('to_ship')}>Confirm payment received</button>}
                {order.status === 'to_ship' && <button disabled={busy} className={primary} onClick={() => setStatus('to_receive')}>Mark shipped</button>}
                {order.status === 'to_receive' && <button disabled={busy} className={primary} onClick={() => setStatus('completed')}>Mark delivered</button>}
                {['to_pay', 'to_ship', 'to_receive'].includes(order.status) && (
                  <button disabled={busy} className={danger} onClick={() => window.confirm('Cancel this order and restore stock?') && setStatus('cancelled')}>Cancel order</button>
                )}
                {order.status === 'return_refund' && order.return_status === 'requested' && (
                  <>
                    <button disabled={busy} className={primary} onClick={() => resolveReturn('approved')}>Approve return</button>
                    <button disabled={busy} className={danger} onClick={() => resolveReturn('rejected')}>Decline</button>
                  </>
                )}
                {order.status === 'return_refund' && order.return_status === 'approved' && (
                  <button disabled={busy} className={primary} onClick={() => resolveReturn('refunded')}>Mark refunded</button>
                )}
                {order.payment_status === 'refund_pending' && (
                  <button disabled={busy} className={primary} onClick={() => call('admin_mark_refunded', { p_order_id: orderId })}>Mark refund issued</button>
                )}
              </div>
              {order.payment_status === 'refund_pending' || order.return_status === 'approved' ? (
                <p className="text-xs text-neutral-500">Issue the actual refund from your PayMongo dashboard, then record it here.</p>
              ) : null}
              {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
            </section>

            <section>
              <h3 className="font-bold text-sm mb-3">Timeline</h3>
              <ol className="space-y-3 border-l border-neutral-200 ml-1.5">
                {order.order_events.map(ev => (
                  <li key={ev.id} className="pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-neutral-950" />
                    <p className="text-sm">{ev.note || ev.status}</p>
                    <p className="text-xs text-neutral-400">{formatDateTime(ev.created_at)}</p>
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
  const [openId, setOpenId] = useState(null)

  const tab = searchParams.get('status') || 'all'

  const load = useCallback(async () => {
    const { data, error: fetchError } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (fetchError) setError(fetchError.message)
    setOrders(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const counts = useMemo(() => {
    const result = { all: orders.length }
    orders.forEach(o => { result[o.status] = (result[o.status] || 0) + 1 })
    return result
  }, [orders])

  const needle = query.trim().toLowerCase()
  const visible = orders.filter(o =>
    (tab === 'all' || o.status === tab) &&
    (!needle || `${o.order_number} ${o.customer_name} ${o.customer_email}`.toLowerCase().includes(needle))
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="flex gap-1 overflow-x-auto">
          {ORDER_TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setSearchParams(key === 'all' ? {} : { status: key })}
              className={`shrink-0 px-3 py-2 rounded-full text-xs font-semibold ${tab === key ? 'bg-neutral-950 text-white' : 'bg-white border border-neutral-200 text-neutral-600'}`}
            >
              {label} {counts[key] ? `(${counts[key]})` : ''}
            </button>
          ))}
        </div>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search order, name, email…" className="w-full sm:w-72 p-3 rounded-xl border border-neutral-200 bg-white text-sm" />
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wider text-neutral-400">
            <tr><th className="p-4">Order</th><th className="p-4">Customer</th><th className="p-4">Date</th><th className="p-4">Payment</th><th className="p-4">Status</th><th className="p-4 text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-400">Loading…</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-400">No orders match.</td></tr>
            ) : visible.map(o => (
              <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer hover:bg-neutral-50">
                <td className="p-4 font-mono font-bold">{o.order_number}</td>
                <td className="p-4">{o.customer_name}<span className="block text-xs text-neutral-400">{o.customer_email}</span></td>
                <td className="p-4 text-neutral-500">{formatDate(o.created_at)}</td>
                <td className="p-4 text-xs">{PAYMENT_LABELS[o.payment_status]}</td>
                <td className="p-4"><StatusBadge status={o.status} /></td>
                <td className="p-4 text-right font-semibold">{money(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openId && <OrderPanel orderId={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  )
}

export default AdminOrders
