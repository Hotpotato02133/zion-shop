import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, DollarSign, PackageCheck, RotateCcw, ShoppingBag } from 'lucide-react'
import { useSupabase } from '../../context/SupabaseContext'
import StatusBadge from '../../components/orders/StatusBadge'
import { ORDER_TABS, formatDate, money } from '../../lib/orders'

const LOW_STOCK = 5

const Stat = ({ icon, label, value, to }) => (
  <Link to={to} className="p-5 rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between text-neutral-400">
      <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      {React.createElement(icon, { size: 16 })}
    </div>
    <p className="font-heading text-3xl font-extrabold mt-3">{value}</p>
  </Link>
)

const AdminDashboard = () => {
  const { supabase } = useSupabase()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.from('orders').select('id, order_number, status, payment_status, total, customer_name, created_at').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, stock, is_active')
    ]).then(([o, p]) => {
      if (cancelled) return
      if (o.error || p.error) setError((o.error || p.error).message)
      setOrders(o.data || [])
      setProducts(p.data || [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [supabase])

  const stats = useMemo(() => {
    const byStatus = {}
    orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1 })
    const revenue = orders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + Number(o.total), 0)
    return { byStatus, revenue }
  }, [orders])

  const lowStock = products.filter(p => p.is_active && p.stock <= LOW_STOCK).sort((a, b) => a.stock - b.stock)

  if (loading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-neutral-200 border-t-black animate-spin" /></div>

  return (
    <div className="space-y-8">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={DollarSign} label="Paid revenue" value={money(stats.revenue)} to="/admin/orders" />
        <Stat icon={ShoppingBag} label="Total orders" value={orders.length} to="/admin/orders" />
        <Stat icon={PackageCheck} label="To ship" value={stats.byStatus.to_ship || 0} to="/admin/orders?status=to_ship" />
        <Stat icon={RotateCcw} label="Returns open" value={stats.byStatus.return_refund || 0} to="/admin/orders?status=return_refund" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 p-5 rounded-2xl bg-white border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold underline">View all</Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-neutral-500 py-6 text-center">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {orders.slice(0, 6).map(o => (
                <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold">{o.order_number}</p>
                    <p className="text-xs text-neutral-400 truncate">{o.customer_name} · {formatDate(o.created_at)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-semibold w-20 text-right">{money(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="p-5 rounded-2xl bg-white border border-neutral-100 shadow-sm">
            <h2 className="font-heading text-lg font-bold mb-3">Orders by status</h2>
            <ul className="space-y-2 text-sm">
              {ORDER_TABS.filter(t => t.key !== 'all').map(t => (
                <li key={t.key} className="flex justify-between">
                  <span className="text-neutral-500">{t.label}</span>
                  <span className="font-semibold">{stats.byStatus[t.key] || 0}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="p-5 rounded-2xl bg-white border border-neutral-100 shadow-sm">
            <h2 className="font-heading text-lg font-bold mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" /> Low stock
            </h2>
            {lowStock.length === 0 ? (
              <p className="text-sm text-neutral-500">All products are well stocked.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {lowStock.slice(0, 6).map(p => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span className="truncate">{p.name}</span>
                    <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : 'text-amber-700'}`}>{p.stock} left</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
