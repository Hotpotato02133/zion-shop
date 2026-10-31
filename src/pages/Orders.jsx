import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { useSupabase } from '../context/SupabaseContext'
import OrderActions from '../components/orders/OrderActions'
import StatusBadge from '../components/orders/StatusBadge'
import { ORDER_TABS, STATUS_META, formatDate, money } from '../lib/orders'

const Orders = () => {
  const { supabase, isConfigured } = useSupabase()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')

  const load = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items (id, name, image_url, price, quantity)')
      .order('created_at', { ascending: false })
    if (fetchError) setError(fetchError.message)
    else setOrders(data || [])
    setLoading(false)
  }, [supabase, isConfigured])

  useEffect(() => { load() }, [load])

  const counts = useMemo(() => {
    const result = { all: orders.length }
    orders.forEach(o => { result[o.status] = (result[o.status] || 0) + 1 })
    return result
  }, [orders])

  const visible = tab === 'all' ? orders : orders.filter(o => o.status === tab)

  const replaceOrder = (updated) => {
    if (!updated) return
    setOrders(prev => prev.map(o => (o.id === updated.id ? { ...o, ...updated } : o)))
  }

  return (
    <div className="min-h-screen w-full pt-10 pb-20 bg-white text-neutral-950 font-body overflow-x-clip">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest font-semibold text-neutral-400 block mb-2">Account</span>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight">My Orders</h1>
        </div>

        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-neutral-100 mb-6">
          {ORDER_TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                tab === key ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {label}
              {counts[key] ? <span className="ml-1.5 text-[10px] text-neutral-400">({counts[key]})</span> : null}
            </button>
          ))}
        </div>

        {loading && <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-neutral-100 border-t-black animate-spin" /></div>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        {!loading && !error && visible.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <Package size={32} strokeWidth={1.5} />
            </div>
            <p className="text-sm text-neutral-500">
              {tab === 'all' ? "You haven't placed any orders yet." : `No orders under ${ORDER_TABS.find(t => t.key === tab)?.label}.`}
            </p>
            <Link to="/products" className="inline-block px-6 py-3 rounded-full bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider">
              Start shopping
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {visible.map(order => (
            <article key={order.id} className="p-5 sm:p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link to={`/orders/${order.id}`} className="font-mono text-sm font-bold hover:underline">{order.order_number}</Link>
                  <p className="text-xs text-neutral-400">Placed {formatDate(order.created_at)}</p>
                </div>
                <StatusBadge status={order.status} />
              </header>

              <ul className="divide-y divide-neutral-50">
                {(order.order_items || []).map(item => (
                  <li key={item.id} className="flex gap-3 items-center py-2.5">
                    {item.image_url && <img src={item.image_url} alt="" className="w-12 h-14 rounded-lg object-cover bg-neutral-100" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-neutral-400">Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm">{money(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <footer className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
                <div>
                  <p className="text-xs text-neutral-400">{STATUS_META[order.status]?.hint}</p>
                  <p className="text-sm">Total <strong className="font-heading text-lg">{money(order.total)}</strong></p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <OrderActions order={order} onUpdated={replaceOrder} />
                  <Link to={`/orders/${order.id}`} className="px-5 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-50">
                    Details
                  </Link>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Orders
